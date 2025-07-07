// React AI Components Implementation
// File: frontend/src/components/AIComponents.tsx

import React, { useState, useEffect } from 'react';
import Tooltip from '@/components/Tooltip';
import BrainIconWithAnimation from '@/components/BrainIconWithAnimation';
import { ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  stage: 'problem_articulation_direct' | 'problem_articulation_intervention' | 'root_cause' | 'identify_assumptions' | 'potential_actions' | 'perpetuation' | 'action_planning';
  sessionId: string;
  context: any;
  onResponse?: (response: string) => void;
}

// AI Activation Button
interface HelpMeNuudleButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  currentStep: number;
  buttonStep: number;
}

export const HelpMeNuudleButton: React.FC<HelpMeNuudleButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  currentStep,
  buttonStep
}) => {
  const isCorrectStep = currentStep === buttonStep;
  const isButtonDisabled = !isCorrectStep || disabled || isLoading;
  const tooltipShouldBeEnabled = isCorrectStep && disabled && !isLoading;

  return (
    <Tooltip text="Attempt the prompt to utilize me." isDisabled={tooltipShouldBeEnabled}>
      <div className="help-me-nuudle-button-container inline-block">
        <BrainIconWithAnimation size={20} className="text-blue-600" />
        <button
          onClick={onClick}
          disabled={isButtonDisabled}
          className="button landing-button"
        >
          {isLoading ? (
            'Nuudling...'
          ) : (
            'Help Me Nuudle'
          )}
        </button>
      </div>
    </Tooltip>
  );
};

// Stage-specific AI Button Component
export const AIAssistButton: React.FC<AIComponentProps & {
  isLoading: boolean;
  onRequest: () => void;
  disabled: boolean;
  currentStep: number;
  buttonStep: number;
}> = ({ stage, isLoading, onRequest, disabled, currentStep, buttonStep }) => {
  const isCorrectStep = currentStep === buttonStep;
  const isButtonDisabled = !isCorrectStep || disabled || isLoading;
  const tooltipShouldBeEnabled = isCorrectStep && disabled && !isLoading;

  const buttonText = {
    problem_articulation_direct: 'Help me articulate my problem',
    problem_articulation_intervention: 'Help me articulate my problem',
    root_cause: 'Help me identify root causes',
    identify_assumptions: 'Help me identify assumptions',
    potential_actions: 'Help me with potential actions',
    perpetuation: 'Help me reflect on my potential role',
    action_planning: 'Help me process my concerns'
  };

  const descriptions = {
    problem_articulation_direct: 'AI will ask questions to help you articulate your problem more clearly.',
    problem_articulation_intervention: 'AI will ask questions to help you articulate your problem more clearly.',
    root_cause: 'AI will suggest additional root causes you might have overlooked.',
    identify_assumptions: 'AI will help you identify potential assumptions in your stated causes.',
    potential_actions: 'AI will ask questions to help you think more deeply about your drafted actions and explore other possibilities.',
    perpetuation: 'AI will guide you through a thought experiment to uncover the behaviors and patterns that keep the problem in place.',
    action_planning: 'AI will help you reality-test your concerns and strengthen your plans.'
  };

  return (
    <Tooltip text="Attempt the prompt to utilize me." isDisabled={tooltipShouldBeEnabled}>
      <div className="ai-button-wrapper relative inline-block">
        <button
          onClick={onRequest}
          disabled={isButtonDisabled}
          className={`
            ai-assist-button inline-flex items-center gap-2 rounded-md transition-all duration-200
            ${isButtonDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isLoading
                ? 'bg-blue-100 text-blue-600 cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
            }
          `}
          aria-describedby={`ai-help-description-${stage}`}
          style={{ minWidth: 'fit-content' }}
        >
          <BrainIconWithAnimation size={16} className="text-blue-600" />
          {isLoading ? (
            <span style={{ fontSize: 'inherit' }}>Nuudling...</span>
          ) : (
            <span>{buttonText[stage]}</span>
          )}
        </button>
      </div>
    </Tooltip>
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
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (helpful: boolean) => {
    onFeedback(helpful);
    setFeedbackGiven(true);
    // Remove auto-dismiss - card stays open after feedback
  };

  // Stage-specific titles - use "Nuudle AI" for initial problem articulation, others keep their specific titles
  const stageTitle = {
    problem_articulation_direct: 'Nuudle AI',
    problem_articulation_intervention: 'Nuudle AI',
    problem_articulation_context_aware: 'Nuudle AI',
    root_cause: 'Root Cause Analysis',
    identify_assumptions: 'Challenging Narratives',
    potential_actions: 'Action Exploration',
    perpetuation: 'Pattern Recognition',
    action_planning: 'Mitigations and Contingencies'
  }[stage] || 'AI Assistance';

  return (
    <div
      className="ai-response-card-new entering"
      role="region"
      aria-label="AI assistance response"
    >
      {/* Header - No brain icon */}
      <div className="ai-response-header">
        <h3 className="ai-response-header-title">{stageTitle}</h3>
      </div>

      {/* Body */}
      <div className="ai-response-body">
        <div className="ai-response-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {response}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer */}
      <div className="ai-response-footer">
        <div className="ai-response-actions">
          {!feedbackGiven ? (
            <>
              <button
                onClick={() => handleFeedback(true)}
                className="ai-response-feedback-btn positive"
                title="Mark as helpful"
              >
                <CheckCircle className="w-4 h-4 text-refined-balance-teal" strokeWidth={2.5} />
                Helpful
              </button>
              
              <button
                onClick={() => handleFeedback(false)}
                className="ai-response-feedback-btn negative"
                title="Mark as not helpful"
              >
                <X className="w-4 h-4 text-warm-brick" strokeWidth={2.5} />
                Not helpful
              </button>
            </>
          ) : (
            <div className="flex items-center text-sm text-progress-complete">
              <CheckCircle className="w-4 h-4 mr-2" />
              Thanks for your feedback!
            </div>
          )}
          
          {canFollowUp && onFollowUp && !feedbackGiven && (
            <button
              onClick={onFollowUp}
              className="ai-response-feedback-btn"
              title="Ask a follow-up question"
            >
              Ask follow-up
            </button>
          )}
        </div>
        
        <div className="ai-response-meta">
          <button
            onClick={onDismiss}
            className="ai-response-expand-btn"
            aria-label="Dismiss AI response"
            title="Dismiss this response"
          >
            <X className="w-4 h-4 text-warm-brick" strokeWidth={2.5} />
            Dismiss
          </button>
        </div>
      </div>
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
          ? 'bg-progress-complete-light border-progress-complete text-progress-complete'
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
        <CheckCircle className="w-3 h-3 text-progress-complete" />
      )}
    </div>
  );
};

// Main AI Assistant Hook
export const useAIAssistant = (sessionId: string, onInteractionLog?: (stage: string, userInput: string, aiResponse: string) => void) => {
  const [usage, setUsage] = useState<AIUsage>({
    dailyRequests: 0,
    dailyLimit: 10,
    sessionRequests: 0,
    sessionLimit: 5
  });
  const [isEnabled, setIsEnabled] = useState(true);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [lastAttemptedStage, setLastAttemptedStage] = useState<string | null>(null);
  const [responses, setResponses] = useState<{ [stage: string]: { response: string; interactionId: number; userInput: any } | null }>({});
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
        credentials: 'include' // Include cookies for authentication
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
    if (!sessionId || usage.dailyRequests >= usage.dailyLimit || usage.sessionRequests >= usage.sessionLimit) {
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
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          sessionId,
          stage,
          userInput,
          sessionContext: context
        })
      });

      const data = await response.json();
      if (response.ok) {
        setResponses(prev => ({ ...prev, [stage]: { response: data.response, interactionId: data.interactionId, userInput } }));
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
        credentials: 'include', // Include cookies for authentication
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

  return {
    usage,
    isEnabled,
    setIsEnabled,
    loadingStage,
    lastAttemptedStage,
    currentResponse: activeStage ? responses[activeStage]?.response ?? null : null,
    error,
    requestAssistance,
    dismissResponse,
    provideFeedback,
    canUseAI: usage.dailyRequests < usage.dailyLimit && usage.sessionRequests < usage.sessionLimit
  };
};