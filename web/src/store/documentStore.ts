import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type {
  Document,
  DocumentStatus,
  DocumentSearchResult,
} from '@/types';

// ═══════════════════════════════════════════════════════════════
// DOCUMENT STORE - High-Performance State for RAG Documents
// Uses Zustand selectors to prevent unnecessary re-renders
// ═══════════════════════════════════════════════════════════════

interface DocumentState {
  // Document list
  documents: Document[];
  currentDocument: Document | null;

  // Search results
  searchResults: DocumentSearchResult[];
  searchQuery: string;

  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadFileName: string | null;

  // Processing state
  processingDocuments: Map<string, DocumentStatus>;

  // Loading states
  isLoadingDocuments: boolean;
  isSearching: boolean;

  // Filters
  filterSubjectId: string | null;
  filterStatus: DocumentStatus | null;

  // Actions - Documents
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setCurrentDocument: (document: Document | null) => void;

  // Actions - Search
  setSearchResults: (results: DocumentSearchResult[]) => void;
  setSearchQuery: (query: string) => void;
  clearSearchResults: () => void;

  // Actions - Upload
  setIsUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadFileName: (name: string | null) => void;

  // Actions - Processing
  setDocumentProcessingStatus: (id: string, status: DocumentStatus) => void;
  removeProcessingStatus: (id: string) => void;

  // Actions - Loading
  setIsLoadingDocuments: (isLoading: boolean) => void;
  setIsSearching: (isSearching: boolean) => void;

  // Actions - Filters
  setFilterSubjectId: (subjectId: string | null) => void;
  setFilterStatus: (status: DocumentStatus | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  documents: [] as Document[],
  currentDocument: null as Document | null,
  searchResults: [] as DocumentSearchResult[],
  searchQuery: '',
  isUploading: false,
  uploadProgress: 0,
  uploadFileName: null as string | null,
  processingDocuments: new Map<string, DocumentStatus>(),
  isLoadingDocuments: false,
  isSearching: false,
  filterSubjectId: null as string | null,
  filterStatus: null as DocumentStatus | null,
};

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,

  // ─── Document Actions ────────────────────────────────────────

  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),

  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
      currentDocument:
        state.currentDocument?.id === id
          ? { ...state.currentDocument, ...updates }
          : state.currentDocument,
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      currentDocument:
        state.currentDocument?.id === id ? null : state.currentDocument,
    })),

  setCurrentDocument: (document) => set({ currentDocument: document }),

  // ─── Search Actions ──────────────────────────────────────────

  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchResults: () => set({ searchResults: [], searchQuery: '' }),

  // ─── Upload Actions ──────────────────────────────────────────

  setIsUploading: (isUploading) => set({ isUploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setUploadFileName: (name) => set({ uploadFileName: name }),

  // ─── Processing Actions ──────────────────────────────────────

  setDocumentProcessingStatus: (id, status) =>
    set((state) => {
      const newMap = new Map(state.processingDocuments);
      newMap.set(id, status);
      return { processingDocuments: newMap };
    }),

  removeProcessingStatus: (id) =>
    set((state) => {
      const newMap = new Map(state.processingDocuments);
      newMap.delete(id);
      return { processingDocuments: newMap };
    }),

  // ─── Loading Actions ─────────────────────────────────────────

  setIsLoadingDocuments: (isLoading) => set({ isLoadingDocuments: isLoading }),
  setIsSearching: (isSearching) => set({ isSearching }),

  // ─── Filter Actions ──────────────────────────────────────────

  setFilterSubjectId: (subjectId) => set({ filterSubjectId: subjectId }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  // ─── Reset ───────────────────────────────────────────────────

  reset: () => set({ ...initialState, processingDocuments: new Map() }),
}));

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE SELECTORS - Prevent unnecessary re-renders
// Components only subscribe to the exact slices they need
// ═══════════════════════════════════════════════════════════════

/** Documents list + loading state (for DocumentList) */
export const useDocuments = () =>
  useDocumentStore(
    useShallow((s) => ({
      documents: s.documents,
      isLoading: s.isLoadingDocuments,
    }))
  );

/** Upload state only (for DocumentUpload) */
export const useUploadState = () =>
  useDocumentStore(
    useShallow((s) => ({
      isUploading: s.isUploading,
      progress: s.uploadProgress,
      fileName: s.uploadFileName,
    }))
  );

/** Search state (for search components) */
export const useSearchState = () =>
  useDocumentStore(
    useShallow((s) => ({
      results: s.searchResults,
      query: s.searchQuery,
      isSearching: s.isSearching,
    }))
  );

/** Processing state for a specific document */
export const useDocumentProcessing = (docId: string) =>
  useDocumentStore((s) => s.processingDocuments.get(docId));
