/**
 * Analytics Dashboard API
 * /api/analytics/dashboard
 * 
 * Provides comprehensive analytics data for dashboard visualization:
 * - Overall stats (total time, streak, counts)
 * - Time distribution by subject
 * - Activity calendar data
 * - Recent sessions
 * - Tool usage patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId'); // Optional: filter by subject
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch global stats
    const globalStats = await prisma.globalStats.findUnique({
      where: { userId: user.id }
    });

    // Build where clause for filtered queries
    const whereClause: any = {
      userId: user.id,
      startedAt: { gte: startDate }
    };
    if (subjectId) {
      whereClause.subjectId = subjectId;
    }

    // Fetch sessions for time period
    const sessions = await prisma.studySession.findMany({
      where: whereClause,
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
      orderBy: { startedAt: 'desc' }
    });

    // Calculate time by subject
    const timeBySubject = sessions.reduce((acc: any, session) => {
      const subjectName = session.subject.name;
      if (!acc[subjectName]) {
        acc[subjectName] = {
          name: subjectName,
          code: session.subject.code,
          color: session.subject.color,
          icon: session.subject.icon,
          time: 0,
          sessions: 0
        };
      }
      acc[subjectName].time += session.duration;
      acc[subjectName].sessions += 1;
      return acc;
    }, {});

    // Convert to array and sort by time
    const subjectBreakdown = Object.values(timeBySubject).sort((a: any, b: any) => b.time - a.time);

    // Calculate activity calendar (last 90 days)
    const calendarStartDate = new Date();
    calendarStartDate.setDate(calendarStartDate.getDate() - 90);

    const calendarSessions = await prisma.studySession.findMany({
      where: {
        userId: user.id,
        startedAt: { gte: calendarStartDate }
      },
      select: {
        startedAt: true,
        duration: true
      }
    });

    // Group by day
    const activityByDay = calendarSessions.reduce((acc: any, session) => {
      const day = session.startedAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { date: day, time: 0, sessions: 0 };
      }
      acc[day].time += session.duration;
      acc[day].sessions += 1;
      return acc;
    }, {});

    const activityCalendar = Object.values(activityByDay);

    // Fetch tool usage
    const toolUsage = await prisma.toolHistory.findMany({
      where: {
        userId: user.id,
        usedAt: { gte: startDate },
        ...(subjectId && { subjectId })
      },
      select: {
        toolId: true,
        toolCategory: true
      }
    });

    // Count tool usage
    const toolCounts = toolUsage.reduce((acc: any, tool) => {
      if (!acc[tool.toolId]) {
        acc[tool.toolId] = {
          toolId: tool.toolId,
          category: tool.toolCategory,
          count: 0
        };
      }
      acc[tool.toolId].count += 1;
      return acc;
    }, {});

    const topTools = Object.values(toolCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Count messages
    const messageCount = await prisma.message.count({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
        ...(subjectId && {
          conversation: { subjectId }
        })
      }
    });

    // Count documents
    const documentCount = await prisma.document.count({
      where: {
        userId: user.id,
        uploadedAt: { gte: startDate },
        ...(subjectId && { subjectId })
      }
    });

    // Calculate total time for period
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Build response
    const dashboardData = {
      // Global stats
      globalStats: {
        totalStudyTime: globalStats?.totalStudyTime || 0,
        currentStreak: globalStats?.currentStreak || 0,
        longestStreak: globalStats?.longestStreak || 0,
        lastStudyDate: globalStats?.lastStudyDate || null
      },

      // Period stats
      periodStats: {
        days,
        totalTime,
        totalSessions: sessions.length,
        totalMessages: messageCount,
        totalDocuments: documentCount,
        totalToolUses: toolUsage.length,
        avgSessionTime: sessions.length > 0 ? Math.floor(totalTime / sessions.length) : 0
      },

      // Subject breakdown
      subjectBreakdown,

      // Activity calendar
      activityCalendar,

      // Top tools
      topTools,

      // Recent sessions (last 10)
      recentSessions: sessions.slice(0, 10).map(s => ({
        id: s.id,
        subject: s.subject.name,
        subjectCode: s.subject.code,
        subjectColor: s.subject.color,
        mode: s.mode,
        duration: s.duration,
        messageCount: s.messageCount,
        startedAt: s.startedAt,
        endedAt: s.endedAt
      }))
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('[API] Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
