"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, subDays, isWithinInterval } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Conversation = Database['public']['Tables']['conversations']['Row'];

interface ConversationSidebarProps {
  activeConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
  className?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  last7Days: Conversation[];
  last30Days: Conversation[];
  older: Conversation[];
}

export function ConversationSidebar({ 
  activeConversationId, 
  onConversationSelect, 
  onNewConversation,
  className = '',
  refreshTrigger = 0
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (profile?.account_id) {
      loadConversations();
    }
  }, [profile?.account_id, refreshTrigger]); // Add refreshTrigger dependency

  const loadConversations = async () => {
    if (!profile?.account_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('account_id', profile.account_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversations",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== id));
      toast({
        variant: "success",
        title: "Success",
        description: "Conversation deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const groupConversations = (conversations: Conversation[]): GroupedConversations => {
    const now = new Date();
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const last7Days: Conversation[] = [];
    const last30Days: Conversation[] = [];
    const older: Conversation[] = [];

    conversations.forEach(conv => {
      const convDate = new Date(conv.updated_at);
      
      if (isToday(convDate)) {
        today.push(conv);
      } else if (isYesterday(convDate)) {
        yesterday.push(conv);
      } else if (isWithinInterval(convDate, { start: subDays(now, 7), end: now })) {
        last7Days.push(conv);
      } else if (isWithinInterval(convDate, { start: subDays(now, 30), end: now })) {
        last30Days.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { today, yesterday, last7Days, last30Days, older };
  };

  const renderConversationGroup = (title: string, conversations: Conversation[]) => {
    if (conversations.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
          {title}
        </h3>
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                activeConversationId === conversation.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {conversation.title}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    disabled={deletingId === conversation.id}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deletingId === conversation.id ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const groupedConversations = groupConversations(conversations);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2 h-10 text-sm font-medium bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No conversations yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderConversationGroup('Today', groupedConversations.today)}
              {renderConversationGroup('Yesterday', groupedConversations.yesterday)}
              {renderConversationGroup('Last 7 days', groupedConversations.last7Days)}
              {renderConversationGroup('Last 30 days', groupedConversations.last30Days)}
              {renderConversationGroup('Older', groupedConversations.older)}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
