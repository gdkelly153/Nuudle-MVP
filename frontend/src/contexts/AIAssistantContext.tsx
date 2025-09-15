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

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

interface CauseAnalysisState {
  cause: string;
  history: ChatMessage[];
  isComplete: boolean;
  summary: string | null;
  smartChips: string[];
  rootCauseOptions: string[];
  error: string | null;
}

interface ActionPlanningState {
  cause: string;
  isContribution: boolean;
  history: ChatMessage[];
  isComplete: boolean;
  summary: string | null;
  actionPlanOptions: string[];
  error: string | null;
}

interface FearAnalysisState {
  mitigationPlan: string;
  isComplete: boolean;
  mitigationOptions: string[];
  contingencyOptions: string[];
  error: string | null;
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
  causeAnalysis: CauseAnalysisState | null;
  actionPlanning: ActionPlanningState | null;
  fearAnalysis: FearAnalysisState | null;
  requestAssistance: (stage: string, userInput: string, context: any, forceGuidance?: boolean) => Promise<void>;
  requestCauseAnalysis: (cause: string, history: ChatMessage[], regenerate?: boolean, painPoint?: string) => Promise<void>;
  requestActionPlanning: (cause: string, history: ChatMessage[], isContribution?: boolean, regenerate?: boolean, sessionContext?: any, generationCount?: number, existingPlans?: string[], causeAnalysisHistory?: ChatMessage[]) => Promise<void>;
  requestFearAnalysis: (mitigationPlan: string, fearContext?: any) => Promise<void>;
  setCauseAnalysisState: (state: CauseAnalysisState) => void;
  setActionPlanningState: (state: ActionPlanningState) => void;
  setFearAnalysisState: (state: FearAnalysisState) => void;
  clearCauseAnalysis: () => void;
  clearActionPlanning: () => void;
  clearFearAnalysis: () => void;
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
  const [causeAnalysis, setCauseAnalysis] = useState<CauseAnalysisState | null>(null);
  const [actionPlanning, setActionPlanning] = useState<ActionPlanningState | null>(null);
  const [fearAnalysis, setFearAnalysis] = useState<FearAnalysisState | null>(null);

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

  // Helper function to filter out empty values from context for meaningful comparison
  const filterEmptyValues = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj
        .map(item => filterEmptyValues(item))
        .filter(item => {
          if (typeof item === 'string') return item.trim() !== '';
          if (typeof item === 'object' && item !== null) {
            return Object.values(item).some(val =>
              typeof val === 'string' ? val.trim() !== '' : val !== null && val !== undefined
            );
          }
          return item !== null && item !== undefined;
        });
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const filtered: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const filteredValue = filterEmptyValues(value);
        if (typeof filteredValue === 'string' && filteredValue.trim() === '') continue;
        if (Array.isArray(filteredValue) && filteredValue.length === 0) continue;
        if (typeof filteredValue === 'object' && filteredValue !== null && Object.keys(filteredValue).length === 0) continue;
        filtered[key] = filteredValue;
      }
      return filtered;
    }
    
    return obj;
  };

  const requestAssistance = async (stage: string, userInput: string, context: any, forceGuidance?: boolean) => {
    if (!sessionId) {
      return;
    }

    // Check per-button limits
    const stageUsage = usage.stageUsageByStage[stage] || 0;
    if (stageUsage >= usage.stageLimit) {
      setError(`You've reached the limit for this button (${stageUsage}/${usage.stageLimit} uses). Other AI buttons are still available.`);
      return;
    }

    // Always make a fresh API call to ensure users get the latest AI behavior
    // This ensures that backend prompt improvements are immediately visible

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
          sessionContext: context,
          forceGuidance: forceGuidance || false
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResponses(prev => ({
          ...prev,
          [stage]: {
            response: data.response,
            interactionId: data.interactionId,
            userInput: context // Store the context instead of userInput for better comparison
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

  const requestCauseAnalysis = async (cause: string, history: ChatMessage[], regenerate: boolean = false, painPoint: string = '') => {
    if (!sessionId) return;

    setLoadingStage('cause_analysis');
    setCauseAnalysis(prev => ({ ...prev!, cause, history, error: null }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/adaptive-cause-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cause,
          history: history.map(m => m.text),
          painPoint: painPoint,
          regenerate
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.is_complete) {
          // Conversation is complete - show root cause options
          setCauseAnalysis({
            cause,
            history,
            isComplete: true,
            summary: null,
            smartChips: [],
            rootCauseOptions: data.root_cause_options || [],
            error: null,
          });
        } else {
          // Continue conversation - add AI question to history
          const newHistory = [...history, { sender: 'ai' as const, text: data.next_question }];
          setCauseAnalysis({
            cause,
            history: newHistory,
            isComplete: false,
            summary: null,
            smartChips: [],
            rootCauseOptions: [],
            error: null,
          });
        }
      } else {
        setCauseAnalysis(prev => ({
          ...prev!,
          error: data.error || 'Failed to analyze cause'
        }));
      }
    } catch (error) {
      setCauseAnalysis(prev => ({ ...prev!, error: 'Failed to connect to the server' }));
    } finally {
      setLoadingStage(null);
    }
  };

  const clearCauseAnalysis = () => {
    setCauseAnalysis(null);
  };

  const requestActionPlanning = async (cause: string, history: ChatMessage[], isContribution: boolean = false, regenerate: boolean = false, sessionContext?: any, generationCount?: number, existingPlans?: string[], causeAnalysisHistory?: ChatMessage[]) => {
    if (!sessionId) return;

    setLoadingStage('action_planning');
    setActionPlanning(prev => ({
      ...prev!,
      cause,
      isContribution,
      history,
      error: null
    }));

    try {
      const requestBody: any = {
        session_id: sessionId,
        cause,
        isContribution,
        history: history.map(m => m.text),
        regenerate,
        include_session_context: true,
        frontend_session_context: sessionContext,
        generation_count: generationCount,
        existing_plans: existingPlans
      };

      // Add pain_point if available in sessionContext
      if (sessionContext?.pain_point) {
        requestBody.pain_point = sessionContext.pain_point;
      }

      // Add cause_analysis_history if available
      if (causeAnalysisHistory && causeAnalysisHistory.length > 0) {
        requestBody.cause_analysis_history = causeAnalysisHistory.map(m => ({
          sender: m.sender,
          text: m.text
        }));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}/actions/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // For regeneration, don't add new AI message to history
        const newHistory = regenerate ? history : [...history, { sender: 'ai' as const, text: data.response }];
        setActionPlanning({
          cause,
          isContribution,
          history: newHistory,
          isComplete: data.is_complete || false,
          summary: data.is_complete ? data.response : null,
          actionPlanOptions: data.action_plan_options || [],
          error: null,
        });
      } else {
        throw new Error(data.error || 'Action planning failed');
      }
    } catch (error) {
      console.error('Action planning error:', error);
      setActionPlanning(prev => ({
        ...prev!,
        error: error instanceof Error ? error.message : 'Failed to connect to the server'
      }));
    } finally {
      setLoadingStage(null);
    }
  };

  const clearActionPlanning = () => {
    setActionPlanning(null);
  };

  const requestFearAnalysis = async (mitigationPlan: string, fearContext?: any) => {
    if (!sessionId) return;

    setLoadingStage('fear_analysis');
    setFearAnalysis(prev => ({
      ...prev!,
      mitigationPlan,
      error: null
    }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/fear-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mitigation_plan: mitigationPlan,
          fear_context: fearContext || {}
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setFearAnalysis({
          mitigationPlan,
          isComplete: true,
          mitigationOptions: data.mitigation_options || [],
          contingencyOptions: data.contingency_options || [],
          error: null,
        });
      } else {
        throw new Error(data.error || 'Fear analysis failed');
      }
    } catch (error) {
      console.error('Fear analysis error:', error);
      setFearAnalysis(prev => ({
        ...prev!,
        error: error instanceof Error ? error.message : 'Failed to connect to the server'
      }));
    } finally {
      setLoadingStage(null);
    }
  };

  const clearFearAnalysis = () => {
    setFearAnalysis(null);
  };

  const setCauseAnalysisState = (state: CauseAnalysisState) => {
    setCauseAnalysis(state);
  };

  const setActionPlanningState = (state: ActionPlanningState) => {
    setActionPlanning(state);
  };

  const setFearAnalysisState = (state: FearAnalysisState) => {
    setFearAnalysis(state);
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
    causeAnalysis,
    actionPlanning,
    fearAnalysis,
    requestAssistance,
    requestCauseAnalysis,
    requestActionPlanning,
    requestFearAnalysis,
    setCauseAnalysisState,
    setActionPlanningState,
    setFearAnalysisState,
    clearCauseAnalysis,
    clearActionPlanning,
    clearFearAnalysis,
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