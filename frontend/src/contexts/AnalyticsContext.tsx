"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type EventName = 'session_start' | 'session_complete' | 'module_view';

interface EventPayload {
  [key: string]: any;
}

interface AnalyticsContextType {
  trackEvent: (eventName: EventName, payload: EventPayload) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const trackEvent = (eventName: EventName, payload: EventPayload) => {
    const eventData = {
      eventName,
      payload,
      userId: user?.id || 'anonymous',
      timestamp: new Date().toISOString(),
    };

    console.log('[Analytics Event]', eventData);

    // Send data to the backend, but don't block the UI
    fetch('/api/v1/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      keepalive: true, // Ensures the request is sent even if the page is unloading
    }).catch(error => {
      console.error('Failed to track analytics event:', error);
    });
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};