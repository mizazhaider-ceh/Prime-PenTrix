import { useChatStore, ConversationWithDetails, MessageWithUser } from '@/store/chatStore';
import { useCallback } from 'react';

// Helper: Fetch with retry and timeout
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (i === retries) throw error;
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 500));
    }
  }
  throw new Error('Fetch failed after retries');
}

export function useChatActions() {
  const {
    setCurrentConversation,
    setConversations,
    setMessages,
    addMessage,
    addConversation,
    updateConversation,
    deleteConversation,
    setIsLoadingConversations,
    setIsLoadingMessages,
    setIsSendingMessage,
  } = useChatStore();

  // Fetch all conversations
  const fetchConversations = useCallback(async (filters?: {
    subjectId?: string;
    mode?: string;
    search?: string;
    timeFilter?: 'all' | 'today' | 'week' | 'month';
  }) => {
    setIsLoadingConversations(true);
    try {
      const params = new URLSearchParams();
      if (filters?.subjectId) params.append('subjectId', filters.subjectId);
      if (filters?.mode) params.append('mode', filters.mode);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.timeFilter && filters.timeFilter !== 'all') {
        params.append('timeFilter', filters.timeFilter);
      }

      const response = await fetchWithRetry(`/api/conversations?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch conversations: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setConversations(data.conversations);
      return data.conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    } finally {
      setIsLoadingConversations(false);
    }
  }, [setIsLoadingConversations, setConversations]);

  // Fetch single conversation with messages
  const fetchConversation = useCallback(async (id: string, retryCount = 0) => {
    if (!id || id === 'undefined') {
      throw new Error('Invalid conversation ID');
    }

    setIsLoadingMessages(true);
    try {
      const response = await fetchWithRetry(`/api/conversations/${id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch conversation: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.conversation) {
        throw new Error('No conversation data received');
      }
      
      setCurrentConversation(data.conversation);
      setMessages(data.conversation.messages || []);
      return data.conversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [setIsLoadingMessages, setCurrentConversation, setMessages]);

  // Create new conversation
  const createConversation = useCallback(async (data: {
    title: string;
    subjectId: string;
    mode: string;
  }) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const result = await response.json();
      addConversation(result.conversation);
      return result.conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [addConversation]);

  // Update conversation
  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to update conversation');

      const data = await response.json();
      updateConversation(id, { title });
      return data.conversation;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }, [updateConversation]);

  // Delete conversation
  const removeConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete conversation');

      deleteConversation(id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }, [deleteConversation]);

  // Send message
  const sendMessage = useCallback(async (data: {
    conversationId: string;
    content: string;
  }) => {
    setIsSendingMessage(true);
    try {
      // Save user message
      const userMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: data.conversationId,
          role: 'user',
          content: data.content,
        }),
      });

      if (!userMessageResponse.ok) throw new Error('Failed to save user message');

      const userMessageData = await userMessageResponse.json();
      addMessage(userMessageData.message);

      return userMessageData.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsSendingMessage(false);
    }
  }, [setIsSendingMessage, addMessage]);

  return {
    fetchConversations,
    fetchConversation,
    createConversation,
    updateConversationTitle,
    removeConversation,
    sendMessage,
  };
}
