'use client';

import { memo, useEffect, useCallback, useState, useRef } from 'react';
import { useDocuments } from '@/store/documentStore';
import { documentActions } from '@/hooks/useDocumentActions';
import type { Document, DocumentStatus } from '@/types';
import {
  FileText,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  File,
  FileCode,
  ChevronRight,
  Sparkles,
  Upload,
  Zap,
  Search,
  Eye,
  MoreVertical,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT LIST - Modern Dynamic Document Management
// Features: Staggered animations, glassmorphism cards, animated
// status badges, skeleton loading, hover actions, smooth transitions
// ═══════════════════════════════════════════════════════════════

interface DocumentListProps {
  subjectId: string;
}

// ── Utility Functions ────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFileTypeInfo(mimeType: string) {
  const map: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
    'application/pdf': { icon: FileText, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      icon: File,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
    },
    'text/plain': { icon: FileCode, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    'text/markdown': { icon: FileCode, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  };
  return map[mimeType] || { icon: File, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
}

// ── Status Badge Component ───────────────────────────────────

const StatusBadge = memo(function StatusBadge({ status }: { status: DocumentStatus }) {
  const config: Record<DocumentStatus, {
    icon: typeof Clock;
    label: string;
    className: string;
    animate?: boolean;
  }> = {
    pending: {
      icon: Clock,
      label: 'Queued',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    processing: {
      icon: Loader2,
      label: 'Processing',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      animate: true,
    },
    completed: {
      icon: CheckCircle,
      label: 'Ready',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    failed: {
      icon: AlertCircle,
      label: 'Failed',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  };

  const { icon: Icon, label, className, animate } = config[status] || config.pending;

  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
      border uppercase tracking-wider ${className}
    `}>
      <Icon className={`w-2.5 h-2.5 ${animate ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
});

// ── Skeleton Loader ──────────────────────────────────────────

function DocumentSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3.5 rounded-xl bg-card/30 border border-border/20"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-10 h-10 rounded-xl bg-muted/30 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded-md bg-muted/30 animate-pulse" />
            <div className="h-2.5 w-24 rounded-md bg-muted/20 animate-pulse" />
          </div>
          <div className="h-5 w-16 rounded-full bg-muted/20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ── Document Card Component ──────────────────────────────────

const DocumentCard = memo(function DocumentCard({
  document,
  index,
  onDelete,
  onRetry,
}: {
  document: Document;
  index: number;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const fileInfo = getFileTypeInfo(document.mimeType);
  const FileIcon = fileInfo.icon;

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Delete this document and all its processed chunks?')) return;
    setIsDeleting(true);
    setIsExiting(true);
    // Wait for exit animation
    await new Promise((r) => setTimeout(r, 250));
    try {
      await onDelete(document.id);
    } catch {
      setIsDeleting(false);
      setIsExiting(false);
    }
  }, [document.id, onDelete]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await onRetry(document.id);
    } finally {
      setIsRetrying(false);
    }
  }, [document.id, onRetry]);

  return (
    <div
      className={`
        group relative flex items-center gap-3 p-3.5 rounded-xl
        border border-border/20 bg-card/20 backdrop-blur-sm
        hover:bg-card/40 hover:border-primary/20
        hover:shadow-[0_0_20px_rgba(var(--primary-rgb,59,130,246),0.06)]
        transition-all duration-300 ease-out
        ${isExiting
          ? 'opacity-0 scale-95 -translate-x-4'
          : 'opacity-0 animate-fade-in-up'
        }
      `}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Processing indicator bar */}
      {document.status === 'processing' && (
        <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden bg-blue-500/10">
          <div className="h-full bg-blue-400/60 rounded-full animate-shimmer" style={{ width: '60%' }} />
        </div>
      )}

      {/* File Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: fileInfo.bg }}
      >
        <FileIcon className="w-4.5 h-4.5" style={{ color: fileInfo.color }} />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {document.originalName}
          </p>
          <StatusBadge status={document.status as DocumentStatus} />
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground">
            {formatFileSize(document.size)}
          </span>
          <span className="text-muted-foreground/30">&middot;</span>
          <span className="text-[11px] text-muted-foreground">
            {formatRelativeTime(document.uploadedAt)}
          </span>
          {document._count?.chunks !== undefined && document._count.chunks > 0 && (
            <>
              <span className="text-muted-foreground/30">&middot;</span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Layers className="w-2.5 h-2.5" />
                {document._count.chunks} chunks
              </span>
            </>
          )}
        </div>

        {/* Error message */}
        {document.errorMessage && (
          <p className="text-[11px] text-red-400/90 mt-1 truncate max-w-[300px]">
            {document.errorMessage.includes('fetch failed')
              ? 'Brain API offline — start Python backend to process'
              : document.errorMessage}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
        {(document.status === 'failed' || document.status === 'pending') && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground
                       hover:text-primary transition-all duration-200 disabled:opacity-50"
            title={document.status === 'failed' ? 'Retry processing' : 'Process now'}
          >
            {isRetrying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground
                     hover:text-red-400 transition-all duration-200 disabled:opacity-50"
          title="Delete document"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

function DocumentListInner({ subjectId }: DocumentListProps) {
  const { documents, isLoading } = useDocuments();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadDone = useRef(false);

  // Fetch documents on mount — stable ref, no re-render loop
  useEffect(() => {
    if (subjectId && !initialLoadDone.current) {
      initialLoadDone.current = true;
      documentActions.fetchDocuments({ subjectId }).catch(console.error);
    }
  }, [subjectId]);

  // Reset on subject change
  useEffect(() => {
    initialLoadDone.current = false;
  }, [subjectId]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await documentActions.fetchDocuments({ subjectId });
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [subjectId]);

  // Delete handler
  const handleDelete = useCallback(async (id: string) => {
    await documentActions.deleteDocument(id);
  }, []);

  // Retry handler
  const handleRetry = useCallback(async (id: string) => {
    try {
      await documentActions.triggerProcessing(id);
      documentActions.pollProcessingStatus(id).catch(() => {});
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, []);

  // ── Loading State ──────────────────────────────────────────

  if (isLoading && documents.length === 0) {
    return <DocumentSkeleton />;
  }

  // ── Empty State ────────────────────────────────────────────

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-scale">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center">
            <FileText className="w-9 h-9 text-muted-foreground/30" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-3.5 h-3.5 text-primary/50" />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-foreground mb-1">
          No documents yet
        </h4>
        <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
          Upload study materials to enable AI-powered document retrieval in your chats
        </p>

        <div className="flex items-center gap-4 mt-5 text-[10px] text-muted-foreground/50 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Smart Chunking
          </span>
          <span className="flex items-center gap-1">
            <Search className="w-3 h-3" />
            Semantic Search
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Retrieval
          </span>
        </div>
      </div>
    );
  }

  // ── Document List ──────────────────────────────────────────

  const completed = documents.filter((d) => d.status === 'completed').length;
  const processing = documents.filter((d) => d.status === 'processing').length;
  const failed = documents.filter((d) => d.status === 'failed').length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Documents ({documents.length})
          </p>

          {/* Status pills */}
          <div className="flex items-center gap-1.5">
            {completed > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                             bg-emerald-500/8 text-[10px] font-medium text-emerald-400">
                <CheckCircle className="w-2.5 h-2.5" />
                {completed}
              </span>
            )}
            {processing > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                             bg-blue-500/8 text-[10px] font-medium text-blue-400">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                {processing}
              </span>
            )}
            {failed > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md
                             bg-red-500/8 text-[10px] font-medium text-red-400">
                <AlertCircle className="w-2.5 h-2.5" />
                {failed}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg hover:bg-card/50 text-muted-foreground
                     hover:text-foreground transition-all duration-200 disabled:opacity-50"
          title="Refresh documents"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Document Cards */}
      <div className="space-y-1.5">
        {documents.map((doc, i) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            index={i}
            onDelete={handleDelete}
            onRetry={handleRetry}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(DocumentListInner);
