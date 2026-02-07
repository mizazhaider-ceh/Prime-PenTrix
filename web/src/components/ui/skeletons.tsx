import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-secondary/50',
        className
      )}
    />
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chat Skeleton
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>

        {/* AI Message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>

        {/* AI Message Loading */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-2 w-2 rounded-full animate-bounce" />
              <Skeleton className="h-2 w-2 rounded-full animate-bounce [animation-delay:0.2s]" />
              <Skeleton className="h-2 w-2 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Analytics Skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Activity Calendar */}
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {[...Array(13)].map((_, week) => (
            <div key={week} className="flex gap-1">
              {[...Array(7)].map((_, day) => (
                <Skeleton key={day} className="h-4 w-4 rounded-sm" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-xl border p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Document List Skeleton
export function DocumentListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-lg border p-4 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Tool Card Skeleton
export function ToolCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Quiz Skeleton
export function QuizSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="rounded-xl border p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      {/* Question Card */}
      <div className="rounded-xl border p-6 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>

        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4 pb-3 border-b">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// Conversation List Skeleton
export function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
