import { getAuthUser } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AIManager } from '@/lib/ai/manager';
import { PromptBuilder } from '@/lib/prompts/builder';

const chatRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1),
  contextDocuments: z.array(z.string()).optional(),
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

    // Build prompt context
    const promptContext = {
      subject: conversation.subject,
      mode: conversation.mode,
      conversationHistory: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      contextDocuments: validatedData.contextDocuments,
    };

    const messages = PromptBuilder.buildConversation(
      promptContext,
      validatedData.message
    );

    // Initialize AI manager
    const aiManager = new AIManager({
      cerebras: process.env.CEREBRAS_API_KEY
        ? {
            apiKey: process.env.CEREBRAS_API_KEY,
            model: process.env.CEREBRAS_MODEL || 'llama3.1-8b',
          }
        : undefined,
      gemini: process.env.GOOGLE_GEMINI_API_KEY
        ? {
            apiKey: process.env.GOOGLE_GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          }
        : undefined,
      preferredProvider: (process.env.PREFERRED_AI_PROVIDER as 'cerebras' | 'gemini') || 'cerebras',
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';
    let provider = '';
    let model = '';

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

            if (chunk.done) {
              provider = (chunk as any).provider || 'unknown';
              model = (chunk as any).model || 'unknown';
              
              // Save assistant message
              const assistantMessage = await prisma.message.create({
                data: {
                  role: 'assistant',
                  content: fullResponse,
                  conversationId: validatedData.conversationId,
                  userId: user.id,
                  model: model,
                  tokenCount: fullResponse.split(/\s+/).length, // Rough estimate
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
