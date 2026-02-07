'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Wrench, 
  Brain,
  BarChart3,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Chat',
    description: 'Chat with subject-specific AI tutors for personalized learning',
    color: 'text-blue-500'
  },
  {
    icon: FileText,
    title: 'RAG Document Search',
    description: 'Upload documents and get AI-powered answers from your materials',
    color: 'text-green-500'
  },
  {
    icon: Wrench,
    title: '24 Specialized Tools',
    description: 'Subject-specific utilities for networking, security, and more',
    color: 'text-purple-500'
  },
  {
    icon: Brain,
    title: 'Smart Quizzes',
    description: 'AI-generated quizzes with spaced repetition learning',
    color: 'text-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track your study progress with detailed statistics',
    color: 'text-orange-500'
  }
];

const steps = [
  {
    title: 'Choose a Subject',
    description: 'Select from 8 specialized subjects tailored to your learning needs',
    tip: 'Each subject has unique AI tutors and tools'
  },
  {
    title: 'Start Learning',
    description: 'Chat with AI, upload documents, or use interactive tools',
    tip: 'All your conversations and materials are saved automatically'
  },
  {
    title: 'Test Your Knowledge',
    description: 'Take AI-generated quizzes and track your progress',
    tip: 'Our spaced repetition system helps you retain what you learn'
  },
  {
    title: 'Review & Improve',
    description: 'Use analytics to identify strengths and areas for improvement',
    tip: 'Study streaks and detailed stats keep you motivated'
  }
];

export default function OnboardingModal({ isOpen = false, onClose }: OnboardingModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const seen = localStorage.getItem('sentinel-onboarding-seen');
    if (!seen && !isOpen) {
      setOpen(true);
    }
    setHasSeenOnboarding(!!seen);
  }, []);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    localStorage.setItem('sentinel-onboarding-seen', 'true');
    setHasSeenOnboarding(true);
    setOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {currentStep === 0 ? (
          // Welcome Screen
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Welcome to Sentinel V3!</DialogTitle>
                  <DialogDescription>
                    Your AI-powered learning companion
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <p className="text-base leading-relaxed">
                Sentinel V3 is a comprehensive learning platform that combines AI tutors, 
                document processing, specialized tools, and intelligent study tracking to 
                accelerate your learning journey.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-lg border bg-secondary/20 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${feature.color}`} />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={handleSkip}>
                  Skip Tour
                </Button>
                <Button onClick={handleNext}>
                  Get Started
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Step Screens
          <>
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">
                  Step {currentStep} of {steps.length - 1}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip Tour
                </Button>
              </div>
              <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
              <DialogDescription>{steps[currentStep].description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Visual Representation */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="text-center space-y-3">
                  {currentStep === 1 && (
                    <div className="space-y-3">
                      <MessageSquare className="w-16 h-16 mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground max-w-md">
                        Navigate between Chat, Documents, Tools, and Quiz tabs to access different features
                      </p>
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div className="space-y-3">
                      <Brain className="w-16 h-16 mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground max-w-md">
                        Take quizzes in any subject to test your knowledge and build your review queue
                      </p>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div className="space-y-3">
                      <BarChart3 className="w-16 h-16 mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground max-w-md">
                        Visit the Analytics dashboard to see your study patterns and progress
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tip Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Pro Tip
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {steps[currentStep].tip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStep 
                        ? 'bg-primary w-8' 
                        : idx < currentStep
                        ? 'bg-green-500'
                        : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button onClick={handleNext}>
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
