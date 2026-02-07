'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy, 
  Target,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionResult {
  id: string;
  type: 'mcq' | 'true-false' | 'fill-blank' | 'short-answer';
  question: string;
  options?: string[];
  correct: string;
  userAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface QuizResultsProps {
  results: {
    score: number;
    correctCount: number;
    totalQuestions: number;
    questions: QuestionResult[];
    timeSpent?: number;
  };
  subjectName: string;
  topic?: string;
  difficulty?: string;
  onRetake?: () => void;
  onExit?: () => void;
}

export default function QuizResults({
  results,
  subjectName,
  topic,
  difficulty,
  onRetake,
  onExit
}: QuizResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const { score, correctCount, totalQuestions, questions, timeSpent } = results;
  const percentage = Math.round(score);
  const incorrectCount = totalQuestions - correctCount;

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getGrade = () => {
    if (percentage >= 90) return { letter: 'A+', color: 'text-green-600 dark:text-green-400', message: 'Outstanding!' };
    if (percentage >= 80) return { letter: 'A', color: 'text-green-600 dark:text-green-400', message: 'Excellent!' };
    if (percentage >= 70) return { letter: 'B', color: 'text-blue-600 dark:text-blue-400', message: 'Good job!' };
    if (percentage >= 60) return { letter: 'C', color: 'text-yellow-600 dark:text-yellow-400', message: 'Keep practicing!' };
    if (percentage >= 50) return { letter: 'D', color: 'text-orange-600 dark:text-orange-400', message: 'Needs improvement' };
    return { letter: 'F', color: 'text-red-600 dark:text-red-400', message: 'Keep studying!' };
  };

  const grade = getGrade();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Score Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-16 h-16 text-primary" />
              {percentage >= 80 && (
                <Award className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
              )}
            </div>
          </div>
          <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          <CardDescription className="text-base">
            {subjectName} {topic && `• ${topic}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grade Display */}
          <div className="text-center py-4 sm:py-6 bg-secondary/30 rounded-lg">
            <div className={cn("text-5xl sm:text-7xl font-bold mb-2", grade.color)}>
              {grade.letter}
            </div>
            <div className="text-2xl sm:text-3xl font-semibold mb-2">
              {percentage}%
            </div>
            <p className="text-base sm:text-lg text-muted-foreground">{grade.message}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-500/10 p-3 sm:p-4 rounded-lg text-center border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{correctCount}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>

            <div className="bg-red-500/10 p-3 sm:p-4 rounded-lg text-center border border-red-500/20">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{incorrectCount}</div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>

            <div className="bg-blue-500/10 p-3 sm:p-4 rounded-lg text-center border border-blue-500/20">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{totalQuestions}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>

            <div className="bg-purple-500/10 p-3 sm:p-4 rounded-lg text-center border border-purple-500/20">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1 sm:mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {timeSpent ? formatTime(timeSpent) : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="font-medium">Overall Score</span>
              <span className="text-muted-foreground">{correctCount}/{totalQuestions}</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onRetake && (
              <Button onClick={onRetake} className="flex-1" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            )}
            {onExit && (
              <Button onClick={onExit} variant="outline" className="flex-1" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Back to Workspace
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>
            Review your answers and explanations for each question
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((question, index) => (
            <Card 
              key={question.id}
              className={cn(
                "border-2 transition-colors",
                question.isCorrect 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-red-500/30 bg-red-500/5"
              )}
            >
              <CardHeader className="pb-3">
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleQuestion(question.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleQuestion(question.id); } }}
                  aria-expanded={expandedQuestions.has(question.id)}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      question.isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                    )}>
                      {question.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Question {index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {question.type.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="font-medium leading-relaxed">{question.question}</p>
                    </div>
                  </div>
                  {expandedQuestions.has(question.id) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </CardHeader>

              {expandedQuestions.has(question.id) && (
                <CardContent className="pt-0 space-y-4">
                  {/* Options (for MCQ/True-False) */}
                  {question.options && question.type === 'mcq' && (
                    <div className="space-y-2">
                      {question.options.map((option, idx) => {
                        const isUserAnswer = option === question.userAnswer;
                        const isCorrectAnswer = option === question.correct;
                        
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "p-3 rounded-lg border-2",
                              isCorrectAnswer && "border-green-500 bg-green-500/10",
                              isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-500/10",
                              !isUserAnswer && !isCorrectAnswer && "border-secondary"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {isCorrectAnswer && (
                                <Badge variant="default" className="bg-green-600">Correct</Badge>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <Badge variant="destructive">Your Answer</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answers (for other types) */}
                  {(!question.options || question.type !== 'mcq') && (
                    <div className="space-y-2">
                      <div className={cn(
                        "p-3 rounded-lg border-2",
                        question.isCorrect
                          ? "border-green-500 bg-green-500/10"
                          : "border-red-500 bg-red-500/10"
                      )}>
                        <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                        <p className="font-medium">{question.userAnswer || '(No answer provided)'}</p>
                      </div>
                      {!question.isCorrect && (
                        <div className="p-3 rounded-lg border-2 border-green-500 bg-green-500/10">
                          <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                          <p className="font-medium">{question.correct}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                        Explanation:
                      </p>
                      <p className="text-sm leading-relaxed">{question.explanation}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
