import { create } from 'zustand';
import { Conversation, Message, Subject } from '@prisma/client';

export type MessageWithUser = Message & {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export type ConversationWithDetails = Conversation & {
  subject: Subject;
  messages: MessageWithUser[];
  _count: {
    messages: number;
  };
};

interface ChatState {
  // Current conversation
  currentConversation: ConversationWithDetails | null;
  
  // All conversations for sidebar
  conversations: ConversationWithDetails[];
  
  // Messages for current conversation
  messages: MessageWithUser[];
  
  // Loading states
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  
  // Streaming state
  isStreaming: boolean;
  streamingMessage: string;
  
  // Filters
  filterSubjectId: string | null;
  filterMode: string | null;
  searchQuery: string;
  timeFilter: 'all' | 'today' | 'week' | 'month';
  
  // Actions
  setCurrentConversation: (conversation: ConversationWithDetails | null) => void;
  setConversations: (conversations: ConversationWithDetails[]) => void;
  setMessages: (messages: MessageWithUser[]) => void;
  addMessage: (message: MessageWithUser) => void;
  updateMessage: (id: string, updates: Partial<MessageWithUser>) => void;
  deleteMessage: (id: string) => void;
  
  // Streaming
  setIsStreaming: (isStreaming: boolean) => void;
  appendToStreamingMessage: (chunk: string) => void;
  clearStreamingMessage: () => void;
  finalizeStreamingMessage: (message: MessageWithUser) => void;
  
  // Filters
  setFilterSubjectId: (subjectId: string | null) => void;
  setFilterMode: (mode: string | null) => void;
  setSearchQuery: (query: string) => void;
  setTimeFilter: (filter: 'all' | 'today' | 'week' | 'month') => void;
  
  // Loading states
  setIsLoadingConversations: (isLoading: boolean) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
  setIsSendingMessage: (isSending: boolean) => void;
  
  // Conversation management
  addConversation: (conversation: ConversationWithDetails) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  
  // Reset
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  isStreaming: false,
  streamingMessage: '',
  filterSubjectId: null,
  filterMode: null,
  searchQuery: '',
  timeFilter: 'all',

  // Actions
  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  setConversations: (conversations) =>
    set({ conversations }),

  setMessages: (messages) =>
    set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  // Streaming
  setIsStreaming: (isStreaming) =>
    set({ isStreaming }),

  appendToStreamingMessage: (chunk) =>
    set((state) => ({
      streamingMessage: state.streamingMessage + chunk,
    })),

  clearStreamingMessage: () =>
    set({ streamingMessage: '' }),

  finalizeStreamingMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      streamingMessage: '',
      isStreaming: false,
    })),

  // Filters
  setFilterSubjectId: (subjectId) =>
    set({ filterSubjectId: subjectId }),

  setFilterMode: (mode) =>
    set({ filterMode: mode }),

  setSearchQuery: (query) =>
    set({ searchQuery: query }),

  setTimeFilter: (filter) =>
    set({ timeFilter: filter }),

  // Loading states
  setIsLoadingConversations: (isLoading) =>
    set({ isLoadingConversations: isLoading }),

  setIsLoadingMessages: (isLoading) =>
    set({ isLoadingMessages: isLoading }),

  setIsSendingMessage: (isSending) =>
    set({ isSendingMessage: isSending }),

  // Conversation management
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    })),

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      currentConversation:
        state.currentConversation?.id === id ? null : state.currentConversation,
    })),

  // Reset
  reset: () =>
    set({
      currentConversation: null,
      conversations: [],
      messages: [],
      isLoadingConversations: false,
      isLoadingMessages: false,
      isSendingMessage: false,
      isStreaming: false,
      streamingMessage: '',
      filterSubjectId: null,
      filterMode: null,
      searchQuery: '',
      timeFilter: 'all',
    }),
}));
