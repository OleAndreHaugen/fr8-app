"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AttachmentPreview, processFiles, FileAttachment } from '@/lib/chat-utils';
import { Paperclip, Send, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    try {
      await onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setIsProcessing(true);
      const processedFiles = await processFiles(files);
      setAttachments(prev => [...prev, ...processedFiles]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process files",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Create a new FileList with the pasted file using DataTransfer
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          handleFileSelect(dataTransfer.files);
        }
      }
    }
  }, []);

  const attachmentPreviews: AttachmentPreview[] = attachments.map(att => ({
    id: att.id,
    name: att.name,
    type: att.type,
    size: att.size,
    thumbnail: att.thumbnail
  }));

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {/* Attachment Previews */}
      {attachmentPreviews.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {attachmentPreviews.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
              {attachment.thumbnail ? (
                <img 
                  src={attachment.thumbnail} 
                  alt={attachment.name}
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                {attachment.name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAttachment(attachment.id)}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        {/* File Upload Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="h-12 w-12 p-0 shrink-0 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.js,.ts,.py,.html,.css,.json,.xml"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            className="min-h-[56px] max-h-32 resize-none pr-12 py-4 rounded-2xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
            rows={1}
          />
          
          {/* Send Button */}
          <Button
            size="sm"
            onClick={handleSend}
            disabled={disabled || isProcessing || (!message.trim() && attachments.length === 0)}
            className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

    </div>
  );
}
