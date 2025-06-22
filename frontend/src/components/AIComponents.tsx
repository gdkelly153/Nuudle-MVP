// React AI Components Implementation
// File: frontend/src/components/AIComponents.tsx

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';

// Types
interface AIUsage {
  dailyRequests: number;
  dailyLimit: number;
  sessionRequests: number;
  sessionLimit: number;
}

interface AIResponse {
  response: string;
  cost: number;
  tokensUsed: number;
}

interface AIComponentProps {
  stage: 'problem_articulation' | 'root_cause' | 'assumptions' | 'perpetuation' | 'action_planning';
  sessionId: string;
  context: any;
  onResponse?: (response: string) => void;
}

// AI Activation Button
export const NuudleModeActivator: React.FC<{
  onActivate: () => void;
  disabled: boolean;
}> = ({ onActivate, disabled }) => {
  return (
    <div className="text-center mt-4">
      <button
        onClick={onActivate}
        disabled={disabled}
        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Activate Nuudle Mode
      </button>
    </div>
  );
};

// Stage-specific AI Button Component
export const AIAssistButton: React.FC<AIComponentProps & {
  isLoading: boolean;
  onRequest: () => void;
  disabled: boolean;
}> = ({ stage, isLoading, onRequest, disabled }) => {
  const buttonText = {
    problem_articulation: 'Get clarifying questions',
    root_cause: 'Suggest overlooked causes',
    assumptions: 'Help identify assumptions', 
    perpetuation: 'Reflect on patterns',
    action_planning: 'Process concerns'
  };

  const descriptions = {
    problem_articulation: 'AI will ask questions to help you articulate your problem more clearly',
    root_cause: 'AI will suggest additional root causes you might consider',
    assumptions: 'AI will help identify assumptions you might be making',
    perpetuation: 'AI will help you see patterns in how you might be contributing to the problem',
    action_planning: 'AI will help you reality-test your concerns and strengthen your plans'
  };

  return (
    <div className="mt-3">
      <button
        onClick={onRequest}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : isLoading
              ? 'bg-blue-100 text-blue-600 cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
          }
        `}
        aria-describedby={`ai-help-description-${stage}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            AI is thinking...
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4 mr-2" />
            {buttonText[stage]}
          </>
        )}
      </button>
      
      <div id={`ai-help-description-${stage}`} className="sr-only">
        {descriptions[stage]}
      </div>
    </div>
  );
};

// AI Response Card Component  
export const AIResponseCard: React.FC<{
  response: string;
  stage: string;
  onDismiss: () => void;
  onFollowUp?: () => void;
  onFeedback: (helpful: boolean) => void;
  canFollowUp: boolean;
}> = ({ response, stage, onDismiss, onFollowUp, onFeedback, canFollowUp }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    onFeedback(helpful);
    setFeedbackGiven(true);
    
    // Auto-dismiss after positive feedback
    if (helpful) {
      setTimeout(onDismiss, 1500);
    }
  };

  return (
    <div 
      className={`
        mt-4 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden transition-all duration-300
        ${isExpanded ? 'max-h-96' : 'max-h-12'}
      `}
      role="region"
      aria-label="AI assistance response"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-100">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">AI Coach Suggestion</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={isExpanded ? 'Collapse response' : 'Expand response'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onDismiss}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Dismiss AI response"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="text-gray-800 text-sm leading-relaxed mb-4">
            {response}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!feedbackGiven ? (
                <>
                  <button
                    onClick={() => handleFeedback(true)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    This helps
                  </button>
                  
                  <button
                    onClick={() => handleFeedback(false)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Not helpful
                  </button>
                </>
              ) : (
                <div className="flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Thanks for your feedback!
                </div>
              )}
            </div>
            
            {canFollowUp && onFollowUp && !feedbackGiven && (
              <button
                onClick={onFollowUp}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ask follow-up
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Error State Component
export const AIErrorCard: React.FC<{
  error: string;
  onRetry?: () => void;
  onDismiss: () => void;
}> = ({ error, onRetry, onDismiss }) => {
  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm text-red-800 mb-3">
            {error}
          </div>
          <div className="text-xs text-red-600 mb-3">
            Continue with your own thinking - you've got this! The AI is just here to help when it's working.
          </div>
          
          <div className="flex items-center space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Try again
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Suggested Cause Chip Component (for root cause suggestions)
export const SuggestedCause: React.FC<{
  text: string;
  onAdd: () => void;
  onDismiss: () => void;
}> = ({ text, onAdd, onDismiss }) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setIsAdded(true);
    setTimeout(() => onDismiss(), 1000); // Auto-dismiss after adding
  };

  return (
    <div 
      className={`
        inline-flex items-center px-3 py-1.5 m-1 text-sm rounded-full border transition-all duration-200
        ${isAdded 
          ? 'bg-green-100 border-green-300 text-green-800' 
          : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 cursor-pointer'
        }
      `}
    >
      <span className="mr-2">{text}</span>
      
      {!isAdded ? (
        <div className="flex items-center space-x-1">
          <button
            onClick={handleAdd}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            aria-label={`Add "${text}" to your causes`}
          >
            <CheckCircle className="w-3 h-3" />
          </button>
          <button
            onClick={onDismiss}
            className="text-blue-400 hover:text-blue-600 transition-colors"
            aria-label={`Dismiss "${text}" suggestion`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <CheckCircle className="w-3 h-3 text-green-600" />
      )}
    </div>
  );
};

// Main AI Assistant Hook
export const useAIAssistant = (sessionId: string) => {
  // Hardcoded userId for now. In a real app, this would come from an auth context.
  const userId = 'default-user';
  const [usage, setUsage] = useState<AIUsage>({
    dailyRequests: 0,
    dailyLimit: 10,
    sessionRequests: 0,
    sessionLimit: 5
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<{ response: string; interactionId: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage on mount and when isEnabled changes
  useEffect(() => {
    if (sessionId && isEnabled) {
      fetchUsage();
    }
  }, [sessionId, isEnabled]);

  const fetchUsage = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/ai/usage/${sessionId}?userId=${userId}`);
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
    if (!isEnabled || !sessionId || usage.dailyRequests >= usage.dailyLimit || usage.sessionRequests >= usage.sessionLimit) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          sessionId,
          stage,
          userInput,
          sessionContext: context
        })
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentResponse({ response: data.response, interactionId: data.interactionId });
        setUsage(data.usage);
      } else {
        setError(data.error || 'AI assistance temporarily unavailable');
      }
    } catch (error) {
      setError('Failed to connect to AI service. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissResponse = () => {
    setCurrentResponse(null);
    setError(null);
  };

  const provideFeedback = async (helpful: boolean) => {
    if (!currentResponse) return;
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          interactionId: currentResponse.interactionId,
          helpful
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return {
    usage,
    isEnabled,
    setIsEnabled,
    isLoading,
    currentResponse: currentResponse?.response ?? null,
    error,
    requestAssistance,
    dismissResponse,
    provideFeedback,
    canUseAI: usage.dailyRequests < usage.dailyLimit && usage.sessionRequests < usage.sessionLimit
  };
};