"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from './AnalyticsContext';

export type SessionType = 'problem-solver' | 'daily-riddle' | 'daily-scenario' | 'problem-solver-voice';

interface Session {
  id: string;
  type: SessionType;
  startTime: number;
}

interface SessionContextType {
  session: Session | null;
  startSession: (type: SessionType, metadata?: Record<string, any>) => Promise<void>;
  endSession: () => void;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const startSession = async (type: SessionType, metadata: Record<string, any> = {}) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_type: type,
          user_id: 'anonymous', // Placeholder for future authentication
          ...metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const newSession = await response.json();
      const startTime = Date.now();
      setSession({ id: newSession.id, type, startTime });
      trackEvent('session_start', { session_type: type, sessionId: newSession.id });

      // Navigate to the correct session page (except for daily-riddle which stays on same page)
      switch (type) {
        case 'problem-solver':
          router.push(`/problem-solver/session/${newSession.id}`);
          break;
        case 'daily-riddle':
          // Don't navigate - daily riddle now handles everything on one page
          break;
        case 'daily-scenario':
          router.push(`/daily-scenario/session/${newSession.id}`);
          break;
        case 'problem-solver-voice':
          router.push(`/problem-solver/voice-session/${newSession.id}`);
          break;
      }
    } catch (error) {
      console.error("Error starting session:", error);
      // In a real app, you'd set an error state to show in the UI
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = () => {
    if (session) {
      const duration = Date.now() - session.startTime;
      trackEvent('session_complete', {
        session_type: session.type,
        sessionId: session.id,
        duration,
      });
    }
    setSession(null);
    router.push('/');
  };

  return (
    <SessionContext.Provider value={{ session, startSession, endSession, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};