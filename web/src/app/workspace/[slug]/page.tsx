'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { AISettingsModal } from '@/components/ai-settings-modal';
import { UserButton } from '@clerk/nextjs';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Wrench,
  Brain,
  Sparkles,
  Menu,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering to avoid Clerk validation during static generation in CI
export const dynamic = 'force-dynamic';
import dynamic from 'next/dynamic';
import { useChatStore } from '@/store/chatStore';
import { useChatActions } from '@/hooks/useChatActions';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { useEffect, useState, useCallback } from 'react';

// Lazy-load heavy tab components for faster initial render
const ConversationSidebar = dynamic(() => import('@/components/chat/ConversationSidebar'), {
  ssr: false,
  loading: () => <div className="w-72 animate-pulse bg-muted/20" />,
});

const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center"><Skeleton className="h-32 w-64 rounded-xl" /></div>,
});

const DocumentsTab = dynamic(() => import('@/components/documents/DocumentsTab'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center"><Skeleton className="h-64 w-96 rounded-xl" /></div>,
});

const ToolsTab = dynamic(() => import('@/components/tools/ToolsTab'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center"><Skeleton className="h-64 w-96 rounded-xl" /></div>,
});

// Dynamic import to avoid SSR hydration mismatch from Radix Select useId()
const QuizTab = dynamic(() => import('@/components/quiz/QuizTab'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center"><Skeleton className="h-64 w-96 rounded-xl" /></div>,
});

async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch('/api/subjects');
  if (!res.ok) throw new Error('Failed to fetch subjects');
  return res.json();
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [currentTab, setCurrentTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { currentConversation } = useChatStore();
  const { createConversation, fetchConversations, fetchConversation } = useChatActions();

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
    staleTime: 5 * 60 * 1000, // 5 min — subjects rarely change
    gcTime: 10 * 60 * 1000,
  });

  const subject = subjects?.find((s) => s.slug === slug);

  const handleTabChange = useCallback((val: string) => setCurrentTab(val), []);

  // Session tracking
  const { session, isActive, incrementMessageCount } = useSessionTracking({
    subjectId: subject?.id || '',
    mode: currentTab as 'chat' | 'docs' | 'tools' | 'quiz',
    autoSave: true
  });

  // Auto-create conversation if none exists for this subject
  useEffect(() => {
    if (!subject?.id) return;

    const initConversation = async () => {
      try {
        // Fetch conversations for this subject
        const subjectConvs = await fetchConversations({ subjectId: subject.id });
        
        // Check if current conversation belongs to this subject
        const needsNewConversation = !currentConversation || currentConversation.subjectId !== subject.id;
        
        if (needsNewConversation) {
          if (subjectConvs.length === 0) {
            // Create first conversation automatically
            const newConv = await createConversation({
              title: `${subject.name} Chat`,
              subjectId: subject.id,
              mode: 'chat',
            });
            await fetchConversation(newConv.id);
          } else {
            // Load the most recent conversation for this subject
            await fetchConversation(subjectConvs[0].id);
          }
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
      }
    };

    initConversation();
  }, [subject?.id, currentConversation?.subjectId, fetchConversations, createConversation, fetchConversation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
              <Sparkles className="h-6 w-6 text-primary animate-spin-slow" />
            </div>
          </div>
          <Skeleton className="mx-auto h-4 w-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
          <span className="text-4xl">🔍</span>
        </div>
        <div className="text-center">
          <h1 className="mb-2 font-outfit text-2xl font-bold">Subject not found</h1>
          <p className="text-sm text-muted-foreground">This workspace doesn&apos;t exist or was removed</p>
        </div>
        <Button onClick={() => router.push('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Premium Header */}
      <header className="relative flex-shrink-0 glass overflow-hidden">
        {/* Subject-colored top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${subject.color}, transparent)`,
          }}
        />

        <div className="flex h-14 items-center justify-between px-4">
          {/* Left: Back + Subject */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="h-8 w-8 hover:bg-primary/10"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="h-6 w-px bg-border/30" />
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-300 hover:scale-110"
                style={{ backgroundColor: `${subject.color}15` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: subject.color }} />
              </div>
              <div className="min-w-0">
                <h1 className="font-outfit text-sm font-bold leading-tight truncate" style={{ color: subject.color }}>
                  {subject.name}
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{subject.code}</p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <AISettingsModal />
            <ThemeSwitcher />
            <div className="h-6 w-px bg-border/30" />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8 ring-2 ring-offset-2 ring-offset-background',
                  avatarImage: 'rounded-lg',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <Tabs defaultValue="chat" onValueChange={handleTabChange} className="flex h-full flex-col">
          {/* Tab Navigation */}
          <div className="flex-shrink-0 border-b border-border/30 px-2 sm:px-4 overflow-x-auto scrollbar-none">
            <TabsList className="h-11 w-max justify-start gap-0.5 sm:gap-1 bg-transparent">
              {[
                { value: 'chat', icon: MessageSquare, label: 'Chat' },
                { value: 'docs', icon: FileText, label: 'Documents & RAG', shortLabel: 'Docs' },
                { value: 'tools', icon: Wrench, label: 'Tools' },
                { value: 'quiz', icon: Brain, label: 'Quiz' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-4 text-xs font-medium whitespace-nowrap data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{'shortLabel' in tab ? tab.shortLabel : tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="chat" className="m-0 h-full">
              <div className="flex h-full relative">
                {/* Mobile sidebar toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="absolute top-2 left-2 z-20 md:hidden h-8 w-8"
                  aria-label={sidebarOpen ? 'Close conversations' : 'Open conversations'}
                >
                  <Menu className="h-4 w-4" />
                </Button>

                {/* Conversation Sidebar — hidden on mobile, toggled via button */}
                <div className={`
                  absolute inset-y-0 left-0 z-10 w-72 flex-shrink-0 border-r border-border/20 glass-subtle
                  transition-transform duration-200 ease-in-out
                  md:relative md:translate-x-0
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                  <ConversationSidebar subjectId={subject.id} />
                </div>

                {/* Backdrop overlay on mobile when sidebar is open */}
                {sidebarOpen && (
                  <div
                    className="absolute inset-0 z-[5] bg-black/20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                  />
                )}

                {/* Pure AI Chat — no RAG, no document search */}
                <div className="flex-1 pl-10 md:pl-0">
                  <ChatInterface useRag={false} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="docs" className="m-0 h-full">
              <DocumentsTab subjectId={subject.id} />
            </TabsContent>

            <TabsContent value="tools" className="m-0 h-full">
              <ToolsTab subjectCode={subject.code} subjectId={subject.id} />
            </TabsContent>

            <TabsContent value="quiz" className="m-0 h-full">
              <QuizTab subjectId={subject.id} subjectName={subject.name} topics={subject.topics || []} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
