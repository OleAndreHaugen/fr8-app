import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

const supabase = createClient();

// Basic types for our chat application
export interface TextContent {
  type: "text";
  text: string;
}

export interface FileContent {
  type: "file";
  data: string;
  mimeType: string;
  filename: string;
}

export interface ImageContent {
  type: "image";
  image: string;
  mimeType: string;
}

export type MessageContent = TextContent | FileContent | ImageContent;

export interface Message {
  id: string;
  content: string | MessageContent[];
  role: "user" | "assistant" | "system";
  created_at: string;
  waiting?: boolean; // New field to indicate if message is waiting for user input
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
  waiting?: boolean; // Indicates if conversation is waiting for user input
}

// Database types
type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];


function isJson(content: any) {
  if (typeof content === 'object' && content !== null) {
    // Already an object or array
    return Array.isArray(content) || Object.prototype.toString.call(content) === '[object Object]';
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }

  return false;
}

async function fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<any> {

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (networkError) {
    console.error("Network error:", networkError);
    // Throw a structured error for network issues
    throw { isNetworkError: true, message: "Failed to connect to the server. Please check your network.", status: 0 };
  }

  if (!response.ok) {
    let errorBody: any = { message: `API request failed: ${response.status} ${response.statusText}`, statusText: response.statusText };
    try {
      // Attempt to parse JSON body even for errors
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonError = await response.json();
        // Use parsed JSON error structure if available
        errorBody = {
          ...jsonError, // Include fields like status, message from API
          statusText: response.statusText, // Keep original statusText
        };
        console.log("Parsed API error response:", errorBody);
      } else {
        // Fallback for non-JSON error responses
        const textError = await response.text();
        errorBody.message = textError || errorBody.message;
        console.log("Non-JSON API error response:", textError);
      }
    } catch (parseError) {
      console.error("Failed to parse error response body:", parseError);
      // Keep the basic message if parsing fails
    }
    // Throw a structured error including the status code and parsed/fallback body
    throw { ...errorBody, status: response.status, isApiError: true };
  }

  // Handle successful empty or non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (response.status === 204 || !contentType) {
      return { success: true };
    }
    const text = await response.text();
    if (!text.trim()) {
      return { success: true };
    }
    // Consider throwing an error here if JSON was expected but not received?
    // For now, let's return success, but log a warning.
    console.warn(`API returned non-JSON response for ${url}, status: ${response.status}`);
    return { success: true, nonJsonResponse: text };
  }

  return response.json();
}

// Function to create a streaming assistant response
export async function createAssistantStream(
  messages: { role: string; content: string | MessageContent[] }[],
  conversationId: string,
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {

  // Create headers with auth if available
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  });

  // Build request body with optional debug parameter
  const requestBody: any = { messages, conversationId };

  const response = await fetch(`/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    let errorDetails = `API request failed: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorDetails = errorData.message;
      }
    } catch (e) {
      // Ignore if error response is not JSON
    }
    throw new Error(errorDetails);
  }

  // Check if response is streaming or regular JSON
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/json')) {
    // Non-streaming response - convert JSON to stream
    const jsonData = await response.json();
    let content = jsonData.content || '';

    if (isJson(content)) {
      // If content is already an object, stringify it; if it's a JSON string, parse and re-stringify
      const jsonObj = typeof content === 'string' ? JSON.parse(content) : content;
      content = `\`\`\`json:Response\n${JSON.stringify(jsonObj, null, 2)}\n\`\`\``;
    }

    // Create a ReadableStream that emits the content
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(content));
        controller.close();
      }
    });
  }

  if (!response.body) {
    throw new Error('Stream not supported by the response');
  }

  return response.body;
}


// Helper function to convert database row to Message
function messageRowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    content: row.content,
    role: row.role,
    created_at: row.created_at,
    waiting: false
  };
}

// Helper function to convert database row to Conversation with messages
function conversationRowToConversation(row: ConversationRow, messages: MessageRow[] = []): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: messages.map(messageRowToMessage),
    created_at: row.created_at,
    updated_at: row.updated_at,
    waiting: false
  };
}

// Chat client for managing conversations and messages
export const chatClient = {
  conversations: {
    getAll: async (): Promise<Conversation[]> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Convert database rows to Conversation objects
      return data.map(row => conversationRowToConversation(row));
    },

    get: async (id: string): Promise<Conversation> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Get conversation (with user check)
      const { data: conversationData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (convError) throw convError;

      // Get messages for this conversation
      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      return conversationRowToConversation(conversationData, messagesData);
    },

    create: async (title: string = "New Chat"): Promise<Conversation> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Get user's account_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single();

      const insertData: ConversationInsert = {
        user_id: user.id,
        title,
        account_id: profile?.account_id || null
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return conversationRowToConversation(data);
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    },

    clear: async (id: string): Promise<void> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // First verify the conversation belongs to the user
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (convError) throw convError;

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      if (error) throw error;
    },

    update: async (id: string, data: { title: string }): Promise<void> => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('conversations')
        .update({ 
          title: data.title,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
  },

  messages: {
    getLastMessages: async (conversationId: string, limit = 100): Promise<Message[]> => {
      const conversation = await chatClient.conversations.get(conversationId);
      return conversation.messages.slice(-limit);
    },

    sendMessage: async (
      conversationId: string,
      content: string | MessageContent[],
      existingMessages?: Message[],
      signal?: AbortSignal,
    ): Promise<ReadableStream<Uint8Array>> => {

      // Create user message content
      const userMessage = {
        role: 'user' as const,
        content
      };

      // Process existing messages if provided
      let contextMessages: { role: string; content: string | MessageContent[] }[] = [];

      if (existingMessages && Array.isArray(existingMessages)) {
        // Format the existing messages for the API
        const formattedMessages = existingMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Add the current user message
        contextMessages = [...formattedMessages, userMessage];

        // Take only the last 10 messages
        contextMessages = contextMessages.slice(-10);
      } else {
        // If no existing messages provided, just use the current message
        contextMessages = [userMessage];
      }

      return createAssistantStream(
        contextMessages,
        conversationId,
        signal
      );
    }
  }
};