'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import ChatMessage from './ChatMessage';
import { Send, Loader2, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';

interface ChatInterfaceProps {
  /** When true, sends useRag=true to pull document context via Brain API */
  useRag?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Title override for the empty state */
  emptyTitle?: string;
  /** Description override for the empty state */
  emptyDescription?: string;
}

export default function ChatInterface({
  useRag = false,
  placeholder = 'Ask Prime PenTrix anything...',
  emptyTitle = 'Ready to Learn',
  emptyDescription,
}: ChatInterfaceProps) {
  const {
    currentConversation,
    messages,
    isLoadingMessages,
    isSendingMessage,
    isStreaming,
    streamingMessage,
  } = useChatStore();

  // Get action functions from store
  const addMessage = useChatStore((state) => state.addMessage);
  const setIsSendingMessage = useChatStore((state) => state.setIsSendingMessage);
  const setIsStreaming = useChatStore((state) => state.setIsStreaming);
  const appendToStreamingMessage = useChatStore((state) => state.appendToStreamingMessage);
  const clearStreamingMessage = useChatStore((state) => state.clearStreamingMessage);
  const finalizeStreamingMessage = useChatStore((state) => state.finalizeStreamingMessage);

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // SSE line buffer to handle partial lines across TCP chunks
  const sseBufferRef = useRef('');

  // Auto-scroll to bottom with RAF for better performance
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, streamingMessage]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !currentConversation || isSendingMessage || isStreaming) {
      return;
    }

    const messageContent = input.trim();
    setInput('');
    setError(null);
    sseBufferRef.current = '';

    try {
      setIsSendingMessage(true);
      setIsStreaming(true);

      // Read user's AI preferences from localStorage
      const aiProvider = localStorage.getItem('ai-settings-provider') || 'cerebras';
      const aiModel = localStorage.getItem('ai-settings-model') || 'llama-3.3-70b';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': aiProvider,
          'x-ai-model': aiModel,
        },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          message: messageContent,
          useRag,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      setIsSendingMessage(false);

      // Async streaming processing with proper SSE buffering
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Append decoded text to buffer and process complete lines
        sseBufferRef.current += decoder.decode(value, { stream: true });

        // SSE events are delimited by \n\n — split on double-newline
        const parts = sseBufferRef.current.split('\n\n');
        // Last part may be incomplete — keep it in the buffer
        sseBufferRef.current = parts.pop() || '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            // Handle user message from server
            if (data.type === 'userMessage' && data.message) {
              addMessage(data.message);
              continue;
            }

            if (data.error) {
              setError(data.error);
              setIsStreaming(false);
              clearStreamingMessage();
              break;
            }

            if (data.content) {
              appendToStreamingMessage(data.content);
            }

            if (data.done) {
              // Build message locally from streaming content — avoids network round-trip
              // that caused a visible content swap ("double response" effect)
              const streamingContent = useChatStore.getState().streamingMessage;
              if (data.messageId && currentConversation) {
                // Grab user info from existing messages (assistant messages share the same userId)
                const existingUser = useChatStore.getState().messages.find(m => m.user)?.user || {
                  name: 'AI Assistant',
                  email: '',
                  avatarUrl: null,
                };

                const localMessage = {
                  id: data.messageId,
                  role: 'assistant' as const,
                  content: streamingContent,
                  conversationId: currentConversation.id,
                  userId: currentConversation.messages?.[0]?.userId || '',
                  model: data.model || null,
                  tokenCount: streamingContent.split(/\s+/).length,
                  contextUsed: [] as string[],
                  createdAt: new Date(),
                  user: existingUser,
                };

                // ATOMIC: add message + clear streaming + set isStreaming=false in ONE render
                finalizeStreamingMessage(localMessage);

                // Background sync: fetch full DB record for accurate metadata (no UI swap)
                fetch(`/api/messages/${data.messageId}`)
                  .then(r => r.ok ? r.json() : null)
                  .then(msgData => {
                    if (msgData?.message) {
                      useChatStore.getState().updateMessage(data.messageId, msgData.message);
                    }
                  })
                  .catch(() => { /* silent — local message is already displayed */ });

                continue; // skip the manual cleanup below
              }
              // Fallback if no messageId
              setIsStreaming(false);
              clearStreamingMessage();
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setIsSendingMessage(false);
      setIsStreaming(false);
      clearStreamingMessage();
    }
  }, [currentConversation, input, isSendingMessage, isStreaming, useRag, addMessage, setIsSendingMessage, setIsStreaming, appendToStreamingMessage, clearStreamingMessage, finalizeStreamingMessage]);

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-fade-in-scale text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="mb-2 font-outfit text-lg font-bold text-foreground">
            No Conversation Selected
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a conversation from the sidebar or create a new one to start chatting with Prime
            PenTrix
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/20 px-5 py-3 glass-subtle">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-outfit text-sm font-bold text-foreground truncate">
              {currentConversation.title}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {currentConversation.subject.name} • <span className="capitalize">{currentConversation.mode}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="typing-indicator mx-auto mb-3">
                <span></span><span></span><span></span>
              </div>
              <p className="text-xs text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-fade-in-scale text-center max-w-md px-8">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 animate-breathe">
                    <Sparkles className="h-8 w-8 text-primary/50" />
                  </div>
                  <h3 className="mb-2 font-outfit text-base font-bold text-foreground">{emptyTitle}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {emptyDescription || `Ask me anything about ${currentConversation.subject.name}. I'm here to help you understand and master the material.`}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role as 'user' | 'assistant' | 'system'}
                  content={message.content}
                  timestamp={message.createdAt}
                  model={message.model || undefined}
                />
              ))
            )}

            {/* Typing indicator - show when AI is about to respond */}
            {(isSendingMessage || (isStreaming && !streamingMessage)) && (
              <div className="animate-message-in px-5 py-4 bg-card/20">
                <div className="mx-auto max-w-5xl flex gap-3">
                  {/* AI Avatar */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg animate-float bg-gradient-to-br from-foreground/10 to-foreground/5 text-foreground ring-2 ring-foreground/10">
                    <Sparkles size={16} strokeWidth={2.5} />
                  </div>

                  {/* Typing bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-foreground tracking-wide uppercase">
                        Prime PenTrix
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">
                        {isSendingMessage ? 'Processing...' : 'Thinking...'}
                      </span>
                    </div>
                    <div className="inline-flex px-4 py-3 rounded-2xl rounded-tl-sm bg-card/50 border border-border/30 shadow-sm">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming message */}
            {isStreaming && streamingMessage && (
              <ChatMessage
                role="assistant"
                content={streamingMessage}
                isStreaming={true}
              />
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex-shrink-0 px-5 py-3 border-t border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle size={14} />
            <p className="text-xs">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Premium Input Area */}
      <div className="flex-shrink-0 border-t border-border/20 p-4 glass-subtle">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-2 rounded-xl border border-border/30 bg-card/30 p-1.5 focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all duration-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={placeholder}
              disabled={isSendingMessage || isStreaming}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none max-h-[120px] custom-scrollbar"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isSendingMessage || isStreaming}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-none"
            >
              {isSendingMessage || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/50 px-1">
            Enter to send • Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
