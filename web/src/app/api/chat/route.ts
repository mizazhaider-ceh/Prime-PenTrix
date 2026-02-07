import { getAuthUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AIManager } from '@/lib/ai/manager';
import { PromptBuilder } from '@/lib/prompts/builder';

const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:8000';

const chatRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1),
  contextDocuments: z.array(z.string()).optional(),
  useRag: z.boolean().optional().default(false), // Only true for "Chat with Documents"
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const validatedData = chatRequestSchema.parse(body);

    // Read user's AI preferences from request (or use defaults)
    const userPreferredProvider = req.headers.get('x-ai-provider') as 'cerebras' | 'gemini' | 'openai' | null;
    const userPreferredModel = req.headers.get('x-ai-model');

    // Fetch conversation with subject and messages
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validatedData.conversationId,
        userId: user.id,
      },
      include: {
        subject: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        role: 'user',
        content: validatedData.message,
        conversationId: validatedData.conversationId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // ── RAG: Fetch relevant document context (ONLY if useRag=true) ──
    let ragContextDocs: string[] = validatedData.contextDocuments || [];
    let ragChunkIds: string[] = [];

    // Only search documents when explicitly in "Chat with Documents" mode
    if (validatedData.useRag && ragContextDocs.length === 0) {
      try {
        const ragResponse = await fetch(`${BRAIN_API_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: validatedData.message,
            subject_id: conversation.subjectId,
            user_id: user.id,
            top_k: 5,
          }),
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          ragContextDocs = ragData.context_chunks || [];
          ragChunkIds = ragData.chunk_ids || [];
        }
      } catch (ragError) {
        // RAG is optional - continue without context on failure
        console.warn('RAG context retrieval failed (non-blocking):', ragError);
      }
    }

    // Build prompt context with RAG documents
    const promptContext = {
      subject: conversation.subject,
      mode: conversation.mode,
      conversationHistory: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      contextDocuments: ragContextDocs,
    };

    const messages = PromptBuilder.buildConversation(
      promptContext,
      validatedData.message
    );

    // Initialize AI manager with user preferences
    const preferredProvider = userPreferredProvider || (process.env.PREFERRED_AI_PROVIDER as 'cerebras' | 'gemini' | 'openai') || 'cerebras';
    
    // Helper: check if an API key is a real key (not a placeholder)
    const isValidKey = (key: string | undefined): key is string => {
      if (!key) return false;
      const lower = key.toLowerCase().trim();
      return !lower.includes('your') && !lower.includes('here') && !lower.includes('placeholder') && !lower.includes('xxx') && lower.length > 10;
    };

    const cerebrasKey = process.env.CEREBRAS_API_KEY;
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_CHAT_API_KEY;

    const aiManager = new AIManager({
      cerebras: isValidKey(cerebrasKey)
        ? {
            apiKey: cerebrasKey,
            model: (preferredProvider === 'cerebras' && userPreferredModel) ? userPreferredModel : (process.env.CEREBRAS_MODEL || 'llama3.1-8b'),
          }
        : undefined,
      gemini: isValidKey(geminiKey)
        ? {
            apiKey: geminiKey,
            model: (preferredProvider === 'gemini' && userPreferredModel) ? userPreferredModel : (process.env.GEMINI_MODEL || 'gemini-1.5-flash'),
          }
        : undefined,
      openai: isValidKey(openaiKey)
        ? {
            apiKey: openaiKey,
            model: (preferredProvider === 'openai' && userPreferredModel) ? userPreferredModel : (process.env.OPENAI_CHAT_MODEL || 'gpt-4o'),
          }
        : undefined,
      preferredProvider,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';
    let provider = '';
    let model = '';
    let assistantSaved = false; // Guard against duplicate saves

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send user message first so UI can display it immediately
          const userMessageData = JSON.stringify({
            type: 'userMessage',
            message: userMessage,
          });
          controller.enqueue(encoder.encode(`data: ${userMessageData}\n\n`));

          for await (const chunk of aiManager.stream(messages)) {
            if (chunk.content) {
              fullResponse += chunk.content;
              
              // Send SSE format
              const data = JSON.stringify({
                content: chunk.content,
                done: false,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (chunk.done && !assistantSaved) {
              assistantSaved = true; // Prevent double save
              provider = (chunk as any).provider || 'unknown';
              model = (chunk as any).model || 'unknown';
              
              // Save assistant message with RAG citation tracking
              const assistantMessage = await prisma.message.create({
                data: {
                  role: 'assistant',
                  content: fullResponse,
                  conversationId: validatedData.conversationId,
                  userId: user.id,
                  model: model,
                  tokenCount: fullResponse.split(/\s+/).length, // Rough estimate
                  contextUsed: ragChunkIds, // Track which document chunks were used
                },
              });

              // Update conversation timestamp
              await prisma.conversation.update({
                where: { id: validatedData.conversationId },
                data: { updatedAt: new Date() },
              });

              // Send final message with metadata
              const finalData = JSON.stringify({
                content: '',
                done: true,
                messageId: assistantMessage.id,
                provider,
                model,
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
              
              controller.close();
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          
          // Send error through stream
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : 'Streaming failed',
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: error.issues }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
