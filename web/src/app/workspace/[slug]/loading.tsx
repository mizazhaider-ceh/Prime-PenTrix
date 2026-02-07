import { Skeleton } from '@/components/ui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden w-72 border-r border-border/30 p-4 md:block">
        <Skeleton className="mb-6 h-8 w-32 rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center gap-4 border-b border-border/30 px-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-48 rounded" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-16 rounded-xl ${i % 2 === 0 ? 'ml-auto w-2/3' : 'w-3/4'}`}
              />
            ))}
          </div>
        </div>

        {/* Input skeleton */}
        <div className="border-t border-border/30 p-4">
          <Skeleton className="mx-auto h-12 max-w-3xl rounded-xl" />
        </div>
      </div>
    </div>
  );
}
