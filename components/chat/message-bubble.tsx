"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageContent } from './message-content';
import { AttachmentPreview, formatFileSize, getFileIcon } from '@/lib/chat-utils';
import { Copy, RotateCcw, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FuelChart } from './charts/fuel-chart';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: AttachmentPreview[];
  created_at: string;
  onRegenerate?: () => void;
  className?: string;
  parts?: any[];
}

export function MessageBubble({ 
  id, 
  role, 
  content, 
  attachments = [], 
  created_at, 
  onRegenerate,
  className = '',
  parts = []
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadAttachment = (attachment: AttachmentPreview) => {
    // This would need to be implemented based on how attachments are stored
    console.log('Download attachment:', attachment);
  };

  const isUser = role === 'user';
  const isAssistant = role === 'assistant';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage 
          src={isUser ? undefined : ''} 
          alt={isUser ? 'You' : 'AI Assistant'} 
        />
        <AvatarFallback className={`text-sm font-medium ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-600 text-white'
        }`}>
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <div className={`group relative rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-md shadow-sm' 
            : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700'
        }`}>
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className={`flex items-center gap-2 p-2 rounded-lg ${
                  isUser ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {attachment.thumbnail ? (
                    <img 
                      src={attachment.thumbnail} 
                      alt={attachment.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded flex items-center justify-center ${
                      isUser ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {attachment.type.startsWith('image/') ? (
                        <ImageIcon className="h-6 w-6" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                    }`}>{attachment.name}</p>
                    <p className={`text-xs ${
                      isUser ? 'text-white/75' : 'text-gray-500 dark:text-gray-400'
                    }`}>{formatFileSize(attachment.size)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadAttachment(attachment)}
                    className={`h-8 w-8 p-0 ${
                      isUser 
                        ? 'hover:bg-white/20 text-white' 
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Message Content - Render parts if available, otherwise render content */}
          {parts && parts.length > 0 ? (
            <div className="space-y-2">
              {parts.map((part, index) => {
                switch (part.type) {
                  case 'text':
                    return <MessageContent key={index} content={part.text} />;
                  
                  case 'tool-renderChart':
                    if (part.state === 'input-available' || part.state === 'output-available') {
                      return (
                        <div key={index} className="my-4">
                          <FuelChart
                            chartType={part.input.chartType}
                            title={part.input.title}
                            data={part.input.data}
                            xKey={part.input.xKey}
                            yKeys={part.input.yKeys}
                            nameKey={part.input.nameKey}
                            valueKey={part.input.valueKey}
                            colors={part.input.colors}
                          />
                        </div>
                      );
                    }
                    return null;
                  
                  default:
                    return null;
                }
              })}
            </div>
          ) : (
            <MessageContent content={content} />
          )}

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              className={`h-8 w-8 p-0 ${
                isUser 
                  ? 'hover:bg-white/20 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {copied ? (
                <div className="h-4 w-4 rounded-full bg-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-2 px-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
