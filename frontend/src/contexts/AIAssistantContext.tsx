"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface AIUsage {
  dailyRequests: number;
  dailyLimit: number;
  sessionRequests: number;
  sessionLimit: number;
  stageUsageByStage: { [stage: string]: number };
  stageLimit: number;
}

interface AIResponse {
  response: string;
  interactionId: number;
  userInput: any;
}

interface AIAssistantContextType {
  usage: AIUsage;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  loadingStage: string | null;
  lastAttemptedStage: string | null;
  responses: { [stage: string]: AIResponse | null };
  activeStage: string | null;
  error: string | null;
  requestAssistance: (stage: string, userInput: string, context: any) => Promise<void>;
  dismissResponse: () => void;
  provideFeedback: (helpful: boolean) => Promise<void>;
  clearResponseForStage: (stage: string) => void;
  canUseAI: (stage: string) => boolean;
  getCurrentResponse: () => string | null;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

interface AIAssistantProviderProps {
  children: ReactNode;
  sessionId: string;
  onInteractionLog?: (stage: string, userInput: string, aiResponse: string) => void;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({
  children,
  sessionId,
  onInteractionLog
}) => {
  const [usage, setUsage] = useState<AIUsage>({
    dailyRequests: 0,
    dailyLimit: 999,
    sessionRequests: 0,
    sessionLimit: 999,
    stageUsageByStage: {},
    stageLimit: 5
  });
  const [isEnabled, setIsEnabled] = useState(true);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [lastAttemptedStage, setLastAttemptedStage] = useState<string | null>(null);
  const [responses, setResponses] = useState<{ [stage: string]: AIResponse | null }>({});
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage on mount
  useEffect(() => {
    if (sessionId) {
      fetchUsage();
    }
  }, [sessionId]);

  const fetchUsage = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/usage/${sessionId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const usageData = await response.json();
        setUsage(usageData);
      } else {
        console.error('Failed to fetch usage:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch AI usage:', error);
    }
  };

  const requestAssistance = async (stage: string, userInput: string, context: any) => {
    if (!sessionId) {
      return;
    }

    // Check per-button limits
    const stageUsage = usage.stageUsageByStage[stage] || 0;
    if (stageUsage >= usage.stageLimit) {
      setError(`You've reached the limit for this button (${stageUsage}/${usage.stageLimit} uses). Other AI buttons are still available.`);
      return;
    }

    // Check if we have a cached response for this stage with the same user input
    const existingResponse = responses[stage];
    if (existingResponse && JSON.stringify(existingResponse.userInput) === JSON.stringify(userInput)) {
      // Same input, just show the existing response
      setActiveStage(stage);
      setError(null);
      return;
    }

    setLoadingStage(stage);
    setLastAttemptedStage(stage);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          stage,
          userInput,
          sessionContext: context
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResponses(prev => ({ 
          ...prev, 
          [stage]: { 
            response: data.response, 
            interactionId: data.interactionId, 
            userInput 
          } 
        }));
        setActiveStage(stage);
        setUsage(data.usage);
        
        // Log the interaction for adaptive feedback
        if (onInteractionLog) {
          onInteractionLog(stage, userInput, data.response);
        }
      } else {
        setError(data.error || 'AI assistance temporarily unavailable');
      }
    } catch (error) {
      setError('Failed to connect to AI service. Please check your internet connection.');
    } finally {
      setLoadingStage(null);
    }
  };

  const dismissResponse = () => {
    setActiveStage(null);
    setError(null);
  };

  const provideFeedback = async (helpful: boolean) => {
    if (!activeStage || !responses[activeStage]) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          interactionId: responses[activeStage]?.interactionId,
          helpful
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // This function only clears errors and loading states, but preserves responses
  const clearResponseForStage = (stage: string) => {
    // Clear any errors
    setError(null);
    // Clear loading stage if it matches
    if (loadingStage === stage) {
      setLoadingStage(null);
    }
    // Clear last attempted stage if it matches
    if (lastAttemptedStage === stage) {
      setLastAttemptedStage(null);
    }
    // Do NOT clear the cached response or active stage - this preserves the response
  };

  const canUseAI = (stage: string) => {
    const stageUsage = usage.stageUsageByStage[stage] || 0;
    return stageUsage < usage.stageLimit;
  };

  const getCurrentResponse = () => {
    return activeStage ? responses[activeStage]?.response ?? null : null;
  };

  const value: AIAssistantContextType = {
    usage,
    isEnabled,
    setIsEnabled,
    loadingStage,
    lastAttemptedStage,
    responses,
    activeStage,
    error,
    requestAssistance,
    dismissResponse,
    provideFeedback,
    clearResponseForStage,
    canUseAI,
    getCurrentResponse
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};