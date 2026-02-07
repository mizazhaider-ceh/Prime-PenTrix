'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock, 
  Brain,
  TrendingUp,
  Loader2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import QuizInterface from './QuizInterface';
import QuizResults from './QuizResults';

interface ReviewQuestion {
  id: string;
  question: string;
  type: string;
  difficulty: string;
  reviewCount: number;
  easeFactor: number;
  interval: number;
  nextReviewAt: string;
  lastReviewedAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface ReviewDashboardProps {
  subjectId?: string;
}

export default function ReviewDashboard({ subjectId }: ReviewDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [stats, setStats] = useState({
    dueToday: 0,
    dueThisWeek: 0,
    totalReviews: 0,
    avgEaseFactor: 0
  });
  const [selectedView, setSelectedView] = useState<'overview' | 'practice' | 'results'>('overview');
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchReviewQuestions(controller.signal);
    return () => controller.abort();
  }, [subjectId]);

  const fetchReviewQuestions = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      params.append('limit', '50');

      const response = await fetch(`/api/quiz/submit?${params}`, { signal });
      if (!response.ok) throw new Error('Failed to fetch review questions');

      const data = await response.json();
      setQuestions(data.questions || []);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const dueToday = data.questions?.filter((q: ReviewQuestion) => 
        new Date(q.nextReviewAt) <= today
      ).length || 0;

      const dueThisWeek = data.questions?.filter((q: ReviewQuestion) => 
        new Date(q.nextReviewAt) <= weekFromNow
      ).length || 0;

      const totalReviews = data.questions?.reduce((sum: number, q: ReviewQuestion) => 
        sum + q.reviewCount, 0
      ) || 0;

      const avgEaseFactor = data.questions && data.questions.length > 0
        ? data.questions.reduce((sum: number, q: ReviewQuestion) => 
            sum + q.easeFactor, 0
          ) / data.questions.length
        : 0;

      setStats({
        dueToday,
        dueThisWeek,
        totalReviews,
        avgEaseFactor: parseFloat(avgEaseFactor.toFixed(2))
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Error fetching review questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedView('practice');
  };

  const handlePracticeComplete = (practiceResults: any) => {
    setResults(practiceResults);
    setSelectedView('results');
    fetchReviewQuestions(); // Refresh the review queue
  };

  const handleReturnToOverview = () => {
    setSelectedView('overview');
    setSelectedSubject(null);
    setResults(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const getEaseColor = (easeFactor: number) => {
    if (easeFactor >= 2.5) return 'text-green-600 dark:text-green-400';
    if (easeFactor >= 2.0) return 'text-blue-600 dark:text-blue-400';
    if (easeFactor >= 1.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (selectedView === 'results' && results && selectedSubject) {
    const subject = questions.find(q => q.subject.id === selectedSubject)?.subject;
    return (
      <QuizResults
        results={results}
        subjectName={subject?.name || 'Unknown Subject'}
        topic="Spaced Repetition Review"
        difficulty="medium"
        onRetake={() => {
          setResults(null);
          setSelectedView('practice');
        }}
        onExit={handleReturnToOverview}
      />
    );
  }

  if (selectedView === 'practice' && selectedSubject) {
    const subject = questions.find(q => q.subject.id === selectedSubject)?.subject;
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleReturnToOverview} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Review Dashboard
        </Button>
        <QuizInterface
          subjectId={selectedSubject}
          subjectName={subject?.name || 'Unknown Subject'}
          topic="Spaced Repetition Review"
          difficulty="medium"
          questionCount={5}
          onComplete={handlePracticeComplete}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading review data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4">
          <XCircle className="w-10 h-10 text-destructive" />
          <p className="text-base font-medium text-destructive text-center">{error}</p>
          <Button onClick={() => fetchReviewQuestions()} variant="outline">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Group questions by subject
  const questionsBySubject = questions.reduce((acc, q) => {
    const subjectId = q.subject.id;
    if (!acc[subjectId]) {
      acc[subjectId] = {
        subject: q.subject,
        questions: []
      };
    }
    acc[subjectId].questions.push(q);
    return acc;
  }, {} as Record<string, { subject: ReviewQuestion['subject'], questions: ReviewQuestion[] }>);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            Spaced Repetition Review
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Review questions based on your performance history using the SM-2 algorithm
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Due Today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.dueToday}
              </div>
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Due This Week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.dueThisWeek}
              </div>
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalReviews}
              </div>
              <RotateCcw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Avg Ease Factor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={`text-3xl font-bold ${getEaseColor(stats.avgEaseFactor)}`}>
                {stats.avgEaseFactor}
              </div>
              <TrendingUp className={`w-5 h-5 ${getEaseColor(stats.avgEaseFactor)}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions by Subject */}
      {Object.keys(questionsBySubject).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground mb-6">
              No questions are due for review right now. Great job staying on top of your studies!
            </p>
            <p className="text-sm text-muted-foreground">
              Take some quizzes to build your review queue
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.values(questionsBySubject).map(({ subject, questions: subjectQuestions }) => {
            const dueNow = subjectQuestions.filter(q => new Date(q.nextReviewAt) <= new Date()).length;
            const avgInterval = subjectQuestions.reduce((sum, q) => sum + q.interval, 0) / subjectQuestions.length;
            const avgEase = subjectQuestions.reduce((sum, q) => sum + q.easeFactor, 0) / subjectQuestions.length;

            return (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {subject.name}
                        <Badge variant="secondary">{subject.code}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {subjectQuestions.length} questions in review queue
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => startPractice(subject.id)}
                      disabled={dueNow === 0}
                    >
                      {dueNow > 0 ? `Review ${dueNow} Questions` : 'No Questions Due'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-secondary/30 rounded-lg">
                      <div className="text-2xl font-bold">{dueNow}</div>
                      <div className="text-xs text-muted-foreground">Due Now</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/30 rounded-lg">
                      <div className="text-2xl font-bold">{avgInterval.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Avg Interval (days)</div>
                    </div>
                    <div className="text-center p-3 bg-secondary/30 rounded-lg">
                      <div className={`text-2xl font-bold ${getEaseColor(avgEase)}`}>
                        {avgEase.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Ease Factor</div>
                    </div>
                  </div>

                  {/* Question List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subjectQuestions.slice(0, 10).map((question) => {
                      const isDue = new Date(question.nextReviewAt) <= new Date();
                      
                      return (
                        <div
                          key={question.id}
                          className={`p-3 rounded-lg border ${
                            isDue 
                              ? 'border-red-500/50 bg-red-500/5' 
                              : 'border-secondary bg-secondary/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 mr-4">
                              <p className="text-sm font-medium line-clamp-1">{question.question}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {question.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Reviewed {question.reviewCount}x
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${isDue ? 'text-red-600 dark:text-red-400' : ''}`}>
                                {formatDate(question.nextReviewAt)}
                              </div>
                              <div className={`text-xs ${getEaseColor(question.easeFactor)}`}>
                                EF: {question.easeFactor}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {subjectQuestions.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        + {subjectQuestions.length - 10} more questions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
