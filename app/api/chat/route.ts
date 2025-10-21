import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { fuelAnalysisTool } from './tools/fuel-analysis';
import { systemPrompt } from './system-prompt';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { messages, conversationId }: { messages: any[]; conversationId: string } = await req.json();
        
    // Convert messages to proper format for AI SDK
    const uiMessages: UIMessage[] = messages.map((msg: any, index: number) => {

         // Ensure we have a valid message object
      if (!msg || typeof msg !== 'object') {
        console.error(`Invalid message at index ${index}:`, msg);
        return {
          id: crypto.randomUUID(),
          role: 'user' as const,
          content: 'Invalid message',
          parts: [{ type: 'text', text: 'Invalid message' }]
        };
      }       
      
      // Handle different message formats
      if (msg.role && msg.content !== undefined) {
        return {
          id: msg.id || crypto.randomUUID(),
          role: msg.role,
          content: msg.content,
          parts: [{ type: 'text', text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
        };
      }
          
      return {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: 'Invalid message',
        parts: [{ type: 'text', text: 'Invalid message' }]
      };
    
    });
       
    // Validate that we have valid messages
    if (uiMessages.length === 0) {
      console.error('No valid messages found after conversion');
      return new Response('No valid messages provided', { status: 400 });
    }
    
    // Try using messages directly first, then convert if needed
    let modelMessages = convertToModelMessages(uiMessages);
    
    // Save the user message to database
    const lastUserMessage = uiMessages[uiMessages.length - 1];

    if (lastUserMessage && lastUserMessage.role === 'user') {
      try {
        const { error: userMsgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: (lastUserMessage as any).content,
            attachments: []
          });
        
        if (userMsgError) {
          console.error('Error saving user message:', userMsgError);
        }
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }
    
    // Stream response from Gemini with fuel analysis tool
    const result = await streamText({
      model: google('gemini-2.5-flash'),
      messages: modelMessages,
      system: systemPrompt,
      temperature: 0.3,
      tools: {
        fuelAnalysis: fuelAnalysisTool,
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(10),
      onFinish: (res) => {

        
      },
      onError: (e) => {
        console.log("AI Agents Error:", JSON.stringify(e));
      },
    });

    // Create a custom stream that processes the AI response server-side
    const encoder = new TextEncoder();
    let assistantResponse = ''; // Accumulate the assistant's response
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use fullStream instead of textStream for tool support
          for await (const part of result.fullStream) {
            switch (part.type) {
              case "text-delta":
                // Send text content directly to client
                controller.enqueue(encoder.encode(part.text));
                // Accumulate the response for saving
                assistantResponse += part.text;
                break;

              case "tool-call":
                // Handle tool calls - you can customize this based on your needs
                //const toolMsg = `\n\n🔧 **Tool Call**: ${part.toolName}\n`;
                //controller.enqueue(encoder.encode(toolMsg));
                // Add tool call to response
                //assistantResponse += toolMsg;
                break;

              case "tool-result":
                // Handle tool results - you can customize this based on your needs
                //console.log("Tool result:", part.output);
                break;

              case "error":
                const errorMsg = `\n\n### Stream Error:\n\n${part.error}\n`;
                controller.enqueue(encoder.encode(errorMsg));
                assistantResponse += errorMsg;
                break;

              case "finish":
                // Stream finished - save the assistant response
                try {
                  if (assistantResponse.trim()) {
                    const { error: assistantMsgError } = await supabase
                      .from('messages')
                      .insert({
                        conversation_id: conversationId,
                        role: 'assistant',
                        content: assistantResponse.trim(),
                        attachments: []
                      });
                    
                    if (assistantMsgError) {
                      console.error('Error saving assistant message:', assistantMsgError);
                    }
                  }
                } catch (saveError) {
                  console.error('Error saving assistant message:', saveError);
                }
                break;
            }
          }
          
          // Close the stream
          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          const errorMsg = `\n\n### Stream Error:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n`;
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
