'use client';

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useUploadState } from '@/store/documentStore';
import { documentActions, validateFile } from '@/hooks/useDocumentActions';
import {
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  FileCode,
  File,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT UPLOAD - Modern Dynamic Upload Zone
// Features: Animated drop zone, circular progress, file preview,
// auto-dismiss notifications, glassmorphism design
// ═══════════════════════════════════════════════════════════════

const MAX_SIZE_MB = 20;
const ACCEPT_STRING = '.pdf,.docx,.txt,.md';

interface DocumentUploadProps {
  subjectId: string;
  onUploadComplete?: () => void;
}

// ── File Type Helpers ────────────────────────────────────────

function getFileInfo(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, { icon: typeof FileText; color: string; label: string }> = {
    pdf: { icon: FileText, color: '#ef4444', label: 'PDF' },
    docx: { icon: File, color: '#3b82f6', label: 'DOCX' },
    txt: { icon: FileCode, color: '#a855f7', label: 'TXT' },
    md: { icon: FileCode, color: '#22c55e', label: 'MD' },
  };
  return map[ext] || { icon: File, color: '#6b7280', label: ext.toUpperCase() };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Circular Progress SVG ────────────────────────────────────

function CircularProgress({ percent }: { percent: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        {/* Track */}
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-white/10"
        />
        {/* Progress */}
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent, var(--primary))" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
        {percent}%
      </span>
    </div>
  );
}

// ── Notification Toast ───────────────────────────────────────

function InlineToast({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`
        flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border
        animate-fade-in-up backdrop-blur-sm
        ${isSuccess
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          : 'bg-red-500/10 border-red-500/25 text-red-400'
        }
      `}
    >
      {isSuccess ? (
        <CheckCircle className="w-4 h-4 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      )}
      <p className="text-sm font-medium flex-1 truncate">{message}</p>
      <button
        onClick={onDismiss}
        className="p-0.5 rounded-md hover:bg-white/10 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

function DocumentUploadInner({ subjectId, onUploadComplete }: DocumentUploadProps) {
  const { isUploading, progress } = useUploadState();
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Handle file processing ─────────────────────────────────

  const processFile = useCallback(
    async (file: File) => {
      setPreviewFile(null);
      setNotification(null);

      try {
        const doc = await documentActions.uploadDocument(file, subjectId);
        setNotification({ type: 'success', message: `"${file.name}" uploaded successfully!` });

        // Trigger processing (fire-and-forget, handled gracefully)
        documentActions.triggerProcessing(doc.id).catch((err) => {
          console.warn('[Upload] Processing trigger failed (Brain API may be offline):', err.message);
        });

        // Poll status in background
        documentActions.pollProcessingStatus(doc.id).catch(() => {});

        onUploadComplete?.();
      } catch (err) {
        setNotification({
          type: 'error',
          message: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    },
    [subjectId, onUploadComplete]
  );

  // ── Handle file selection (with preview) ───────────────────

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      const validation = validateFile(file);
      if (!validation.valid) {
        setNotification({ type: 'error', message: validation.error! });
        return;
      }

      // Show preview, then auto-upload
      setPreviewFile(file);
      // Small delay for preview flash, then upload
      setTimeout(() => processFile(file), 400);
    },
    [processFile]
  );

  // ── Drag & Drop handlers ───────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only leave if actually leaving the container
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!isUploading) fileInputRef.current?.click();
  }, [isUploading]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFiles]
  );

  // ── Render ─────────────────────────────────────────────────

  const fileInfo = previewFile ? getFileInfo(previewFile) : null;

  return (
    <div className="space-y-2.5">
      {/* ── Drop Zone ──────────────────────────────────────── */}
      <div
        ref={dropRef}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed
          transition-all duration-300 ease-out cursor-pointer group
          ${isDragOver
            ? 'border-primary bg-primary/8 scale-[1.01] shadow-[0_0_30px_rgba(var(--primary-rgb,59,130,246),0.15)]'
            : 'border-border/40 hover:border-primary/40 hover:bg-card/30'
          }
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {/* Animated background pattern */}
        <div className={`
          absolute inset-0 opacity-0 transition-opacity duration-300
          ${isDragOver ? 'opacity-100' : 'group-hover:opacity-50'}
        `}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--primary)_0%,transparent_70%)] opacity-[0.04]" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload document"
        />

        <div className="relative z-10 flex flex-col items-center gap-3 p-6">
          {isUploading ? (
            /* ── Uploading State ─────────────────────────── */
            <>
              <CircularProgress percent={progress} />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  Uploading...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {progress < 100 ? 'Transferring file securely' : 'Finalizing...'}
                </p>
              </div>
            </>
          ) : previewFile && fileInfo ? (
            /* ── File Preview State ──────────────────────── */
            <div className="animate-fade-in-scale flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${fileInfo.color}15` }}
              >
                <fileInfo.icon className="w-5 h-5" style={{ color: fileInfo.color }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {previewFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileInfo.label} &middot; {formatSize(previewFile.size)}
                </p>
              </div>
            </div>
          ) : (
            /* ── Default State ───────────────────────────── */
            <>
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center
                transition-all duration-300
                ${isDragOver
                  ? 'bg-primary/15 scale-110'
                  : 'bg-primary/8 group-hover:bg-primary/12 group-hover:scale-105'
                }
              `}>
                <Upload className={`
                  w-5.5 h-5.5 transition-all duration-300
                  ${isDragOver ? 'text-primary scale-110' : 'text-primary/70 group-hover:text-primary'}
                `} />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop a file here or{' '}
                  <span className="text-primary font-semibold hover:underline">
                    browse
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  PDF, DOCX, TXT, MD &middot; Max {MAX_SIZE_MB}MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Drag overlay shimmer effect */}
        {isDragOver && (
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        )}
      </div>

      {/* ── Notification ───────────────────────────────────── */}
      {notification && (
        <InlineToast
          type={notification.type}
          message={notification.message}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default memo(DocumentUploadInner);
