'use client';

import ConversationSidebar from '@/components/chat/ConversationSidebar';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar - 320px wide */}
      <div className="w-80 flex-shrink-0">
        <ConversationSidebar />
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}
