'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { UserButton } from '@clerk/nextjs';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  Wrench,
  Brain,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import ChatInterface from '@/components/chat/ChatInterface';
import { useChatStore } from '@/store/chatStore';
import { useChatActions } from '@/hooks/useChatActions';
import { useEffect } from 'react';

async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch('/api/subjects');
  if (!res.ok) throw new Error('Failed to fetch subjects');
  return res.json();
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { currentConversation } = useChatStore();
  const { createConversation, fetchConversations, fetchConversation } = useChatActions();

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  });

  const subject = subjects?.find((s) => s.slug === slug);

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
      <header className="relative flex-shrink-0 glass">
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
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="h-6 w-px bg-border/30" />
            
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 hover:scale-110"
                style={{ backgroundColor: `${subject.color}15` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: subject.color }} />
              </div>
              <div>
                <h1 className="font-outfit text-sm font-bold leading-tight" style={{ color: subject.color }}>
                  {subject.name}
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{subject.code}</p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
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
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="chat" className="flex h-full flex-col">
          {/* Tab Navigation */}
          <div className="flex-shrink-0 border-b border-border/30 px-4 glass-subtle">
            <TabsList className="h-11 w-full justify-start gap-1 bg-transparent">
              {[
                { value: 'chat', icon: MessageSquare, label: 'Chat' },
                { value: 'docs', icon: FileText, label: 'Documents' },
                { value: 'tools', icon: Wrench, label: 'Tools' },
                { value: 'quiz', icon: Brain, label: 'Quiz' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-2 rounded-lg px-4 text-xs font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="chat" className="m-0 h-full">
              <div className="flex h-full">
                {/* Conversation Sidebar */}
                <div className="w-72 flex-shrink-0 border-r border-border/20 glass-subtle">
                  <ConversationSidebar subjectId={subject.id} />
                </div>
                {/* Chat Area */}
                <div className="flex-1">
                  <ChatInterface />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="docs" className="m-0 h-full">
              <div className="flex h-full items-center justify-center">
                <div className="animate-fade-in-scale text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="mb-2 font-outfit text-xl font-bold">Document Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload & manage study documents
                  </p>
                  <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Coming in Phase 3
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="m-0 h-full">
              <div className="flex h-full items-center justify-center">
                <div className="animate-fade-in-scale text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                    <Wrench className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="mb-2 font-outfit text-xl font-bold">Subject Toolkit</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {subject.toolkit.length} tools available for {subject.name}
                  </p>
                  <div className="mx-auto max-w-sm">
                    <div className="flex flex-wrap justify-center gap-2">
                      {subject.toolkit.slice(0, 6).map((tool) => (
                        <span
                          key={tool}
                          className="rounded-lg border border-border/30 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground"
                        >
                          {tool}
                        </span>
                      ))}
                      {subject.toolkit.length > 6 && (
                        <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                          +{subject.toolkit.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="m-0 h-full">
              <div className="flex h-full items-center justify-center">
                <div className="animate-fade-in-scale text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
                    <Brain className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="mb-2 font-outfit text-xl font-bold">Quiz System</h3>
                  <p className="text-sm text-muted-foreground">
                    Interactive quizzes with spaced repetition
                  </p>
                  <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Coming in Phase 4
                  </span>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
