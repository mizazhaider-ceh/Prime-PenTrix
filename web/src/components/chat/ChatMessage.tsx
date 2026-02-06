'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Bot, User as UserIcon, Copy, Check } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  timestamp?: Date;
  model?: string;
}

export default function ChatMessage({
  role,
  content,
  isStreaming = false,
  timestamp,
  model,
}: MessageProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`animate-message-in group px-5 py-4 transition-all duration-300 ${
      isUser
        ? 'justify-end'
        : 'bg-card/20'
    }`}>
      <div className={`mx-auto max-w-5xl flex gap-3 ${
        isUser ? 'flex-row-reverse' : ''
      }`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg animate-float ${
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground ring-2 ring-primary/20'
              : 'bg-gradient-to-br from-foreground/10 to-foreground/5 text-foreground ring-2 ring-foreground/10'
          }`}
        >
          {isUser ? <UserIcon size={16} strokeWidth={2.5} /> : <Bot size={16} strokeWidth={2.5} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex-1 min-w-0 max-w-[90%] ${
          isUser ? 'flex flex-col items-end' : ''
        }`}>
          {/* Header */}
          <div className={`flex items-center gap-2 mb-2 ${
            isUser ? 'flex-row-reverse' : ''
          }`}>
            <span className="text-xs font-bold text-foreground tracking-wide uppercase">
              {isUser ? 'You' : 'Prime PenTrix'}
            </span>
            {model && !isUser && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary ring-1 ring-primary/20">
                {model}
              </span>
            )}
            {timestamp && (
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {/* Copy button */}
            {!isStreaming && content && (
              <button
                onClick={handleCopy}
                className={`opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-card/50 text-muted-foreground/50 hover:text-primary hover:scale-110 ${
                  isUser ? 'mr-auto' : 'ml-auto'
                }`}
                title="Copy message"
              >
                {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
              </button>
            )}
          </div>

          {/* Message content */}
          <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 ${
            isUser
              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm'
              : 'bg-card/50 border border-border/30 backdrop-blur rounded-tl-sm prose-prime-pentrix'
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
                {content}
              </p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="relative group/code my-3">
                        {match && (
                          <div className="absolute right-3 top-2 text-[10px] font-medium text-muted-foreground/50 bg-transparent px-1.5 py-0.5 rounded">
                            {match[1]}
                          </div>
                        )}
                        <pre className={`${className} !bg-black/30 !border !border-border/20 !rounded-xl`}>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ node, children, href, ...props }: any) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ node, children, ...props }: any) {
                    return (
                      <div className="overflow-x-auto my-3 rounded-xl border border-border/20">
                        <table className="min-w-full" {...props}>
                          {children}
                        </table>
                      </div>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          
            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 rounded-full bg-primary animate-breathe" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
