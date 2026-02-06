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
