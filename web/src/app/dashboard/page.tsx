'use client';

import { useQuery } from '@tanstack/react-query';
import { Subject } from '@/types';
import { SubjectCard } from '@/components/subject-card';
import { DashboardHeader } from '@/components/dashboard-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Flame, MessageSquare, FileText, Brain, Sparkles } from 'lucide-react';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { Footer } from '@/components/footer';

async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch('/api/subjects');
  if (!res.ok) {
    throw new Error('Failed to fetch subjects');
  }
  return res.json();
}

async function fetchDashboardStats() {
  const res = await fetch('/api/analytics/dashboard');
  if (!res.ok) return null;
  return res.json();
}

export default function DashboardPage() {
  const { data: subjects, isLoading, error } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 60_000, // refresh every minute
  });

  const stats = dashboardData?.globalStats;
  const periodStats = dashboardData?.periodStats;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="animate-fade-in-up mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-outfit text-3xl font-black tracking-tight">
              Welcome back, <span className="text-gradient-animated">Student</span>
            </h2>
            <span className="text-3xl animate-float">👋</span>
          </div>
          <p className="text-muted-foreground">
            Choose a subject to continue your learning journey
          </p>
        </div>

        {/* Quick Stats */}
        <div className="animate-fade-in-up mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children" style={{ animationDelay: '0.1s' }}>
          {[
            { label: 'Study Streak', value: stats ? `${stats.currentStreak} days` : '—', icon: Flame, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
            { label: 'Total Chats', value: periodStats ? `${periodStats.totalMessages}` : '—', icon: MessageSquare, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
            { label: 'Documents', value: periodStats ? `${periodStats.totalDocuments}` : '—', icon: FileText, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
            { label: 'Quizzes Taken', value: stats ? `${stats.totalQuizzes ?? 0}` : '—', icon: Brain, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="animate-fade-in-up glass card-hover group rounded-2xl border border-border/30 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 font-outfit text-3xl font-bold">{stat.value}</p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subjects Grid */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-outfit text-xl font-bold">Your Subjects</h3>
            {subjects && (
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                {subjects.length} courses
              </span>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load subjects. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {subjects && subjects.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
              {subjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </div>
          )}

          {subjects && subjects.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No subjects found. Run the seed script to populate subjects.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      {/* First-visit onboarding tour */}
      <OnboardingModal />
      
      <Footer />
    </div>
  );
}
