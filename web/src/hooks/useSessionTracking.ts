/**
 * Session Tracking Hook
 * 
 * Tracks user activity and study sessions automatically when user
 * interacts with the workspace.
 * 
 * Features:
 * - Auto-start session on workspace entry
 * - Detect user activity (mousemove, keypress, click)
 * - Pause on inactivity (2 minutes)
 * - Save session on exit/inactivity
 * - Calculate streak
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface SessionData {
  sessionId: string;
  startedAt: Date;
  duration: number; // seconds
  messageCount: number;
  mode: string;
  isActive: boolean;
}

interface UseSessionTrackingOptions {
  subjectId: string;
  mode: 'chat' | 'docs' | 'tools' | 'quiz';
  inactivityThreshold?: number; // milliseconds, default 2 minutes
  autoSave?: boolean;
}

export function useSessionTracking({ 
  subjectId, 
  mode,
  inactivityThreshold = 120000, // 2 minutes
  autoSave = true
}: UseSessionTrackingOptions) {
  const { userId } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTimeRef = useRef<number>(0); // Accumulated active time

  // Generate session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Calculate current session duration (only active time)
  const getSessionDuration = useCallback(() => {
    if (!isActive) return accumulatedTimeRef.current;
    const activeTime = Math.floor((Date.now() - lastActivityRef.current) / 1000);
    return accumulatedTimeRef.current + activeTime;
  }, [isActive]);

  // Save session to backend
  const saveSession = useCallback(async (endSession = false) => {
    if (!userId || !sessionIdRef.current) return;

    const duration = getSessionDuration();
    
    // Only save if duration > 10 seconds (avoid spam)
    if (duration < 10) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          subjectId,
          mode,
          duration,
          messageCount: session?.messageCount || 0,
          startedAt: new Date(startTimeRef.current).toISOString(),
          endedAt: endSession ? new Date().toISOString() : null
        })
      });

      if (endSession) {
        console.log(`[Session] Ended: ${duration}s`);
      }
    } catch (error) {
      console.error('[Session] Save failed:', error);
    }
  }, [userId, subjectId, mode, session?.messageCount, getSessionDuration]);

  // Handle activity detection
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // If was inactive, mark as active and accumulate time
    if (!isActive) {
      setIsActive(true);
      console.log('[Session] Resumed from inactivity');
    }

    // Reset inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Start new inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      // Accumulate time before marking inactive
      const activeTime = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      accumulatedTimeRef.current += activeTime;
      
      setIsActive(false);
      console.log('[Session] Paused due to inactivity');
      
      // Save session when going inactive
      if (autoSave) {
        saveSession(false);
      }
    }, inactivityThreshold);
  }, [isActive, inactivityThreshold, autoSave, saveSession]);

  // Start session
  useEffect(() => {
    if (!userId) return;

    // Generate session ID
    const newSessionId = generateSessionId();
    sessionIdRef.current = newSessionId;
    startTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    accumulatedTimeRef.current = 0;

    setSession({
      sessionId: newSessionId,
      startedAt: new Date(),
      duration: 0,
      messageCount: 0,
      mode,
      isActive: true
    });

    console.log(`[Session] Started: ${newSessionId}`);

    // Setup activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial activity
    handleActivity();

    // Auto-save every 30 seconds
    if (autoSave) {
      saveIntervalRef.current = setInterval(() => {
        saveSession(false);
      }, 30000);
    }

    // Cleanup on unmount
    return () => {
      // Clear timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }

      // Remove event listeners
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });

      // Final save
      saveSession(true);
    };
  }, [userId, subjectId, mode]); // Only re-run if these change

  // Increment message count (called from chat component)
  const incrementMessageCount = useCallback(() => {
    setSession(prev => prev ? { ...prev, messageCount: prev.messageCount + 1 } : null);
  }, []);

  // Update session duration (for display purposes)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSession(prev => prev ? { ...prev, duration: getSessionDuration() } : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, getSessionDuration]);

  return {
    session,
    isActive,
    incrementMessageCount,
    saveSession: () => saveSession(false),
    endSession: () => saveSession(true)
  };
}
