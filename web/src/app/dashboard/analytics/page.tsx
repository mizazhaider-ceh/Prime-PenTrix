/**
 * Analytics Dashboard Component
 * 
 * Displays comprehensive learning analytics:
 * - Study streak and overview stats
 * - Activity calendar (GitHub-style contributions)
 * - Subject breakdown pie chart
 * - Time trend line chart
 * - Top tools usage
 * - Recent sessions
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  TrendingUp, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Wrench,
  Flame,
  Calendar,
  Award
} from 'lucide-react';

interface DashboardData {
  globalStats: {
    totalStudyTime: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null;
  };
  periodStats: {
    days: number;
    totalTime: number;
    totalSessions: number;
    totalMessages: number;
    totalDocuments: number;
    totalToolUses: number;
    avgSessionTime: number;
  };
  subjectBreakdown: Array<{
    name: string;
    code: string;
    color: string;
    icon: string;
    time: number;
    sessions: number;
  }>;
  activityCalendar: Array<{
    date: string;
    time: number;
    sessions: number;
  }>;
  topTools: Array<{
    toolId: string;
    category: string;
    count: number;
  }>;
  recentSessions: Array<{
    id: string;
    subject: string;
    subjectCode: string;
    subjectColor: string;
    mode: string;
    duration: number;
    messageCount: number;
    startedAt: string;
    endedAt: string | null;
  }>;
}


export default function AnalyticsDashboard() {
  const { userId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!userId) return;

    async function fetchDashboardData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/dashboard?days=${days}`);
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [userId, days]);

  // Format time duration
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format total time in comprehensive format
  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 100) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Learning Analytics</h1>
          <p className="text-muted-foreground">
            Track your progress and study patterns
          </p>
        </div>

        {/* Time period selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === d 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Study Streak */}
        <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Flame className="h-8 w-8 text-orange-500" />
              <Badge variant="outline" className="border-orange-500/50">Streak</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.globalStats.currentStreak}</div>
            <p className="text-sm text-muted-foreground mt-1">
              days in a row
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Longest: {data.globalStats.longestStreak} days
            </p>
          </CardContent>
        </Card>

        {/* Total Study Time */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Clock className="h-6 w-6 text-blue-500" />
              <Badge variant="outline">All Time</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatTotalTime(data.globalStats.totalStudyTime)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">total study time</p>
            <p className="text-xs text-muted-foreground mt-2">
              Last {days} days: {formatTotalTime(data.periodStats.totalTime)}
            </p>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <BookOpen className="h-6 w-6 text-green-500" />
              <Badge variant="outline">Sessions</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.periodStats.totalSessions}</div>
            <p className="text-sm text-muted-foreground mt-1">study sessions</p>
            <p className="text-xs text-muted-foreground mt-2">
              Avg: {formatTime(data.periodStats.avgSessionTime)}
            </p>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-6 w-6 text-purple-500" />
              <Badge variant="outline">Activity</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.periodStats.totalMessages}</div>
            <p className="text-sm text-muted-foreground mt-1">messages sent</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{data.periodStats.totalDocuments} docs</span>
              <span>·</span>
              <span>{data.periodStats.totalToolUses} tools</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Calendar
          </CardTitle>
          <CardDescription>
            Your study activity over the last 90 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityCalendar data={data.activityCalendar} />
        </CardContent>
      </Card>

      {/* Subject Breakdown & Top Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Breakdown</CardTitle>
            <CardDescription>Time spent per subject (last {days} days)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.subjectBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.subjectBreakdown.map((subject) => (
                  <div key={subject.code} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-medium">{subject.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {subject.sessions} sessions
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">{formatTime(subject.time)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${(subject.time / data.periodStats.totalTime) * 100}%`,
                          backgroundColor: subject.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No study data for this period
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Most Used Tools
            </CardTitle>
            <CardDescription>Your favorite tools (last {days} days)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topTools.length > 0 ? (
              <div className="space-y-3">
                {data.topTools.map((tool, index) => (
                  <div key={tool.toolId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {tool.toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{tool.category}</p>
                      </div>
                    </div>
                    <Badge>{tool.count} uses</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tool usage data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest study sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentSessions.length > 0 ? (
            <div className="space-y-3">
              {data.recentSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: session.subjectColor }}
                    >
                      {session.subjectCode.split('-')[0]}
                    </div>
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{session.mode}</span>
                        <span>·</span>
                        <span>{session.messageCount} messages</span>
                        <span>·</span>
                        <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{formatTime(session.duration)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No sessions recorded yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Activity Calendar Component (GitHub-style)
 */
function ActivityCalendar({ data }: { data: Array<{ date: string; time: number; sessions: number }> }) {
  // Generate last 90 days
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = data.find(d => d.date === dateStr);
    days.push({
      date: dateStr,
      time: dayData?.time || 0,
      sessions: dayData?.sessions || 0,
      dayOfWeek: date.getDay()
    });
  }

  // Get intensity level (0-4)
  const getIntensity = (time: number) => {
    if (time === 0) return 0;
    if (time < 600) return 1; // < 10 minutes
    if (time < 1800) return 2; // < 30 minutes
    if (time < 3600) return 3; // < 1 hour
    return 4; // >= 1 hour
  };

  // Group by weeks
  type DayData = { date: string; time: number; sessions: number; dayOfWeek: number };
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  
  days.forEach((day) => {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day) => {
              const intensity = getIntensity(day.time);
              return (
                <div
                  key={day.date}
                  className="w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-pointer"
                  style={{
                    backgroundColor: intensity === 0 
                      ? 'hsl(var(--secondary))' 
                      : `hsl(var(--primary) / ${0.2 + (intensity * 0.2)})`
                  }}
                  title={`${day.date}: ${formatTime(day.time)} (${day.sessions} sessions)`}
                />
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: level === 0 
                ? 'hsl(var(--secondary))' 
                : `hsl(var(--primary) / ${0.2 + (level * 0.2)})`
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
