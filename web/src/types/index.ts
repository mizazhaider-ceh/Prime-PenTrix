// Core subject type matching Prisma schema
export interface Subject {
  id: string;
  code: string;
  slug: string;
  name: string;
  credits: number;
  color: string;
  gradient: string;
  icon: string;
  teachers: string[];
  topics: string[];
  pedagogy: string;
  toolkit: string[];
  promptStyle: string;
  examType: string;
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// User type
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  theme: string;
  settings: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastActiveAt: Date | string;
}

// Conversation type  
export interface Conversation {
  id: string;
  title: string;
  mode: string;
  userId: string;
  subjectId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Message type
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number | null;
  model: string | null;
  contextUsed: string[];
  conversationId: string;
  userId: string;
  createdAt: Date | string;
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT & RAG TYPES
// ═══════════════════════════════════════════════════════════════

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AllowedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'
  | 'text/markdown';

export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: AllowedMimeType;
  size: number;
  fileUrl: string | null;
  status: DocumentStatus;
  errorMessage: string | null;
  userId: string;
  subjectId: string;
  uploadedAt: Date | string;
  processedAt: Date | string | null;
  _count?: {
    chunks: number;
  };
  subject?: {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
  };
}

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  startChar: number | null;
  endChar: number | null;
  documentId: string;
  createdAt: Date | string;
  score?: number; // Relevance score from search
}

export interface DocumentSearchResult {
  chunk: DocumentChunk;
  document: {
    id: string;
    filename: string;
    originalName: string;
  };
  score: number;
  searchType: 'semantic' | 'bm25' | 'hybrid';
}

export interface DocumentUploadResponse {
  document: Document;
  message: string;
}

export interface DocumentProcessingStatus {
  documentId: string;
  status: DocumentStatus;
  progress: number; // 0-100
  chunksCreated: number;
  errorMessage: string | null;
}

// Analytics types
export interface GlobalStats {
  id: string;
  userId: string;
  totalStudyTime: number;
  totalChats: number;
  totalQuizzes: number;
  totalDocuments: number;
  totalToolUses: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | string | null;
  achievements: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
}
