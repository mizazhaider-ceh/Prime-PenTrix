'use client';

import { useState } from 'react';
import { FileText, MessageSquare, Upload, Sparkles, BookOpen } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import DocumentChatInterface from './DocumentChatInterface';

// ═══════════════════════════════════════════════════════════════
// DOCUMENTS TAB - Split layout: Docs Management + RAG Chat
// Left panel: Upload & manage documents
// Right panel: Chat with documents (RAG-powered, own state)
// ═══════════════════════════════════════════════════════════════

interface DocumentsTabProps {
  subjectId: string;
}

export default function DocumentsTab({ subjectId }: DocumentsTabProps) {
  const [activePanel, setActivePanel] = useState<'docs' | 'chat'>('docs');

  return (
    <div className="flex h-full">
      {/* ── Left Panel: Document Management ── */}
      <div className="w-[380px] flex-shrink-0 border-r border-border/20 flex flex-col overflow-hidden glass-subtle">
        {/* Panel Header */}
        <div className="flex-shrink-0 border-b border-border/20 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="font-outfit text-sm font-bold text-foreground">
                  My Documents
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Upload & manage study materials
                </p>
              </div>
            </div>
            <span className="text-[9px] font-medium text-primary/60 bg-primary/8 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              RAG
            </span>
          </div>

          {/* Upload Zone */}
          <DocumentUpload subjectId={subjectId} />
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <DocumentList subjectId={subjectId} />
        </div>
      </div>

      {/* ── Right Panel: Chat with Documents ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* RAG Chat Header Badge */}
        <div className="flex-shrink-0 border-b border-border/20 px-4 py-2 glass-subtle">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10">
              <BookOpen className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-foreground">
              Chat with Documents
            </span>
            <span className="text-[9px] font-medium text-emerald-600/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              RAG Powered
            </span>
            <div className="flex-1" />
            <p className="text-[10px] text-muted-foreground/60">
              AI will search your uploaded documents for answers
            </p>
          </div>
        </div>

        {/* RAG-powered DocumentChatInterface — completely independent state */}
        <div className="flex-1 overflow-hidden">
          <DocumentChatInterface subjectId={subjectId} />
        </div>
      </div>

      {/* ── Mobile Toggle (for small screens) ── */}
      <div className="fixed bottom-20 right-4 z-50 flex gap-2 md:hidden">
        <button
          onClick={() => setActivePanel('docs')}
          className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all ${
            activePanel === 'docs'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground border border-border/30'
          }`}
        >
          <FileText className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActivePanel('chat')}
          className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all ${
            activePanel === 'chat'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground border border-border/30'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
