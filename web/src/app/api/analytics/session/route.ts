/**
 * Session Analytics API
 * /api/analytics/session
 * 
 * Handles study session creation and updates:
 * - POST: Create or update session
 * - GET: Retrieve user sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// POST /api/analytics/session - Create or update session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, subjectId, mode, duration, messageCount, startedAt, endedAt } = body;

    // Validate required fields
    if (!sessionId || !subjectId || !mode || duration === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if session already exists
    const existingSession = await prisma.studySession.findFirst({
      where: {
        userId: user.id,
        startedAt: new Date(startedAt)
      }
    });

    let session;

    if (existingSession) {
      // Update existing session
      session = await prisma.studySession.update({
        where: { id: existingSession.id },
        data: {
          duration,
          messageCount: messageCount || 0,
          endedAt: endedAt ? new Date(endedAt) : null
        }
      });
    } else {
      // Create new session
      session = await prisma.studySession.create({
        data: {
          userId: user.id,
          subjectId,
          mode,
          duration,
          messageCount: messageCount || 0,
          startedAt: new Date(startedAt),
          endedAt: endedAt ? new Date(endedAt) : null
        }
      });
    }

    // Update global stats
    await updateGlobalStats(user.id, duration, endedAt !== null);

    // Update user last active time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      session: {
        id: session.id,
        duration: session.duration,
        endedAt: session.endedAt
      }
    });

  } catch (error) {
    console.error('[API] Session save error:', error);
    return NextResponse.json(
      { error: 'Failed to save session' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/session - Get user sessions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const days = parseInt(searchParams.get('days') || '30');

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const where: any = {
      userId: user.id,
      startedAt: { gte: startDate }
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Fetch sessions
    const sessions = await prisma.studySession.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: limit
    });

    // Calculate total time
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

    return NextResponse.json({
      sessions,
      totalTime,
      count: sessions.length
    });

  } catch (error) {
    console.error('[API] Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * Update global statistics including streak calculation
 */
async function updateGlobalStats(userId: string, durationIncrement: number, sessionEnded: boolean) {
  try {
    // Get or create global stats
    let stats = await prisma.globalStats.findUnique({
      where: { userId }
    });

    if (!stats) {
      stats = await prisma.globalStats.create({
        data: {
          userId,
          totalStudyTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null
        }
      });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const lastStudyDay = stats.lastStudyDate 
      ? stats.lastStudyDate.toISOString().split('T')[0] 
      : null;

    let newStreak = stats.currentStreak;

    // Calculate streak
    if (lastStudyDay === null) {
      // First study day
      newStreak = 1;
    } else if (lastStudyDay === today) {
      // Same day, no streak change
      newStreak = stats.currentStreak;
    } else {
      // Different day - check if consecutive
      const lastDate = new Date(lastStudyDay);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = stats.currentStreak + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }
    }

    // Update stats
    await prisma.globalStats.update({
      where: { userId },
      data: {
        totalStudyTime: stats.totalStudyTime + durationIncrement,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        lastStudyDate: now,
        updatedAt: now
      }
    });

  } catch (error) {
    console.error('[Stats] Update failed:', error);
  }
}
