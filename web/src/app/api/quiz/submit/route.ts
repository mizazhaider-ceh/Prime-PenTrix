/**
 * Quiz Submission API
 * /api/quiz/submit
 * 
 * Handles quiz submission, AI-powered grading, and spaced repetition scheduling
 * using the SM-2 algorithm for optimal review timing.
 * 
 * Grading strategy:
 * - MCQ & True/False: instant deterministic matching
 * - Fill-blank & Short-answer: AI semantic grading with fallback to keyword matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const OPENAI_CHAT_API_KEY = process.env.OPENAI_CHAT_API_KEY;

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correct: string;
  explanation: string;
  userAnswer: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      subjectId,
      topic,
      difficulty,
      questions,
      timeSpent
    } = body;

    if (!subjectId || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Grade quiz (AI-powered for text answers)
    const results = await gradeQuiz(questions);

    // Save quiz score
    await prisma.quizScore.create({
      data: {
        userId: user.id,
        subjectId,
        topic: topic || 'General',
        difficulty,
        score: results.score,
        questionsCount: questions.length,
        correctCount: results.correctCount,
        timeSpent: timeSpent || 0
      }
    });

    // Process each question for spaced repetition
    await Promise.all(
      results.questions.map(q => 
        processQuestionForReview(user.id, subjectId, q)
      )
    );

    // Update global stats
    await prisma.globalStats.upsert({
      where: { userId: user.id },
      update: {
        totalQuizzes: { increment: 1 }
      },
      create: {
        userId: user.id,
        totalQuizzes: 1
      }
    });

    return NextResponse.json({
      success: true,
      results: {
        score: results.score,
        correctCount: results.correctCount,
        totalQuestions: questions.length,
        questions: results.questions
      }
    });

  } catch (error) {
    console.error('[API] Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}

/**
 * Grade quiz questions — uses AI for text-based answers
 */
async function gradeQuiz(questions: Question[]) {
  // Separate deterministic (MCQ, T/F) from text-based (fill-blank, short-answer)
  const deterministicTypes = ['mcq', 'true-false'];
  const textQuestions = questions.filter(q => !deterministicTypes.includes(q.type) && q.userAnswer);

  // Grade deterministic questions instantly
  const gradedQuestions = questions.map(q => {
    if (deterministicTypes.includes(q.type)) {
      return {
        ...q,
        isCorrect: checkDeterministicAnswer(q),
        gradedAt: new Date().toISOString()
      };
    }
    // Text questions will be graded below
    return { ...q, isCorrect: false, gradedAt: new Date().toISOString() };
  });

  // AI-grade text-based questions in a single batch call
  if (textQuestions.length > 0) {
    const aiGrades = await gradeTextAnswersWithAI(textQuestions);
    
    for (const grade of aiGrades) {
      const idx = gradedQuestions.findIndex(q => q.id === grade.id);
      if (idx !== -1) {
        gradedQuestions[idx].isCorrect = grade.isCorrect;
        // Enrich explanation with AI feedback when available
        if (grade.feedback) {
          gradedQuestions[idx].explanation = grade.feedback;
        }
      }
    }
  }

  const correctCount = gradedQuestions.filter(q => q.isCorrect).length;
  const score = (correctCount / questions.length) * 100;

  return {
    score: Math.round(score * 10) / 10,
    correctCount,
    questions: gradedQuestions
  };
}

/**
 * Deterministic grading for MCQ and True/False
 */
function checkDeterministicAnswer(question: Question): boolean {
  if (!question.userAnswer) return false;

  const userAnswer = question.userAnswer.trim().toLowerCase();
  const correctAnswer = question.correct.trim().toLowerCase();

  switch (question.type) {
    case 'mcq': {
      // Direct text match (e.g. both are full option text)
      if (userAnswer === correctAnswer) return true;

      // AI might return a letter index (A/B/C/D) while user selects full text, or vice versa
      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5 };
      const options = (question.options || []).map(o => o.trim().toLowerCase());

      // Case 1: correctAnswer is a single letter (A/B/C/D)
      if (correctAnswer.length === 1 && letterMap[correctAnswer] !== undefined) {
        const correctOption = options[letterMap[correctAnswer]];
        if (correctOption && userAnswer === correctOption) return true;
      }

      // Case 2: userAnswer is a single letter
      if (userAnswer.length === 1 && letterMap[userAnswer] !== undefined) {
        const userOption = options[letterMap[userAnswer]];
        if (userOption && userOption === correctAnswer) return true;
      }

      // Case 3: correctAnswer is prefixed with letter e.g. "A. DNS resolution"
      const letterPrefix = correctAnswer.match(/^([a-f])[.):\s]+(.+)$/);
      if (letterPrefix) {
        const bareCorrect = letterPrefix[2].trim();
        if (userAnswer === bareCorrect) return true;
        const idx = letterMap[letterPrefix[1]];
        if (idx !== undefined && options[idx] && userAnswer === options[idx]) return true;
      }

      // Case 4: check if correct answer matches one of the options by index
      const correctIdx = options.indexOf(correctAnswer);
      const userIdx = options.indexOf(userAnswer);
      if (correctIdx !== -1 && userIdx !== -1) return correctIdx === userIdx;

      // Case 5: Fuzzy containment for longer answers
      if (correctAnswer.length > 3 && userAnswer.includes(correctAnswer)) return true;
      if (userAnswer.length > 3 && correctAnswer.includes(userAnswer)) return true;

      return false;
    }

    case 'true-false': {
      const normalizedUser = ['true', 't', '1', 'yes'].includes(userAnswer) ? 'true' : 'false';
      const normalizedCorrect = ['true', 't', '1', 'yes'].includes(correctAnswer) ? 'true' : 'false';
      return normalizedUser === normalizedCorrect;
    }

    default:
      return false;
  }
}

/**
 * Fallback keyword-based grading when AI is unavailable
 */
function checkKeywordMatch(userAnswer: string, correctAnswer: string): boolean {
  const user = userAnswer.trim().toLowerCase();
  const correct = correctAnswer.trim().toLowerCase();

  // Exact match
  if (user === correct) return true;

  // Keyword overlap (70% threshold)
  const keyTerms = correct.split(/\s+/).filter(term => term.length > 2);
  if (keyTerms.length === 0) return user === correct;
  const matchCount = keyTerms.filter(term => user.includes(term)).length;
  return matchCount / keyTerms.length >= 0.7;
}

/**
 * AI-powered grading for fill-blank and short-answer questions
 * Sends a single batch prompt to grade all text answers at once
 */
async function gradeTextAnswersWithAI(
  questions: Question[]
): Promise<Array<{ id: string; isCorrect: boolean; feedback?: string }>> {
  const prompt = buildGradingPrompt(questions);

  try {
    const response = await callAIForGrading(prompt);
    if (response) {
      return parseGradingResponse(response, questions);
    }
  } catch (error) {
    console.warn('[Grading] AI grading failed, falling back to keyword matching:', error);
  }

  // Fallback: keyword-based grading
  return questions.map(q => ({
    id: q.id,
    isCorrect: checkKeywordMatch(q.userAnswer || '', q.correct),
  }));
}

/**
 * Build the grading prompt for AI
 */
function buildGradingPrompt(questions: Question[]): string {
  const qList = questions.map((q, i) => 
    `${i + 1}. Question: ${q.question}\n   Expected Answer: ${q.correct}\n   Student Answer: ${q.userAnswer || '(no answer)'}`
  ).join('\n\n');

  return `You are a strict academic grading assistant. Grade each student answer against the expected answer.

GRADING RULES (follow strictly):
- CORRECT: The student's answer is semantically equivalent to the expected answer, even if worded differently.
- CORRECT: Minor typos or spelling errors, but the concept is clearly right.
- INCORRECT: The answer is vague, partially correct but missing key concepts, or factually wrong.
- INCORRECT: The answer is blank, says "I don't know", or is completely unrelated.
- When in doubt, mark as INCORRECT — do NOT give benefit of the doubt.

${qList}

Respond ONLY with a JSON array (no markdown, no explanation outside the array):
[
  { "correct": true/false, "feedback": "1-sentence explanation" }
]`;
}

/**
 * Call AI provider for grading (reuses the same provider chain as generation)
 */
async function callAIForGrading(prompt: string): Promise<string | null> {
  // Try Cerebras
  if (CEREBRAS_API_KEY) {
    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.CEREBRAS_MODEL || 'llama-3.3-70b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Low temp for consistent grading
          max_tokens: 2048
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
      console.warn(`[Grading] Cerebras failed (${response.status})`);
    } catch (e) {
      console.warn('[Grading] Cerebras error:', e);
    }
  }

  // Try Gemini
  if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('your_key')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }
      console.warn(`[Grading] Gemini failed (${response.status})`);
    } catch (e) {
      console.warn('[Grading] Gemini error:', e);
    }
  }

  // Try OpenAI
  if (OPENAI_CHAT_API_KEY && !OPENAI_CHAT_API_KEY.includes('your_')) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_CHAT_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 2048
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
      console.warn(`[Grading] OpenAI failed (${response.status})`);
    } catch (e) {
      console.warn('[Grading] OpenAI error:', e);
    }
  }

  return null; // All providers failed → will fallback to keyword match
}

/**
 * Parse AI grading response
 */
function parseGradingResponse(
  content: string,
  questions: Question[]
): Array<{ id: string; isCorrect: boolean; feedback?: string }> {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const grades = JSON.parse(jsonString);

    if (!Array.isArray(grades)) throw new Error('Not an array');

    return grades.map((g: any, i: number) => ({
      id: questions[i]?.id || `unknown_${i}`,
      isCorrect: !!g.correct,
      feedback: g.feedback || undefined,
    }));
  } catch (error) {
    console.warn('[Grading] Failed to parse AI response, falling back:', error);
    // Fallback to keyword matching
    return questions.map(q => ({
      id: q.id,
      isCorrect: checkKeywordMatch(q.userAnswer || '', q.correct),
    }));
  }
}

/**
 * Process question for spaced repetition review
 * Implements SM-2 algorithm
 */
async function processQuestionForReview(
  userId: string,
  subjectId: string,
  question: any
) {
  try {
    // Check if question already exists in review system
    const existing = await prisma.quizReview.findFirst({
      where: {
        userId,
        subjectId,
        question: question.question
      }
    });

    if (existing) {
      // Update existing review with SM-2 algorithm
      const quality = question.isCorrect ? 4 : 2; // 4 = correct, 2 = incorrect
      const sm2Result = calculateSM2(
        existing.easeFactor,
        existing.interval,
        existing.reviewCount,
        quality
      );

      await prisma.quizReview.update({
        where: { id: existing.id },
        data: {
          userAnswer: question.userAnswer || '',
          correctAnswer: question.correct,
          isCorrect: question.isCorrect,
          reviewCount: existing.reviewCount + 1,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          nextReviewAt: sm2Result.nextReviewDate,
          lastReviewedAt: new Date()
        }
      });
    } else {
      // Create new review entry
      const quality = question.isCorrect ? 4 : 2;
      const sm2Result = calculateSM2(2.5, 1, 0, quality);

      await prisma.quizReview.create({
        data: {
          userId,
          subjectId,
          question: question.question,
          userAnswer: question.userAnswer || '',
          correctAnswer: question.correct,
          isCorrect: question.isCorrect,
          reviewCount: 1,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          nextReviewAt: sm2Result.nextReviewDate,
          lastReviewedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('[Review] Process error:', error);
    // Don't fail the entire request if review processing fails
  }
}

/**
 * SM-2 Spaced Repetition Algorithm
 * 
 * @param easeFactor - Current ease factor (default 2.5)
 * @param interval - Current interval in days (default 1)
 * @param reviewCount - Number of times reviewed
 * @param quality - Quality of recall (0-5):
 *                  5 = perfect response
 *                  4 = correct after hesitation
 *                  3 = correct with difficulty
 *                  2 = incorrect, but familiar
 *                  1 = incorrect, unfamiliar
 *                  0 = complete blackout
 */
function calculateSM2(
  easeFactor: number,
  interval: number,
  reviewCount: number,
  quality: number
): {
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
} {
  let newEaseFactor = easeFactor;
  let newInterval = interval;

  // If quality < 3, reset interval to 1
  if (quality < 3) {
    newInterval = 1;
  } else {
    // Calculate new ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // Ensure ease factor doesn't go below 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    // Calculate new interval
    if (reviewCount === 0) {
      newInterval = 1;
    } else if (reviewCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimals
    interval: newInterval,
    nextReviewDate
  };
}

/**
 * GET /api/quiz/submit - Get review questions
 * Returns questions that are due for review
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const where: any = {
      userId: user.id,
      nextReviewAt: {
        lte: new Date() // Due for review
      }
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Fetch questions due for review
    const reviewQuestions = await prisma.quizReview.findMany({
      where,
      include: {
        subject: {
          select: {
            name: true,
            code: true,
            color: true
          }
        }
      },
      orderBy: { nextReviewAt: 'asc' },
      take: limit
    });

    return NextResponse.json({
      questions: reviewQuestions,
      count: reviewQuestions.length
    });

  } catch (error) {
    console.error('[API] Review questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review questions' },
      { status: 500 }
    );
  }
}
