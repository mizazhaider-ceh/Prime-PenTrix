'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Sparkles, ArrowLeft, Zap } from 'lucide-react';
import QuizInterface from './QuizInterface';
import QuizResults from './QuizResults';
import ReviewDashboard from './ReviewDashboard';

interface QuizTabProps {
  subjectId: string;
  subjectName: string;
  topics: string[];
}

type QuizView = 'menu' | 'quiz' | 'results' | 'review';
type Difficulty = 'easy' | 'medium' | 'hard';
type QuestionType = 'mixed' | 'mcq' | 'true-false' | 'fill-blank' | 'short-answer';

export default function QuizTab({ subjectId, subjectName, topics }: QuizTabProps) {
  const [view, setView] = useState<QuizView>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [questionType, setQuestionType] = useState<QuestionType>('mixed');
  const [quizResults, setQuizResults] = useState<any>(null);

  const questionTypeMap: Record<QuestionType, string[]> = {
    mixed: ['mcq', 'true-false', 'fill-blank', 'short-answer'],
    mcq: ['mcq'],
    'true-false': ['true-false'],
    'fill-blank': ['fill-blank'],
    'short-answer': ['short-answer'],
  };

  const handleGenerateQuiz = () => {
    setView('quiz');
  };

  const handleQuizComplete = (results: any) => {
    setQuizResults(results);
    setView('results');
  };

  const handleRetake = () => {
    setQuizResults(null);
    setView('quiz');
  };

  const handleBackToMenu = () => {
    setQuizResults(null);
    setView('menu');
  };

  // Quiz taking view
  if (view === 'quiz') {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz Menu
          </Button>
        </div>
        <QuizInterface
          subjectId={subjectId}
          subjectName={subjectName}
          topic={selectedTopic === 'all' ? undefined : selectedTopic}
          difficulty={difficulty}
          questionCount={questionCount}
          questionTypes={questionTypeMap[questionType]}
          onComplete={handleQuizComplete}
        />
      </div>
    );
  }

  // Results view
  if (view === 'results' && quizResults) {
    return (
      <div className="h-full overflow-auto p-6">
        <QuizResults
          results={quizResults}
          subjectName={subjectName}
          topic={selectedTopic === 'all' ? undefined : selectedTopic}
          difficulty={difficulty}
          onRetake={handleRetake}
          onExit={handleBackToMenu}
        />
      </div>
    );
  }

  // Review dashboard view
  if (view === 'review') {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToMenu} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Quiz Menu
          </Button>
        </div>
        <ReviewDashboard subjectId={subjectId} />
      </div>
    );
  }

  // Main menu
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Practice Quiz Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-5 w-5 text-primary" />
              Practice Quiz
            </CardTitle>
            <CardDescription>
              Generate AI-powered quizzes on {subjectName} topics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Config Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Difficulty</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Questions</label>
                <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                    <SelectItem value="25">25 Questions</SelectItem>
                    <SelectItem value="30">30 Questions</SelectItem>
                    <SelectItem value="40">40 Questions</SelectItem>
                    <SelectItem value="50">50 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Focus Topic (optional)</label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Types */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Question Types</label>
                <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed (All types)</SelectItem>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True / False</SelectItem>
                    <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              size="lg"
              className="w-full gap-2 text-base font-semibold"
              onClick={handleGenerateQuiz}
            >
              <Sparkles className="h-5 w-5" />
              Generate Quiz
            </Button>
          </CardContent>
        </Card>

        {/* Spaced Repetition Card */}
        <Card className="border-border/30 hover:border-primary/20 transition-colors cursor-pointer" onClick={() => setView('review')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Brain className="h-5 w-5 text-primary" />
                  Spaced Repetition Review
                </CardTitle>
                <CardDescription>
                  Review questions based on your performance using SM-2 algorithm
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                SM-2
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              After completing quizzes, questions you struggled with will appear here for spaced review. Click to open the review dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
