import { useDocumentStore } from '@/store/documentStore';
import { useCallback, useRef } from 'react';
import type {
  Document,
  DocumentSearchResult,
  DocumentStatus,
} from '@/types';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT ACTIONS - Zero Re-render Architecture
// Uses getState() pattern: NO store subscription, NO re-renders
// Functions access store state on-demand, not reactively
// ═══════════════════════════════════════════════════════════════

// Direct store access (no React subscription)
const store = () => useDocumentStore.getState();

// ── Security Constants ──────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_EXTENSIONS: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
};

// ── Fetch with Timeout (no retry for fast UX) ──────────────

async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeout = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── File Validation ─────────────────────────────────────────

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Max ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'Only PDF, DOCX, TXT, and MD files are allowed' };
  }
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS[ext]) {
    return { valid: false, error: `Extension "${ext}" is not allowed` };
  }
  if (ALLOWED_EXTENSIONS[ext] !== file.type) {
    return { valid: false, error: 'File extension does not match file type' };
  }
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }
  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// STANDALONE DOCUMENT ACTIONS (no React hooks, no subscriptions)
// ═══════════════════════════════════════════════════════════════

export const documentActions = {
  /** Fetch all documents for a subject */
  async fetchDocuments(filters?: { subjectId?: string; status?: DocumentStatus }) {
    store().setIsLoadingDocuments(true);
    try {
      const params = new URLSearchParams();
      if (filters?.subjectId) params.append('subjectId', filters.subjectId);
      if (filters?.status) params.append('status', filters.status);

      const response = await safeFetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch documents: ${response.status}`);

      const data = await response.json();
      store().setDocuments(data.documents);
      return data.documents as Document[];
    } catch (error) {
      console.error('[Documents] Fetch error:', error);
      throw error;
    } finally {
      store().setIsLoadingDocuments(false);
    }
  },

  /** Fetch a single document by ID */
  async fetchDocument(id: string) {
    const response = await safeFetch(`/api/documents/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch document: ${response.status}`);
    const data = await response.json();
    return data.document as Document;
  },

  /** Upload a file with XHR progress tracking */
  async uploadDocument(file: File, subjectId: string): Promise<Document> {
    const validation = validateFile(file);
    if (!validation.valid) throw new Error(validation.error);

    store().setIsUploading(true);
    store().setUploadProgress(0);
    store().setUploadFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subjectId);

      const document = await new Promise<Document>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            store().setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.document);
            } catch {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
        xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

        xhr.timeout = 120000; // 2min for large files
        xhr.open('POST', '/api/documents');
        xhr.send(formData);
      });

      store().addDocument(document);
      store().setDocumentProcessingStatus(document.id, 'pending');
      return document;
    } finally {
      store().setIsUploading(false);
      setTimeout(() => store().setUploadFileName(null), 3000);
    }
  },

  /** Delete a document */
  async deleteDocument(id: string) {
    const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Delete failed (${response.status})`);
    store().removeDocument(id);
    store().removeProcessingStatus(id);
  },

  /** Trigger processing on Brain API */
  async triggerProcessing(documentId: string): Promise<Document> {
    store().setDocumentProcessingStatus(documentId, 'processing');

    try {
      const response = await safeFetch(
        `/api/documents/${documentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'process' }),
        },
        60000
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        store().setDocumentProcessingStatus(documentId, 'failed');
        throw new Error(`Processing request failed: ${errText}`);
      }

      const data = await response.json();
      store().updateDocument(documentId, data.document);
      store().setDocumentProcessingStatus(documentId, data.document.status);
      return data.document as Document;
    } catch (error) {
      store().setDocumentProcessingStatus(documentId, 'failed');
      throw error;
    }
  },

  /** Poll document status until completion or failure */
  async pollProcessingStatus(
    documentId: string,
    interval = 3000,
    maxAttempts = 60
  ): Promise<Document | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const doc = await documentActions.fetchDocument(documentId);
        store().updateDocument(documentId, doc);
        store().setDocumentProcessingStatus(documentId, doc.status as DocumentStatus);

        if (doc.status === 'completed' || doc.status === 'failed') {
          store().removeProcessingStatus(documentId);
          return doc;
        }
      } catch {
        // Continue polling on transient errors
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    return null;
  },

  /** Search documents via Brain API */
  async searchDocuments(query: string, subjectId: string, topK = 5) {
    store().setIsSearching(true);
    try {
      const response = await safeFetch(
        '/api/documents/search',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, subjectId, topK }),
        },
        15000
      );

      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();
      store().setSearchResults(data.results);
      return data.results as DocumentSearchResult[];
    } finally {
      store().setIsSearching(false);
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// REACT HOOK WRAPPER (stable refs - zero dependency churn)
// Thin wrapper over standalone actions for component compat
// ═══════════════════════════════════════════════════════════════

export function useDocumentActions() {
  const actionsRef = useRef(documentActions);

  const fetchDocuments = useCallback(
    (filters?: { subjectId?: string; status?: DocumentStatus }) =>
      actionsRef.current.fetchDocuments(filters),
    []
  );

  const fetchDocument = useCallback(
    (id: string) => actionsRef.current.fetchDocument(id),
    []
  );

  const uploadDocument = useCallback(
    (file: File, subjectId: string) =>
      actionsRef.current.uploadDocument(file, subjectId),
    []
  );

  const deleteDocument = useCallback(
    (id: string) => actionsRef.current.deleteDocument(id),
    []
  );

  const triggerProcessing = useCallback(
    (id: string) => actionsRef.current.triggerProcessing(id),
    []
  );

  const pollProcessingStatus = useCallback(
    (id: string, interval?: number, maxAttempts?: number) =>
      actionsRef.current.pollProcessingStatus(id, interval, maxAttempts),
    []
  );

  const searchDocuments = useCallback(
    (query: string, subjectId: string, topK?: number) =>
      actionsRef.current.searchDocuments(query, subjectId, topK),
    []
  );

  return {
    fetchDocuments,
    fetchDocument,
    uploadDocument,
    deleteDocument,
    triggerProcessing,
    pollProcessingStatus,
    searchDocuments,
    validateFile,
  };
}
