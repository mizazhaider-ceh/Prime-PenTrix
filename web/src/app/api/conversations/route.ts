import { getAuthUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a conversation
const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
  subjectId: z.string().uuid(),
  mode: z.enum(['chat', 'doc-chat', 'learn', 'questions', 'explain', 'summarize', 'quiz']).default('chat'),
});

// GET /api/conversations - Fetch user's conversations
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filter params
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const mode = searchParams.get('mode');
    const search = searchParams.get('search');
    const timeFilter = searchParams.get('timeFilter'); // today, week, month

    // Build where clause
    const where: any = { userId: user.id };
    
    if (subjectId) where.subjectId = subjectId;
    if (mode) where.mode = mode;
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          messages: {
            some: {
              content: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Apply time filter
    if (timeFilter) {
      const now = new Date();
      let startDate = new Date();

      if (timeFilter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }

      where.createdAt = {
        gte: startDate,
      };
    }

    // Fetch conversations with subject info
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await req.json();
    const validatedData = createConversationSchema.parse(body);

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: validatedData.subjectId },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        title: validatedData.title,
        mode: validatedData.mode,
        userId: user.id,
        subjectId: validatedData.subjectId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
