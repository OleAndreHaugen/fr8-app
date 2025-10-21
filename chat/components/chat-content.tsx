"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { MessageSquare, X, ArrowDownCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { chatClient, type Conversation, type Message } from "../api/chat-client";
import ChatMessage from "./chat-message";
import AnalyticsPanel from "./analytics-panel";
import { getAssetPath } from "../lib/utils";

// Dynamically import components to avoid SSR issues
const DynamicChatMessage = dynamic(() => Promise.resolve(ChatMessage), {
  ssr: false,
  loading: () => null
});

const ChatInput = dynamic(() => import("./chat-input"), { ssr: false });

interface ChatContentProps {
  conversation: Conversation;
  onConversationUpdate?: () => Promise<void>;
  theme?: 'light' | 'dark';
  onAppStateChange?: (hasOpenApp: boolean) => void;
  onSidebarToggle?: () => void;
  isReadOnly?: boolean; // New prop for read-only mode
}

// Store static details of the streaming message outside of state
interface StreamingMessageRefData {
  id: string;
  role: Message['role'];
  created_at: string;
}

// Error details structure
interface ErrorDetails {
  title: string;
  message: string;
}

const SCROLL_BOTTOM_THRESHOLD = 50; // Pixels from bottom to be considered "at bottom"

export default function ChatContent({
  conversation,
  onConversationUpdate,
  theme,
  onAppStateChange,
  onSidebarToggle,
  isReadOnly = false
}: ChatContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(conversation.messages || []);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const streamingMessageRef = useRef<StreamingMessageRefData | null>(null);
  const [errorDialog, setErrorDialog] = useState<ErrorDetails | null>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const shouldShowScrollToBottom = !autoScroll && hasScrolled;

  // Panel state management - can be either app (iframe) or analytics
  const [openApp, setOpenApp] = useState<{ name: string; url: string } | null>(null);
  const [openAnalytic, setOpenAnalytic] = useState<{ name: string; data: string } | null>(null);

  // Resizing state for chat-app divider
  const [chatWidth, setChatWidth] = useState(30); // Percentage width for chat area
  const [isResizingChatApp, setIsResizingChatApp] = useState(false);
  const chatAppResizeHandleRef = useRef<HTMLDivElement>(null);
  const chatAppContainerRef = useRef<HTMLDivElement>(null);
  const minChatWidth = 20; // Minimum 20% for chat
  const maxChatWidth = 80; // Maximum 80% for chat

  // Error handling state
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Whether there are messages to display
  const hasMessages = messages.length > 0 || !!streamingMessage;

  // Whether any panel is open
  const hasOpenPanel = !!openApp || !!openAnalytic;

  // Combine finalized messages and the current streaming message
  const allMessages = useMemo(() => {
    const combined = [...messages];
    if (streamingMessage) {
      combined.push(streamingMessage);
    }
    // Sort messages by created_at (streaming message will naturally be last)
    return combined.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [messages, streamingMessage]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    // Try multiple methods to ensure scrolling works
    const container = scrollContainerRef.current;
    const messagesEnd = messagesEndRef.current;

    if (messagesEnd) {
      messagesEnd.scrollIntoView({ behavior, block: 'end' });
    }

    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    // Fallback: use SPECIFIC selector to target only main chat content, never sidebar
    setTimeout(() => {
      const scrollContainer = document.querySelector('[data-main-chat-scroll="true"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 10);

    setShowScrollToBottomButton(false);
    setUserHasScrolledUp(false);
  }, []);

  // Effect to handle user's manual scrolling behavior
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_BOTTOM_THRESHOLD;
      const isContentScrollable = container.scrollHeight > container.clientHeight;

      if (isAtBottom) {
        setShowScrollToBottomButton(false);
        setUserHasScrolledUp(false);
      } else {
        setUserHasScrolledUp(true);
        if (isContentScrollable) {
          setShowScrollToBottomButton(true);
        } else {
          setShowScrollToBottomButton(false);
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [allMessages]);

  // Effect to handle auto-scrolling or button visibility when new messages arrive
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMessages) {
      setShowScrollToBottomButton(false);
      return;
    }

    if (!userHasScrolledUp) {
      scrollToBottom("smooth");
    } else {
      const isContentScrollable = container.scrollHeight > container.clientHeight;
      if (isContentScrollable) {
        setShowScrollToBottomButton(true);
      } else {
        setShowScrollToBottomButton(false);
      }
    }
  }, [allMessages, scrollToBottom, userHasScrolledUp, hasMessages]);

  // Effect to reset scroll state when conversation changes
  useEffect(() => {
    setShowScrollToBottomButton(false);
    setUserHasScrolledUp(false);

    // Always scroll to bottom when conversation changes, regardless of messages
    const timeoutId = setTimeout(() => {
      scrollToBottom("auto");
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [conversation.id, scrollToBottom]);

  // Separate effect to close panels when conversation changes
  useEffect(() => {
    // Close any open panels when conversation changes
    if (openApp) {
      setOpenApp(null);
    }
    if (openAnalytic) {
      setOpenAnalytic(null);
    }
    onAppStateChange?.(false);
  }, [conversation.id]); // Only depend on conversation.id, not openApp/openAnalytic

  // Effect to scroll to bottom when messages change (new user message added)
  useEffect(() => {
    // Always scroll to bottom when new messages are added
    if (messages.length > 0 && !userHasScrolledUp) {
      const timeoutId = setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom, userHasScrolledUp]);

  // Effect to handle scrolling when conversation data loads (including initial load)
  useEffect(() => {
    // Trigger scroll when we have messages and the conversation changes
    if (conversation.messages && conversation.messages.length > 0) {
      // Multiple timeouts to ensure scrolling happens
      const timeouts = [
        setTimeout(() => scrollToBottom("auto"), 50),
        setTimeout(() => scrollToBottom("auto"), 200),
        setTimeout(() => scrollToBottom("auto"), 500)
      ];

      return () => timeouts.forEach(clearTimeout);
    }
  }, [conversation.messages, conversation.id, scrollToBottom]);

  // Effect to scroll when the component becomes visible with content
  useEffect(() => {
    if (hasMessages) {
      const timeoutId = setTimeout(() => {
        scrollToBottom("auto");
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [hasMessages, scrollToBottom]);

  // Clean-up streaming state on unmount
  useEffect(() => {
    return () => {
      setIsStreaming(false);
      setStreamingMessage(null);
      streamingMessageRef.current = null;
    };
  }, []);

  // Callback from ChatInput: Add the user's message to the list
  const handleAddUserMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);

    // Reset scroll state and scroll to bottom when user sends a message
    setUserHasScrolledUp(false);
    setShowScrollToBottomButton(false);

    // Force scroll to bottom after user message
    setTimeout(() => {
      scrollToBottom("smooth");
    }, 50);
  }, [scrollToBottom]);

  // Callback from ChatInput: Streaming started
  const handleStreamStart = useCallback(() => {
    const newStreamingMessage: Message = {
      id: `stream-${Date.now()}`,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString()
    };
    // Store static details in the ref
    streamingMessageRef.current = {
      id: newStreamingMessage.id,
      role: newStreamingMessage.role,
      created_at: newStreamingMessage.created_at
    };

    // Set the state for rendering
    setStreamingMessage(newStreamingMessage);
    setIsStreaming(true);
  }, []);

  // Callback from ChatInput: Received a chunk of data
  const handleStreamUpdate = useCallback((chunk: string) => {
    // Only update the state, ref holds static data
    setStreamingMessage(prev => {
      if (!prev) return null;
      const newContent = (prev.content || "") + chunk;
      return { ...prev, content: newContent };
    });
  }, []);

  // Callback from ChatInput: Streaming finished or errored
  const handleStreamEnd = useCallback(async (finalContent: string) => {
    const streamDetails = streamingMessageRef.current;

    let messageToAdd: Message | null = null;
    if (streamDetails && finalContent?.trim()) {
      messageToAdd = {
        id: `assistant-${Date.now()}`,
        role: streamDetails.role,
        created_at: streamDetails.created_at,
        content: finalContent.trim(),
      };
    }

    // --- Update state ---
    // Update permanent messages first (if applicable)
    if (messageToAdd) {
      setMessages(prev => [...prev, messageToAdd]);
    }

    // Then, clear the streaming state and ref
    setIsStreaming(false);
    setStreamingMessage(null);
    streamingMessageRef.current = null;

    // Refresh conversation list to get updated title after streaming
    if (onConversationUpdate) {
      try {
        await onConversationUpdate();
      } catch (error) {
        console.error("Failed to refresh conversation list:", error);
      }
    }
  }, [onConversationUpdate]);

  // Callback from ChatInput: An error occurred
  const handleError = useCallback((details: ErrorDetails) => {
    console.log("handleError called with:", details);
    // We might already be resetting streaming state in handleStreamEnd,
    // but ensure it's false here too. handleStreamEnd will still be called.
    setIsStreaming(false);
    setStreamingMessage(null); // Clear any partial streaming message
    streamingMessageRef.current = null;
    setErrorDialog(details); // Set state to show the dialog
    setShowScrollToBottomButton(false); // Hide button on error
  }, []);

  // Handle stop streaming - this will be called when user clicks stop button
  const handleStopStreaming = useCallback(() => {
    console.log("Stop streaming requested");

    // Reset streaming state
    setIsStreaming(false);
    setStreamingMessage(null);
    streamingMessageRef.current = null;

    // You can add here any logic to actually abort the streaming request
    // For example, if you're using AbortController:
    // abortController?.abort();

  }, []);

  // Handle opening an app in iframe
  const handleAppOpen = useCallback((name: string, url: string) => {
    setOpenAnalytic(null); // Close analytics if open
    setOpenApp({ name, url });
    onAppStateChange?.(true);
  }, [onAppStateChange]);

  // Handle opening analytics panel
  const handleAnalyticOpen = useCallback((name: string, data: string) => {
    setOpenApp(null); // Close app if open
    setOpenAnalytic({ name, data });
    onAppStateChange?.(true);
    // Don't automatically close sidebar - let user control it
    // onSidebarToggle?.(); // Minimize sidebar for more space
  }, [onAppStateChange]);

  // Handle closing panels
  const handlePanelClose = useCallback(() => {
    setOpenApp(null);
    setOpenAnalytic(null);
    onAppStateChange?.(false);
  }, [onAppStateChange]);

  // Handle chat-app resize
  const startResizingChatApp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizingChatApp(true);
  }, []);

  // Effect to handle chat-app resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingChatApp) return;

      // Get the main container element using ref
      const mainContainer = chatAppContainerRef.current;
      if (!mainContainer) return;

      const containerRect = mainContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const relativeX = e.clientX - containerRect.left;

      const newChatWidthPercent = (relativeX / containerWidth) * 100;
      const clampedWidth = Math.max(minChatWidth, Math.min(newChatWidthPercent, maxChatWidth));
      setChatWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingChatApp(false);
    };

    if (isResizingChatApp) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('resize-active');
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resize-active');
      document.body.style.cursor = '';
    };
  }, [isResizingChatApp, minChatWidth, maxChatWidth]);

  // Simple inline dialog component (replace with your actual Dialog component)
  const ErrorDialog = () => {
    if (!errorDialog) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{errorDialog.title}</h3>
            <button
              onClick={() => setErrorDialog(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close error dialog"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {errorDialog.message}
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setErrorDialog(null)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div ref={chatAppContainerRef} className="flex h-full relative w-full p-2">
        {/* Render Error Dialog */}
        <ErrorDialog />

        {/* Chat area - dynamic width when panel is open, full width when no panel */}
        <div
          className={`flex flex-col transition-all duration-300 relative min-w-[500px] ${hasOpenPanel ? '' : 'w-full'}`}
          style={hasOpenPanel ? { width: `${chatWidth}%` } : {}}
        >
          {/* Overlay to prevent chat area from interfering with resize */}
          {isResizingChatApp && (
            <div className="absolute inset-0 z-40 bg-transparent cursor-col-resize" />
          )}
          {hasMessages ? (
            // Standard layout with messages and input at bottom
            <>
              {/* Scrollable Message Container */}
              <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto py-6 relative ${hasOpenPanel ? 'px-2 sm:px-4' : 'px-4 sm:px-8'} pb-4`}
                data-ref="scrollContainerRef"
                data-main-chat-scroll="true"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              >
                {/* Message list */}
                <div className="space-y-2">
                  {allMessages.map((message, index) => {
                    // Check if this message is the currently streaming one
                    const isCurrentlyStreaming = isStreaming &&
                      streamingMessage?.id === message.id; // Use state for rendering check

                    return (
                      // @ts-ignore - Typescript doesn't recognize dynamic imports properly
                      <DynamicChatMessage
                        key={message.id || index}
                        message={message}
                        isStreaming={isCurrentlyStreaming}
                        theme={theme}
                        onAppOpen={handleAppOpen}
                        onAnalyticOpen={handleAnalyticOpen}
                      />
                    );
                  })}

                  <div ref={messagesEndRef} data-ref="messagesEndRef" />
                </div>

              </div>

              {/* Input at bottom - Hidden in read-only mode */}
              {!isReadOnly && (
                <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${hasOpenPanel ? 'p-3 sm:p-3' : 'p-3 sm:p-6'}`}>        

                  {showScrollToBottomButton && (
                    <div className="absolute bottom-12 right-0 z-10">
                      <button
                        onClick={() => scrollToBottom("smooth")}
                        className="bg-primary hover:bg-primary-hover text-white rounded-full p-2 shadow-lg transition-opacity duration-300 ease-in-out animate-bounce"
                        title="Scroll to bottom"
                      >
                        <ArrowDownCircle size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Fixed Input Area - Always visible at bottom */}
              <div className={`flex-shrink-0 bg-white dark:bg-gray-900 ${hasOpenPanel ? 'px-2 sm:px-4' : 'px-4 sm:px-8'}`}>
                <ChatInput
                  conversationId={conversation.id}
                  onAddUserMessage={handleAddUserMessage}
                  onStreamStart={handleStreamStart}
                  onStreamUpdate={handleStreamUpdate}
                  onStreamEnd={handleStreamEnd}
                  onError={handleError}
                  messages={messages}
                  isStreaming={isStreaming}
                  onStopStreaming={handleStopStreaming}
                />
              </div>
            </>
          ) : (
            // Empty state with centered input 
            <div className="flex h-full flex-col items-center justify-center p-4">
              <>
                <div className="mb-8 flex flex-col items-center">
                  <div className="mb-4 text-gray-500">
                  </div>
                  <h2 className={`mb-2 font-bold ${hasOpenPanel ? 'text-lg' : 'text-2xl'}`}>How can I help you today?</h2>
                  <p className={`text-center text-gray-500 ${hasOpenPanel ? 'text-sm max-w-xs' : 'max-w-md'}`}>
                    Feel free to ask any question you like — just be precise, as if you're speaking to a real person.
                  </p>
                </div>

                <div className={`w-full ${hasOpenPanel ? 'max-w-sm' : 'max-w-2xl'} px-4`}>
                  <ChatInput
                    conversationId={conversation.id}
                    onAddUserMessage={handleAddUserMessage}
                    onStreamStart={handleStreamStart}
                    onStreamUpdate={handleStreamUpdate}
                    onStreamEnd={handleStreamEnd}
                    onError={handleError}
                    messages={[]}
                    isStreaming={isStreaming}
                    onStopStreaming={handleStopStreaming}
                  />
                </div>
              </>

            </div>
          )}
        </div>

        {/* Resize handle */}
        {hasOpenPanel && (
          <div
            ref={chatAppResizeHandleRef}
            onMouseDown={startResizingChatApp}
            className={`h-full cursor-col-resize transition-all z-50 relative flex items-center justify-center ${isResizingChatApp
              ? 'w-2 bg-indigo-500 dark:bg-indigo-400'
              : 'w-1 hover:w-2 bg-gray-300 dark:bg-gray-700 hover:bg-indigo-500 dark:hover:bg-indigo-400'
              }`}
            title="Drag to resize chat and app areas"
          >
            {/* Visual indicator dots */}
            <div className="flex flex-col space-y-1 opacity-60">
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
            </div>
          </div>
        )}

        {/* Panel area - takes remaining space */}
        {hasOpenPanel && (
          <div className="flex-1 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col w-full">
            {/* Panel header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${openApp ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}>
                  {openApp ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {openApp ? openApp.name : "Analytics Dashboard"}
                  </h3>
                  {openAnalytic && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{openAnalytic.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Close panel */}
                <button
                  onClick={handlePanelClose}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div className="flex-1 relative h-full">
              {/* Overlay to prevent content from interfering with resize */}
              {isResizingChatApp && (
                <div className="absolute inset-0 z-50 bg-transparent cursor-col-resize" />
              )}

              {openApp ? (
                <iframe
                  src={openApp.url}
                  className="w-full h-full border-0"
                  title={openApp.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
                />
              ) : openAnalytic ? (
                <AnalyticsPanel
                  name={openAnalytic.name}
                  csvData={openAnalytic.data}
                  theme={theme}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}