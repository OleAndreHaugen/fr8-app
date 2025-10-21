"use client";

import { useState, FormEvent, useRef, useEffect, ChangeEvent, ClipboardEvent } from "react";
import { Send, Paperclip, X, Image, FileText, Square } from "lucide-react";
import { chatClient, type MessageContent, type Message, ImageContent, FileContent } from "../api/chat-client";

// Error details structure
interface ErrorDetails {
  title: string;
  message: string;
}

// File attachment structure
interface FileAttachment {
  name: string;
  type: "file" | "image"; // Type of attachment (file or image)
  data: string;         // Base64 data for files
  mimeType: string;     // MIME type (e.g., "application/pdf", "image/png")
  filename?: string;    // Optional filename (for files)
  image?: string;       // Base64 data for images
}

// Updated Props for simplified callbacks
interface ChatInputProps {
  conversationId: string;
  onAddUserMessage: (message: Message) => void;
  onStreamStart: () => void;
  onStreamUpdate: (chunk: string) => void;
  onStreamEnd: (finalContent: string) => void;
  onError: (details: ErrorDetails) => void;
  messages?: Message[];
  isStreaming?: boolean;
  onStopStreaming?: () => void;
  disabled?: boolean; // New prop for waiting mode
}

export default function ChatInput({
  conversationId,
  onAddUserMessage,
  onStreamStart,
  onStreamUpdate,
  onStreamEnd,
  onError,
  messages,
  isStreaming,
  onStopStreaming,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if the attachment is an image
  const isImageAttachment = attachment?.type === "image";

  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Handle file upload
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      onError({
        title: "Unsupported File Type",
        message: "Only images (PNG, JPG, GIF, etc.) and PDF files are supported at this time."
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError({
        title: "File Too Large",
        message: "The selected file exceeds the 10MB size limit. Please choose a smaller file."
      });
      return;
    }

    try {
      const base64data = await fileToBase64(file);

      if (isImage) {
        setAttachment({
          name: file.name,
          type: "image",
          mimeType: file.type,
          data: base64data,
          image: base64data
        });
      } else {
        setAttachment({
          name: file.name,
          type: "file",
          mimeType: file.type,
          data: base64data,
          filename: file.name
        });
      }
    } catch (error) {
      console.error('File processing error:', error);
      onError({
        title: "File Processing Error",
        message: "There was an unexpected error processing your file. Please try again."
      });
    }
  };

  // Handle clipboard paste events
  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      const trimmedItemType = item.type.trim(); // Trim the item type

      if (trimmedItemType.includes('image')) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > 5 * 1024 * 1024) {
          onError({
            title: "Image Too Large",
            message: "The pasted image exceeds the 5MB size limit. Please paste a smaller image."
          });
          return;
        }
        try {
          const base64data = await fileToBase64(file);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `pasted-image-${timestamp}.${trimmedItemType.split('/')[1] || 'png'}`;

          setAttachment({
            name: filename,
            type: "image",
            mimeType: trimmedItemType,
            data: base64data,
            image: base64data
          });
          return;
        } catch (error) {
          console.error('Error processing pasted image:', error);
          onError({
            title: "Image Processing Error",
            message: "There was an unexpected error processing the pasted image. Please try again."
          });
        }
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isSubmitting || disabled) return;

    let accumulatedResponse = "";
    let errorOccurred = false;
    let finalErrorMessage = "";

    try {
      setIsSubmitting(true);

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const userMessageText = input.trim();
      let messageContentParts: MessageContent[] = [];

      if (userMessageText) {
        messageContentParts.push({ type: "text", text: userMessageText });
      }

      if (attachment) {
        if (attachment.type === "image") {
          messageContentParts.push({
            type: "image",
            image: attachment.image || attachment.data, // Fallback to data if image not set
            mimeType: attachment.mimeType
          } as ImageContent);
        } else {
          messageContentParts.push({
            type: "file",
            data: attachment.data,
            mimeType: attachment.mimeType,
            filename: attachment.filename || attachment.name
          } as FileContent);
        }
      }

      const finalMessageContent = messageContentParts.length === 1 && messageContentParts[0].type === 'text' && !attachment
        ? messageContentParts[0].text
        : messageContentParts;

      setInput("");
      clearAttachment();

      onAddUserMessage({
        id: `local-user-${Date.now()}`,
        content: finalMessageContent,
        role: "user",
        created_at: new Date().toISOString()
      });

      onStreamStart();

      const stream = await chatClient.messages.sendMessage(
        conversationId,
        finalMessageContent,
        messages,
        abortController.signal,
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let noDataCount = 0;
      const maxNoDataIterations = 100; // Prevent infinite loops

      while (!done) {
        try {
          // Check if request was aborted
          if (abortController.signal.aborted) {
            console.log("Request was aborted by user");
            break;
          }

          const { value, done: readerDone } = await reader.read();
          done = readerDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            if (chunk) {
              accumulatedResponse += chunk;
              onStreamUpdate(chunk);
              noDataCount = 0; // Reset counter when we get data
            } else {
              noDataCount++;
            }
          } else {
            noDataCount++;
          }

          // If we've had too many iterations without meaningful data, break
          if (noDataCount > maxNoDataIterations) {
            console.warn("Stream appears to be stuck, ending stream reading");
            break;
          }

        } catch (streamReadError: any) {
          console.error("Error reading stream chunk:", streamReadError);
          errorOccurred = true;
          finalErrorMessage = "An error occurred while reading the response.";
          onError({ title: "Stream Error", message: finalErrorMessage });
          done = true;
        }
      }

    } catch (error: any) {
      // Handle abort errors gracefully - don't show error dialog for intentional user abort
      if (error?.name === 'AbortError') {
        return;
      }

      console.error("Error during chat submission:", error);


      errorOccurred = true;
      let title = "Request Error";
      let localMessage = "An unexpected error occurred. Please try again.";

      if (error?.isApiError) {
        title = `API Error (${error.status})`;
        localMessage = error.message || error.statusText || "An error occurred processing your request.";
      } else if (error?.isNetworkError) {
        title = "Network Error";
        localMessage = error.message || "Failed to connect to the server.";
      } else if (error instanceof Error) {
        localMessage = error.message;
      }

      finalErrorMessage = localMessage;
      onError({ title: title, message: finalErrorMessage });

    } finally {
      onStreamEnd(errorOccurred ? finalErrorMessage : accumulatedResponse);
      setIsSubmitting(false);
      // Clean up abort controller
      abortControllerRef.current = null;
    }
  };

  // Expose abort function for external use (when stop button is clicked)
  useEffect(() => {
    if (!isStreaming && abortControllerRef.current) {
      console.log("Aborting request due to streaming stopped");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isStreaming]);

  // Handle Enter key to submit, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="chat-input relative px-2 pt-3 pb-3 flex w-full items-center border bg-white dark:bg-gray-100 rounded-2xl shadow-sm overflow-hidden"
    >
      {attachment && (
        <div className="absolute top-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 p-2 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate max-w-[90%]">
            {isImageAttachment ? (
              <div className="w-6 h-6 rounded overflow-hidden bg-white">
                <img src={attachment.image || attachment.data} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <FileText size={16} className="text-gray-600 dark:text-gray-300" />
            )}
            <span className="text-xs truncate">{attachment.name}</span>
          </div>
          <button
            type="button"
            onClick={clearAttachment}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={16} />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder= "Type a message..."
        className={`max-h-32 h-20 w-full resize-none bg-transparent py-2 pl-6 pr-20 focus:outline-none text-base ${attachment ? 'mt-8' : ''}`}
        rows={1}
        disabled={isSubmitting || disabled}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/*"
        className="hidden"
      />

      <button
        type="button"
        onClick={handleAttachmentClick}
        disabled={isSubmitting || isStreaming || disabled}
        className="p-3 top-1/2 transform -translate-y-1/2 rounded-full text-naia-primary enabled:hover:bg-gray-300 enabled:dark:hover:bg-gray-700 disabled:opacity-40"
        aria-label="Attach file or image">
        <Paperclip size={20} />
      </button>
    
      {isStreaming && onStopStreaming ? (
        <button
          type="button"
          onClick={onStopStreaming}
          className="p-3 rounded-full text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          aria-label="Stop generating">
          <Square size={20} />
        </button>
      ) : (
        <button
          type="submit"
          disabled={(!input.trim() && !attachment) || isSubmitting}
          className="p-3 rounded-full text-gray-500 enabled:hover:bg-gray-300 enabled:dark:hover:bg-gray-700 disabled:opacity-40"
          aria-label="Send message">
          <Send size={20} />
        </button>
      )}

    </form>
  );
}