import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  MessageSquareText,
  FileText,
  Wrench,
  Brain,
  Search,
  Upload,
  FolderOpen,
  Calendar,
  BarChart3,
  Settings,
  Inbox
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  children
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>

        {children}

        {(action || secondaryAction) && (
          <div className="flex items-center gap-3">
            {action && (
              <Button onClick={action.onClick} size="lg">
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specific Empty States

export function NoConversationsEmpty({ onCreateConversation }: { onCreateConversation: () => void }) {
  return (
    <EmptyState
      icon={MessageSquareText}
      title="No Conversations Yet"
      description="Start a conversation with an AI tutor to begin your learning journey. Your conversation history will appear here."
      action={{
        label: 'Start Chatting',
        onClick: onCreateConversation
      }}
    />
  );
}

export function NoDocumentsEmpty({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No Documents Uploaded"
      description="Upload PDF, TXT, or MD files to enable AI-powered document search and context-aware responses."
      action={{
        label: 'Upload Document',
        onClick: onUpload
      }}
    >
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 max-w-md">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Pro Tip:</strong> Documents are processed with RAG technology to help the AI 
          answer questions based on your specific materials.
        </p>
      </div>
    </EmptyState>
  );
}

export function NoToolsEmpty() {
  return (
    <EmptyState
      icon={Wrench}
      title="No Tools Available"
      description="Tools are subject-specific utilities. Select a subject to access specialized tools for that domain."
    />
  );
}

export function NoQuizzesEmpty({ onCreateQuiz }: { onCreateQuiz: () => void }) {
  return (
    <EmptyState
      icon={Brain}
      title="No Quizzes Taken Yet"
      description="Test your knowledge with AI-generated quizzes. Your quiz results and review schedule will appear here."
      action={{
        label: 'Generate Quiz',
        onClick: onCreateQuiz
      }}
    />
  );
}

export function NoSearchResultsEmpty({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={
        query 
          ? `No results found for "${query}". Try different keywords or check your spelling.`
          : "Your search didn't match any items. Try using different keywords."
      }
      action={onClear ? {
        label: 'Clear Search',
        onClick: onClear
      } : undefined}
    />
  );
}

export function NoAnalyticsEmpty({ onStartStudying }: { onStartStudying?: () => void }) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No Analytics Data Yet"
      description="Start learning to see your study statistics. We'll track your progress, streaks, and performance over time."
      action={onStartStudying ? {
        label: 'Start Learning',
        onClick: onStartStudying
      } : undefined}
    >
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-lg">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Study Time</div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        <div className="p-3 bg-secondary/30 rounded-lg">
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>
    </EmptyState>
  );
}

export function NoReviewQuestionsEmpty() {
  return (
    <EmptyState
      icon={Calendar}
      title="All Caught Up!"
      description="No questions are due for review right now. Take some quizzes to build your spaced repetition queue."
    >
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 max-w-md">
        <p className="text-sm text-green-700 dark:text-green-300">
          Great job staying on top of your reviews! The spaced repetition algorithm will 
          remind you when it&apos;s time to review again.
        </p>
      </div>
    </EmptyState>
  );
}

export function NoHistoryEmpty({ type = 'activity' }: { type?: 'activity' | 'sessions' | 'quizzes' }) {
  const titles = {
    activity: 'No Activity History',
    sessions: 'No Study Sessions',
    quizzes: 'No Quiz History'
  };

  const descriptions = {
    activity: 'Your recent activity will appear here as you use the platform.',
    sessions: 'Your study sessions will be tracked automatically as you learn.',
    quizzes: 'Your quiz attempts and scores will be recorded here.'
  };

  return (
    <EmptyState
      icon={FolderOpen}
      title={titles[type]}
      description={descriptions[type]}
    />
  );
}

export function NoSubjectsEmpty({ onManageSubjects }: { onManageSubjects?: () => void }) {
  return (
    <EmptyState
      icon={Settings}
      title="No Subjects Available"
      description="Subjects need to be configured. Contact your administrator or check the configuration."
      action={onManageSubjects ? {
        label: 'Manage Subjects',
        onClick: onManageSubjects
      } : undefined}
    />
  );
}

export function ErrorEmpty({ 
  title = 'Something Went Wrong',
  description = 'An error occurred while loading this content. Please try again.',
  onRetry
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry
      } : undefined}
      className="border-destructive/50"
    />
  );
}

// Generic list empty state
export function ListEmpty({ 
  title, 
  description, 
  icon = Inbox,
  onAction,
  actionLabel = 'Add Item'
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onAction ? {
        label: actionLabel,
        onClick: onAction
      } : undefined}
    />
  );
}

// Inline mini empty state (for smaller sections)
export function MiniEmptyState({
  icon: Icon = Inbox,
  message,
  action
}: {
  icon?: LucideIcon;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Icon className="w-8 h-8 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {action && (
        <Button onClick={action.onClick} size="sm" variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
