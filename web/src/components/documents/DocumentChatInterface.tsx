'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ChatMessage from '@/components/chat/ChatMessage';
import { Send, Loader2, AlertCircle, BookOpen, Sparkles } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT CHAT — fully self-contained, local state only.
// Does NOT touch the global chatStore so it never collides
// with the main Chat tab.
// ═══════════════════════════════════════════════════════════════

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
  model?: string;
}

interface DocumentChatInterfaceProps {
  subjectId: string;
}

export default function DocumentChatInterface({ subjectId }: DocumentChatInterfaceProps) {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseBufferRef = useRef('');

  // Auto-scroll
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, streamingContent]);

  // ── Create or load a dedicated "doc-chat" conversation for this subject ──
  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;

    const init = async () => {
      try {
        // Look for an existing doc-chat conversation
        const res = await fetch(`/api/conversations?subjectId=${subjectId}&mode=doc-chat`);
        if (!res.ok) throw new Error('Failed to fetch conversations');
        const data = await res.json();

        let convId: string;

        if (data.conversations?.length > 0) {
          convId = data.conversations[0].id;
        } else {
          // Create a new one
          const createRes = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Document Chat',
              subjectId,
              mode: 'doc-chat',
            }),
          });
          if (!createRes.ok) throw new Error('Failed to create doc-chat conversation');
          const createData = await createRes.json();
          convId = createData.conversation.id;
        }

        if (cancelled) return;
        setConversationId(convId);

        // Load existing messages
        const convRes = await fetch(`/api/conversations/${convId}`);
        if (convRes.ok) {
          const convData = await convRes.json();
          const msgs: LocalMessage[] = (convData.conversation?.messages || []).map(
            (m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
              model: m.model || undefined,
            })
          );
          if (!cancelled) setMessages(msgs);
        }
      } catch (err) {
        console.error('Doc-chat init error:', err);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [subjectId]);

  // ── Send message ──
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !conversationId || isSending || isStreaming) return;

      const messageContent = input.trim();
      setInput('');
      setError(null);
      sseBufferRef.current = '';

      try {
        setIsSending(true);
        setIsStreaming(true);

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
            conversationId,
            message: messageContent,
            useRag: true, // Always RAG for document chat
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No response body');

        setIsSending(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBufferRef.current += decoder.decode(value, { stream: true });
          const parts = sseBufferRef.current.split('\n\n');
          sseBufferRef.current = parts.pop() || '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              // User message echoed back from server
              if (data.type === 'userMessage' && data.message) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === data.message.id)) return prev;
                  return [
                    ...prev,
                    {
                      id: data.message.id,
                      role: 'user',
                      content: data.message.content,
                      createdAt: data.message.createdAt,
                    },
                  ];
                });
                continue;
              }

              if (data.error) {
                setError(data.error);
                setIsStreaming(false);
                setStreamingContent('');
                break;
              }

              if (data.content) {
                setStreamingContent((prev) => prev + data.content);
              }

              if (data.done) {
                // Fetch the finalised assistant message
                if (data.messageId) {
                  const msgRes = await fetch(`/api/messages/${data.messageId}`);
                  if (msgRes.ok) {
                    const msgData = await msgRes.json();
                    if (msgData.message) {
                      setMessages((prev) => {
                        if (prev.some((m) => m.id === msgData.message.id)) return prev;
                        return [
                          ...prev,
                          {
                            id: msgData.message.id,
                            role: 'assistant',
                            content: msgData.message.content,
                            createdAt: msgData.message.createdAt,
                            model: msgData.message.model || undefined,
                          },
                        ];
                      });
                    }
                  }
                }
                setIsStreaming(false);
                setStreamingContent('');
              }
            } catch {
              /* ignore parse errors on partial data */
            }
          }
        }
      } catch (err) {
        console.error('Doc-chat error:', err);
        setError(err instanceof Error ? err.message : 'Failed to send');
        setIsSending(false);
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [conversationId, input, isSending, isStreaming]
  );

  // ── Loading / empty states ──
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="typing-indicator mx-auto mb-3">
            <span></span><span></span><span></span>
          </div>
          <p className="text-xs text-muted-foreground">Preparing document chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-fade-in-scale text-center max-w-md px-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/5 animate-breathe">
                <BookOpen className="h-8 w-8 text-emerald-500/50" />
              </div>
              <h3 className="mb-2 font-outfit text-base font-bold text-foreground">
                Chat with Your Documents
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload documents on the left, then ask questions here. The AI will search your
                materials and cite relevant passages.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.createdAt}
                model={msg.model}
              />
            ))}

            {/* Typing indicator */}
            {(isSending || (isStreaming && !streamingContent)) && (
              <div className="animate-message-in px-5 py-4 bg-card/20">
                <div className="mx-auto max-w-5xl flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg animate-float bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-600 ring-2 ring-emerald-500/10">
                    <BookOpen size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-foreground tracking-wide uppercase">
                        Document AI
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">
                        {isSending ? 'Searching documents...' : 'Thinking...'}
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

            {/* Streaming content */}
            {isStreaming && streamingContent && (
              <ChatMessage role="assistant" content={streamingContent} isStreaming />
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
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

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border/20 p-4 glass-subtle">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-2 rounded-xl border border-border/30 bg-card/30 p-1.5 focus-within:border-emerald-500/40 focus-within:shadow-lg focus-within:shadow-emerald-500/5 transition-all duration-300">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask questions about your documents..."
              disabled={isSending || isStreaming}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none custom-scrollbar"
              rows={1}
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending || isStreaming}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-lg bg-emerald-600 text-white transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:hover:shadow-none"
            >
              {isSending || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/50 px-1">
            Enter to send &bull; Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
