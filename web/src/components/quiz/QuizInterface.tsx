'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Clock, Brain } from 'lucide-react';

type QuestionType = 'mcq' | 'true-false' | 'fill-blank' | 'short-answer';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct: string;
  explanation: string;
  userAnswer: string | null;
}

interface QuizInterfaceProps {
  subjectId: string;
  subjectName: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  questionTypes?: string[];
  onComplete?: (results: any) => void;
}

export default function QuizInterface({
  subjectId,
  subjectName,
  topic,
  difficulty = 'medium',
  questionCount = 5,
  questionTypes = ['mcq', 'true-false', 'fill-blank', 'short-answer'],
  onComplete
}: QuizInterfaceProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Live timer
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, startTime, questions.length]);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const controller = new AbortController();
    generateQuiz(controller.signal);
    return () => controller.abort();
  }, []);

  const generateQuiz = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          topic,
          difficulty,
          questionCount,
          questionTypes,
          useDocuments: true
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Quiz generation failed (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions);
        setStartTime(Date.now());
      } else {
        throw new Error('No questions generated');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Quiz generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const questionsWithAnswers = questions.map(q => ({
        ...q,
        userAnswer: answers[q.id] || ''
      }));

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          topic: topic || 'General',
          difficulty,
          questions: questionsWithAnswers,
          timeSpent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await response.json();
      
      if (data.success && onComplete) {
        // Invalidate dashboard stats so quiz count refreshes on navigation
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        onComplete(data.results);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const userAnswer = answers[currentQuestion.id] || '';

    switch (currentQuestion.type) {
      case 'mcq':
        return (
          <RadioGroup
            value={userAnswer}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                <RadioGroupItem value={option} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true-false':
        return (
          <RadioGroup
            value={userAnswer}
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            className="space-y-3"
          >
            {['True', 'False'].map((option) => (
              <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                <RadioGroupItem value={option} id={`option-${option}`} />
                <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'fill-blank':
        return (
          <Input
            value={userAnswer}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Type your answer..."
            className="text-lg p-6"
          />
        );

      case 'short-answer':
        return (
          <Textarea
            value={userAnswer}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Type your answer..."
            className="min-h-[120px] text-base"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-primary" />
          <p className="text-base sm:text-lg font-medium">Generating quiz questions...</p>
          <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">Using AI to create personalized questions</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 px-4">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive" />
          <p className="text-base sm:text-lg font-medium text-destructive text-center">{error}</p>
          <Button onClick={() => generateQuiz()} size="lg" className="gap-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4">
          <XCircle className="w-10 h-10 text-muted-foreground" />
          <p className="text-base font-medium text-muted-foreground">No questions generated</p>
          <Button onClick={() => generateQuiz()} variant="outline">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const isAnswered = !!answers[currentQuestion.id];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-2xl truncate">{subjectName} Quiz</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {topic && `Topic: ${topic} · `}
                Difficulty: <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">{difficulty}</Badge>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="tabular-nums font-medium">{formatElapsed(elapsed)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} / {questions.length} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-3 capitalize">
                {currentQuestion.type.replace('-', ' ')}
              </Badge>
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </div>
            <Brain className="w-6 h-6 text-primary flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderQuestionInput()}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-shrink-0"
            >
              Previous
            </Button>

            {/* Smart pagination — scrollable on mobile, grouped on desktop */}
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
              <div className="flex justify-center gap-1 sm:gap-1.5 px-1" role="navigation" aria-label="Question navigation">
                {(() => {
                  const total = questions.length;
                  // For <= 15 questions, show all dots
                  if (total <= 15) {
                    return questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Question ${idx + 1}${answers[questions[idx].id] ? ' (answered)' : ''}`}
                        aria-current={idx === currentIndex ? 'step' : undefined}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-medium transition-all flex-shrink-0 ${
                          idx === currentIndex
                            ? 'bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30'
                            : answers[questions[idx].id]
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ));
                  }
                  // For > 15 questions, show grouped: first 3 ... middle window ... last 3
                  const show = new Set<number>();
                  // Always show first 2 and last 2
                  for (let i = 0; i < Math.min(2, total); i++) show.add(i);
                  for (let i = Math.max(0, total - 2); i < total; i++) show.add(i);
                  // Show window of 3 around current
                  for (let i = Math.max(0, currentIndex - 1); i <= Math.min(total - 1, currentIndex + 1); i++) show.add(i);
                  const sorted = Array.from(show).sort((a, b) => a - b);
                  const elements: React.ReactNode[] = [];
                  sorted.forEach((idx, i) => {
                    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
                      elements.push(<span key={`gap-${idx}`} className="text-xs text-muted-foreground px-0.5 self-center">...</span>);
                    }
                    elements.push(
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Question ${idx + 1}${answers[questions[idx].id] ? ' (answered)' : ''}`}
                        aria-current={idx === currentIndex ? 'step' : undefined}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-medium transition-all flex-shrink-0 ${
                          idx === currentIndex
                            ? 'bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30'
                            : answers[questions[idx].id]
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  });
                  return elements;
                })()}
              </div>
            </div>

            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Status */}
      {!allAnswered && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Please answer all questions before submitting ({questions.length - answeredCount} remaining)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
