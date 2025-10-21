"use client";

import { useState, useEffect, useRef, useLayoutEffect, Suspense, useCallback } from 'react';
import { MessageSquare, Plus, Trash2, Menu, ArrowLeftToLine, ArrowRightToLine, Edit, Check, Moon, Sun, MessageSquareX, MessageCirclePlus, PanelRightClose, PanelRightOpen, MoreHorizontal } from 'lucide-react';
import { chatClient, type Conversation } from '../api/chat-client';
import ChatContent from './chat-content';
import ConfirmationDialog from './confirmation-dialog';
import { useSearchParams } from 'next/navigation';
import { getAssetPath } from '../lib/utils';

// Create a safe useLayoutEffect that falls back to useEffect during SSR
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;


export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<Conversation | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [debug, setDebug] = useState<boolean>(false);
  const [isLogMode, setIsLogMode] = useState<boolean>(false);
  const [initialAssistantIdChecked, setInitialAssistantIdChecked] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [hasOpenApp, setHasOpenApp] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const minSidebarWidth = 200;
  const maxSidebarWidth = 600;


  const handleAppStateChange = useCallback((hasApp: boolean) => {
    setHasOpenApp(hasApp);
  }, []);

  // Handle sidebar resizing with mouse
  const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const clampedWidth = Math.max(minSidebarWidth, Math.min(newWidth, maxSidebarWidth));
      setSidebarWidth(clampedWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('resize-active');
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resize-active');
    };
  }, [isResizing]);

  const categorizeConversationsByDate = useCallback((conversations: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      'Today': [] as Conversation[],
      'Yesterday': [] as Conversation[],
      'Last 7 Days': [] as Conversation[],
      'Last 30 Days': [] as Conversation[],
      'Older': [] as Conversation[]
    };

    conversations.forEach(conversation => {
      try {
        const convDate = new Date(conversation.updated_at);

        if (convDate >= today) {
          groups['Today'].push(conversation);
        } else if (convDate >= yesterday) {
          groups['Yesterday'].push(conversation);
        } else if (convDate >= last7Days) {
          groups['Last 7 Days'].push(conversation);
        } else if (convDate >= last30Days) {
          groups['Last 30 Days'].push(conversation);
        } else {
          groups['Older'].push(conversation);
        }
      } catch (error) {
        // If date parsing fails, put in older category
        groups['Older'].push(conversation);
      }
    });

    // Sort conversations within each group by date (newest first)
    Object.keys(groups).forEach(key => {
      groups[key as keyof typeof groups].sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    return groups;
  }, []);

  // Helper function to check if content is JSON (same as in chat-client.ts)
  const isJson = useCallback((content: any) => {
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
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {

      // Normal conversation loading mode
      setIsLogMode(false);

      setIsLoading(true);
      try {
        const data = await chatClient.conversations.getAll();
        if (!Array.isArray(data)) {
          console.error("Expected array of conversations but got:", data);
          setConversations([]);
          return;
        }
        setConversations(data);

        if (data.length > 0) {
          selectConversation(data[0].id);
        } else {
          // No conversations exist, create a new one
          if (!isCreatingConversation) {
            try {
              setIsCreatingConversation(true);
              const newConversation = await chatClient.conversations.create("New Chat");
              setConversations([newConversation]);
              selectConversation(newConversation.id);
            } catch (createError) {
            } finally {
              setIsCreatingConversation(false);
            }
          } else {
            console.warn("Cannot create conversation");
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true); // Mark initial load as complete
      }
    };
    fetchConversations();
  }, [assistantId, agentId, logId, initialAssistantIdChecked, isJson]);

  const loadConversationData = async (id: string) => {
    setIsLoadingMessages(true);
    try {
      const fullConversation = await chatClient.conversations.get(id);
      setSelectedConversation(fullConversation);

      // Let ChatContent component handle its own scrolling internally
      // This prevents any possibility of accidentally scrolling the sidebar

    } catch (error) {
      console.error(`Failed to load conversation data for ID ${id}:`, error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const refreshSelectedConversation = async () => {
    if (!selectedConversationId) return;

    try {
      const updatedConversation = await chatClient.conversations.get(selectedConversationId);

      // Update the conversations list with the updated conversation
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversationId ? updatedConversation : conv
      ));

      // Update the selected conversation
      setSelectedConversation(updatedConversation);
    } catch (error) {
      console.error("Failed to refresh selected conversation:", error);
    }
  };

  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
    loadConversationData(id);
    // Force normal mode when switching conversations
    setHasOpenApp(false);
  };

  const createNewConversation = async () => {
    try {
      const newConversation = await chatClient.conversations.create("New Chat");
      setConversations(prev => [newConversation, ...prev]);
      selectConversation(newConversation.id);
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await chatClient.conversations.delete(id);
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);

      if (selectedConversationId === id) {
        if (updatedConversations.length > 0) {
          selectConversation(updatedConversations[0].id);
        } else {
          // No conversations left, create a new one
          setSelectedConversationId(null);
          setSelectedConversation(null);

          // Create a new conversation if assistantId or agentId is available
          if (assistantId || agentId) {
            try {
              const newConversation = await chatClient.conversations.create("New Chat");
              setConversations([newConversation]);
              selectConversation(newConversation.id);
            } catch (error) {
              console.error("Failed to create new conversation after deletion:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
    setOpenMenuId(null);
  };

  const toggleConversationMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleRenameClick = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation();
    setConversationToRename(conversation);
    setTitleInput(conversation.title || "New Chat");
    setIsRenameDialogOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmRename = async () => {
    if (!conversationToRename || !titleInput.trim()) {
      setIsRenameDialogOpen(false);
      setConversationToRename(null);
      return;
    }

    setIsSavingTitle(true);
    try {
      await chatClient.conversations.update(conversationToRename.id, { title: titleInput.trim() });
      const updatedConv = { ...conversationToRename, title: titleInput.trim() };

      // Update conversations list
      setConversations(prev => prev.map(conv =>
        conv.id === conversationToRename.id ? updatedConv : conv
      ));

      // Update selected conversation if it's the one being renamed
      if (selectedConversationId === conversationToRename.id) {
        setSelectedConversation(updatedConv);
      }
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    } finally {
      setIsSavingTitle(false);
      setIsRenameDialogOpen(false);
      setConversationToRename(null);
    }
  };

  const handleCancelRename = () => {
    setIsRenameDialogOpen(false);
    setConversationToRename(null);
    setTitleInput("");
  };

  const confirmDelete = async () => {
    if (pendingDeleteId) {
      await deleteConversation(pendingDeleteId);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  };

  const handleClearChat = () => {
    if (!selectedConversationId) return;
    setIsClearDialogOpen(true);
  };

  const handleConfirmClear = async () => {
    if (!selectedConversationId) return;
    setIsClearing(true);
    try {
      await chatClient.conversations.clear(selectedConversationId);
      await loadConversationData(selectedConversationId);
    } catch (error) {
      console.error("Error clearing conversation:", error);
    } finally {
      setIsClearing(false);
      setIsClearDialogOpen(false);
    }
  };

  const startEditingTitle = () => {
    if (!selectedConversation) return;
    setTitleInput(selectedConversation.title || "New Chat");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const cancelEditingTitle = () => setIsEditingTitle(false);

  const handleTitleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveTitle();
    else if (e.key === "Escape") cancelEditingTitle();
  };

  const saveTitle = async () => {
    if (!selectedConversationId || !titleInput.trim()) {
      cancelEditingTitle();
      return;
    }
    setIsSavingTitle(true);
    try {
      await chatClient.conversations.update(selectedConversationId, { title: titleInput.trim() });
      if (selectedConversation) {
        const updatedConv = { ...selectedConversation, title: titleInput.trim() };
        setSelectedConversation(updatedConv);
        setConversations(prev => prev.map(conv => conv.id === selectedConversationId ? updatedConv : conv));
      }
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  useIsomorphicLayoutEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <>

      {/* Main app UI */}
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">

        {/* Confirmation Dialog for Delete Conversation */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Conversation"
          message="Are you sure you want to delete this conversation? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="bg-red-500 hover:bg-red-600"
        />

        {/* Confirmation Dialog for Clear Chat */}
        <ConfirmationDialog
          isOpen={isClearDialogOpen}
          onClose={() => setIsClearDialogOpen(false)}
          onConfirm={handleConfirmClear}
          title="Clear Conversation"
          message="Are you sure you want to clear all messages in this conversation? This action cannot be undone."
          confirmText="Clear"
          cancelText="Cancel"
          confirmButtonClass="bg-orange-500 hover:bg-orange-600"
        />

        {/* Rename Dialog */}
        {isRenameDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm"
              onClick={handleCancelRename}
              aria-hidden="true"
            />
            
            {/* Dialog */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md z-10 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                Rename Conversation
              </h3>
              <input
                ref={titleInputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmRename();
                  else if (e.key === "Escape") handleCancelRename();
                }}
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="Enter conversation title"
                disabled={isSavingTitle}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCancelRename}
                  disabled={isSavingTitle}
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRename}
                  disabled={isSavingTitle || !titleInput.trim()}
                  className="px-4 py-2 text-sm text-white rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSavingTitle ? "Saving..." : "Rename"}
                </button>
              </div>
            </div>
          </div>
        )} 

        {/* Sidebar with dynamic width - Hidden in log mode */}
        <div
          className={`bg-[#f8fafc] dark:bg-gray-900 dark:!bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full relative z-20 ${sidebarOpen ? "block" : "hidden"
            }`}
          style={{ width: sidebarWidth }}
        >
          <div className="flex flex-col h-full">

            <div className="flex-1 overflow-y-auto p-2 bg-[#f9f9f9] dark:bg-[#171717]">
              <div className="flex-1">
                {isLoading ? (
                  <div className="space-y-4">

                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-0">
                    {(() => {
                      const groupedConversations = categorizeConversationsByDate(conversations);
                      return Object.entries(groupedConversations).map(([groupName, groupConversations]) => {
                        if (groupConversations.length === 0) return null;

                        return (
                          <div key={groupName} className="mb-4">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-2 uppercase tracking-wide">
                              {groupName}
                            </div>
                            <div className="space-y-0">
                              {groupConversations.map((conversation) => {

                                return (
                                  <div
                                    key={conversation.id}
                                    onClick={() => {
                                      selectConversation(conversation.id);
                                      // On mobile, close sidebar after selecting a conversation
                                      if (window.innerWidth < 1024) {
                                        setSidebarOpen(false);
                                      }
                                    }}
                                    className={`flex items-center w-full pl-4 pr-2 py-1.5 mb-1 rounded-xl text-left group cursor-pointer ${selectedConversationId === conversation.id
                                      ? "bg-naia-200 text-gray-800 dark:text-gray-200"
                                      : "text-gray-800 dark:text-gray-100 conversation-item-background"
                                      }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-0.5">
                                        <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                          {conversation.title || "New Chat"}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <button
                                        onClick={(e) => toggleConversationMenu(e, conversation.id)}
                                        className="p-1.5 cursor-pointer rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 opacity-0 hover:bg-gray-300 dark:hover:bg-gray-700 group-hover:opacity-100 transition-opacity"
                                        aria-label="More options"
                                      >
                                        <MoreHorizontal size={16} />
                                      </button>

                                      {openMenuId === conversation.id && (
                                        <div className="absolute right-0 top-10 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-2">
                                          <button
                                            onClick={(e) => handleRenameClick(e, conversation)}
                                            className="w-full text-sm text-left px-3 py-2 text-md flex cursor-pointer items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md"
                                          >
                                            <Edit size={14} />
                                            Rename
                                          </button>
                                          <button
                                            onClick={(e) => handleDeleteClick(e, conversation.id)}
                                            className="w-full text-sm text-left px-3 py-2 text-md text-red-600 cursor-pointer flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md"
                                          >
                                            <Trash2 size={14} />
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No conversations yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resize handle - Hidden in log mode */}
        {sidebarOpen && (
          <div
            ref={resizeHandleRef}
            onMouseDown={startResizing}
            className="w-1 hover:w-2 bg-gray-300 dark:bg-gray-700 h-full cursor-col-resize transition-all hover:bg-indigo-500 dark:hover:bg-indigo-400 z-30 relative"
            title="Drag to resize"
          />
        )}

        {/* Main content area with header and max-width container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Hidden in read-only mode */}          

          <header className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-900">
            <div className="flex items-center">
              <>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 cursor-pointer rounded-lg text-gray-500 hover:bg-naia-hover disabled:opacity-50 transition-colors"
                  title="Toggle Sidebar"
                  aria-label="Toggle Sidebar">
                  {sidebarOpen ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
                </button>

                <button
                  onClick={createNewConversation}
                  className="p-2 cursor-pointer rounded-lg text-gray-500 hover:bg-naia-hover disabled:opacity-50 transition-colors"
                  title="New Chat"
                  aria-label="New Chat">
                  <MessageCirclePlus size={20} />
                </button>
              </>
            </div>

          </header>


          {/* Main content with dynamic width */}
          <div className={`flex-1 overflow-hidden bg-white dark:bg-gray-900 text-lg transition-all duration-300 ${hasOpenApp ? 'flex' : 'flex justify-center'}`}>
            <div className={`flex flex-col transition-all duration-300 ${hasOpenApp ? 'w-full' : 'w-full max-w-6xl'}`}>
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-gray-500">
                    Loading conversations...
                  </div>
                </div>
              ) : isLoadingMessages && selectedConversationId ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-gray-500">Loading messages...</div>
                </div>
              ) : selectedConversation ? (
                <ChatContent
                  conversation={selectedConversation}
                  onConversationUpdate={refreshSelectedConversation}
                  onAppStateChange={handleAppStateChange}
                  onSidebarToggle={() => setSidebarOpen(false)}
                  isReadOnly={isLogMode}
                />
              ) : (
                // Show loading while the useEffect handles conversation creation
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-gray-500">
                    {isCreatingConversation ? "Creating new conversation..." :
                      conversations.length === 0 ? "Creating new conversation..." : "Loading conversation..."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}