/**
 * Quiz Generation API
 * /api/quiz/generate
 * 
 * Generates quiz questions using AI based on:
 * - Subject
 * - Topic (optional)
 * - Difficulty
 * - Question types
 * - Document context (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const OPENAI_CHAT_API_KEY = process.env.OPENAI_CHAT_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      subjectId, 
      topic, 
      difficulty = 'medium',
      questionTypes = ['mcq', 'true-false'],
      questionCount = 5,
      useDocuments = false
    } = body;

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Optionally fetch document context
    let documentContext = '';
    if (useDocuments) {
      const recentDocs = await prisma.document.findMany({
        where: {
          userId: user.id,
          subjectId,
          status: 'completed'
        },
        include: {
          chunks: {
            take: 5,
            select: {
              content: true
            }
          }
        },
        take: 3,
        orderBy: { uploadedAt: 'desc' }
      });

      documentContext = recentDocs
        .flatMap(doc => doc.chunks.map(c => c.content))
        .join('\n\n')
        .slice(0, 3000); // Limit context size
    }

    // Generate questions using AI
    const clampedCount = Math.min(questionCount, 50);
    const questions = await generateQuestions({
      subject: subject.name,
      subjectCode: subject.code,
      topic,
      difficulty,
      questionTypes,
      questionCount: clampedCount,
      documentContext
    });

    return NextResponse.json({
      success: true,
      questions,
      metadata: {
        subject: subject.name,
        subjectCode: subject.code,
        topic,
        difficulty,
        questionCount: questions.length
      }
    });

  } catch (error) {
    console.error('[API] Quiz generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate quiz';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Generate quiz questions using AI
 */
async function generateQuestions({
  subject,
  subjectCode,
  topic,
  difficulty,
  questionTypes,
  questionCount,
  documentContext
}: {
  subject: string;
  subjectCode: string;
  topic?: string;
  difficulty: string;
  questionTypes: string[];
  questionCount: number;
  documentContext?: string;
}) {
  const prompt = buildQuizPrompt({
    subject,
    subjectCode,
    topic,
    difficulty,
    questionTypes,
    questionCount,
    documentContext
  });

  try {
    // Try Cerebras first (faster)
    if (CEREBRAS_API_KEY) {
      // Scale tokens: ~150 tokens per question
      const maxTokens = Math.min(Math.max(questionCount * 200, 2000), 8192);
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.CEREBRAS_MODEL || 'llama-3.3-70b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: maxTokens
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        return parseQuestions(content);
      } else {
        const errText = await response.text().catch(() => 'unknown');
        console.warn(`[Quiz] Cerebras failed (${response.status}): ${errText.slice(0, 200)}`);
      }
    }

    // Fallback to Gemini
    if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('your_key')) {
      const maxTokens = Math.min(Math.max(questionCount * 200, 2000), 8192);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: maxTokens
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;
        return parseQuestions(content);
      } else {
        const errText = await response.text().catch(() => 'unknown');
        console.warn(`[Quiz] Gemini failed (${response.status}): ${errText.slice(0, 200)}`);
      }
    }

    // Fallback to OpenAI
    if (OPENAI_CHAT_API_KEY && !OPENAI_CHAT_API_KEY.includes('your_')) {
      const maxTokens = Math.min(Math.max(questionCount * 200, 2000), 8192);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_CHAT_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: maxTokens
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        return parseQuestions(content);
      } else {
        const errText = await response.text().catch(() => 'unknown');
        console.warn(`[Quiz] OpenAI failed (${response.status}): ${errText.slice(0, 200)}`);
      }
    }

    // List which providers were attempted
    const tried = [
      CEREBRAS_API_KEY ? 'Cerebras' : null,
      (GEMINI_API_KEY && !GEMINI_API_KEY.includes('your_key')) ? 'Gemini' : null,
      (OPENAI_CHAT_API_KEY && !OPENAI_CHAT_API_KEY.includes('your_')) ? 'OpenAI' : null,
    ].filter(Boolean);
    throw new Error(`All AI providers failed. Tried: ${tried.length > 0 ? tried.join(', ') : 'none configured'}`);
  } catch (error) {
    console.error('[Quiz] AI generation failed:', error);
    throw error;
  }
}

/**
 * Build quiz generation prompt
 */
function buildQuizPrompt({
  subject,
  subjectCode,
  topic,
  difficulty,
  questionTypes,
  questionCount,
  documentContext
}: any) {
  let prompt = `Generate ${questionCount} ${difficulty} difficulty quiz questions for ${subject} (${subjectCode}).`;
  
  if (topic) {
    prompt += `\n\nTopic: ${topic}`;
  }

  if (documentContext) {
    prompt += `\n\nUse this content as reference:\n${documentContext}`;
  }

  prompt += `\n\nQuestion types to generate: ${questionTypes.join(', ')}`;

  prompt += `\n\nFormat your response as valid JSON array with this structure:
[
  {
    "type": "mcq" | "true-false" | "fill-blank" | "short-answer",
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"], // For MCQ only
    "correct": "The correct answer (option letter for MCQ, true/false for T/F, or text answer)",
    "explanation": "Brief explanation of the correct answer"
  }
]

Guidelines:
- Make questions challenging but fair for ${difficulty} level
- Test understanding, not just memorization
- Provide clear, unambiguous questions
- For MCQ, make distractors plausible
- For T/F, avoid obvious answers
- For fill-blank, use clear context clues
- Explanations should reinforce learning

Return ONLY the JSON array, no additional text.`;

  return prompt;
}

/**
 * Parse AI response into structured questions
 */
function parseQuestions(content: string) {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;

    // Parse JSON
    const questions = JSON.parse(jsonString);

    // Validate structure
    if (!Array.isArray(questions)) {
      throw new Error('Response is not an array');
    }

    // Add IDs and validate
    return questions.map((q: any, index: number) => ({
      id: `q_${Date.now()}_${index}`,
      type: q.type || 'mcq',
      question: q.question || '',
      options: q.options || [],
      correct: q.correct || '',
      explanation: q.explanation || '',
      userAnswer: null // Will be filled when user submits
    }));

  } catch (error) {
    console.error('[Quiz] Parse error:', error);
    
    // Return fallback questions
    return [{
      id: 'fallback_1',
      type: 'mcq',
      question: 'What is the primary focus of this subject?',
      options: ['Concepts', 'Applications', 'Theory', 'Practice'],
      correct: 'A',
      explanation: 'This is a fallback question due to parsing error.',
      userAnswer: null
    }];
  }
}
