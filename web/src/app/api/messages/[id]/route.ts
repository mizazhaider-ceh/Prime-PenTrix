import { getAuthUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMessageSchema = z.object({
  content: z.string().min(1).optional(),
  tokenCount: z.number().int().positive().optional(),
  contextUsed: z.array(z.string()).optional(),
});

// GET /api/messages/[id] - Get single message
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const message = await prisma.message.findFirst({
      where: {
        id,
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

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/[id] - Update message
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateMessageSchema.parse(body);

    const message = await prisma.message.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
