"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Brain, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { MitigationContingencySelection } from './MitigationContingencySelection';
import Tooltip from './Tooltip';

interface FearsAnalysisModalProps {
  actionId: string;
  actionText: string;
  painPoint: string;
  contributingCause: string;
  onClose: (answers?: { risk: string; mitigation: string; contingency: string }) => void;
}

// New step enumeration for the enhanced flow
enum Step {
  FEAR_INPUT = 1,           // What could go wrong?
  MITIGATION_INPUT = 2,     // What can prevent it?
  MITIGATION_SELECTION = 3, // Choose AI-suggested mitigations
  CONTINGENCY_INPUT = 4,    // What if it happens anyway?
  CONTINGENCY_SELECTION = 5 // Choose AI-suggested contingencies
}

export function FearsAnalysisModal({ actionId, actionText, painPoint, contributingCause, onClose }: FearsAnalysisModalProps) {
  const ai = useAIAssistant();
  const [currentStep, setCurrentStep] = useState<Step>(Step.FEAR_INPUT);
  
  // User input answers
  const [answers, setAnswers] = useState({
    risk: '',
    mitigation: '',
    contingency: ''
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // AI-related state for selections
  const [selectedMitigationOptions, setSelectedMitigationOptions] = useState<string[]>([]);
  const [selectedContingencyOptions, setSelectedContingencyOptions] = useState<string[]>([]);
  const [customMitigation, setCustomMitigation] = useState('');
  const [customContingency, setCustomContingency] = useState('');
  const [mitigationGenerationCount, setMitigationGenerationCount] = useState(0);
  const [contingencyGenerationCount, setContingencyGenerationCount] = useState(0);
  
  // State for collapsible sections
  const [isConcernExpanded, setIsConcernExpanded] = useState(false);
  const [isMitigationExpanded, setIsMitigationExpanded] = useState(false);
  const [isContingencyExpanded, setIsContingencyExpanded] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const questions = [
    "If you take this action, what could go wrong?",
    "What action could you take to try and prevent that from happening?",
    "", // Placeholder - this will show AI mitigation selection
    "If your fear comes true, what would you do to move forward?",
    "" // Placeholder - this will show AI contingency selection
  ];

  const questionKeys: (keyof typeof answers)[] = ['risk', 'mitigation', 'mitigation', 'contingency', 'contingency'];
  const maxGenerations = 3;
  const maxSelections = 3;

  const handleClose = () => {
    onClose();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentAnswer]);

  // Load the current answer when step changes (for input steps only)
  useEffect(() => {
    if (currentStep === Step.FEAR_INPUT || currentStep === Step.MITIGATION_INPUT || currentStep === Step.CONTINGENCY_INPUT) {
      const questionKey = questionKeys[currentStep - 1];
      setCurrentAnswer(answers[questionKey]);
      setValidationError('');
    }
  }, [currentStep, answers]);

  // Set the default state of the concern expander based on the current step
  useEffect(() => {
    if (currentStep === Step.MITIGATION_SELECTION || currentStep === Step.CONTINGENCY_INPUT || currentStep === Step.CONTINGENCY_SELECTION) {
      setIsConcernExpanded(false);
      setIsMitigationExpanded(false);
      setIsContingencyExpanded(false);
    } else if (currentStep > Step.FEAR_INPUT && currentStep < Step.MITIGATION_SELECTION) {
      setIsConcernExpanded(true);
    }
  }, [currentStep]);

  const handleNext = async () => {
    // Handle different step types
    if (currentStep === Step.FEAR_INPUT || currentStep === Step.MITIGATION_INPUT || currentStep === Step.CONTINGENCY_INPUT) {
      // User input steps
      if (!currentAnswer.trim()) {
        setValidationError('Please provide an answer before proceeding.');
        return;
      }

      // Save current answer
      const questionKey = questionKeys[currentStep - 1];
      const updatedAnswers = {
        ...answers,
        [questionKey]: currentAnswer.trim()
      };
      setAnswers(updatedAnswers);
      setValidationError('');

      if (currentStep === Step.FEAR_INPUT) {
        // Move to mitigation input
        setCurrentStep(Step.MITIGATION_INPUT);
      } else if (currentStep === Step.MITIGATION_INPUT) {
        // Request AI fear analysis (gets both mitigation and contingency options)
        setCurrentStep(Step.MITIGATION_SELECTION); // Move to loading step first
        await requestFearAnalysis(updatedAnswers.risk, currentAnswer.trim());
      } else if (currentStep === Step.CONTINGENCY_INPUT) {
        // Request AI fear analysis again for contingency (if needed)
        setCurrentStep(Step.CONTINGENCY_SELECTION); // Move to loading step first
        const selectedMitigation = customMitigation.trim() || selectedMitigationOptions[0] || updatedAnswers.mitigation;
        await requestFearAnalysis(updatedAnswers.risk, selectedMitigation, currentAnswer.trim());
      }
    } else if (currentStep === Step.MITIGATION_SELECTION) {
      // Mitigation selection step
      if (selectedMitigationOptions.length === 0 && !customMitigation.trim()) {
        // Allow continuing without a selection, implying the user sticks with their own plan
      }
      
      // Update mitigation answer with selection
      // If user entered a custom mitigation, it takes precedence.
      // If they selected options, join them.
      // If they did neither, it implies they are sticking with their original plan from the previous step.
      const finalMitigation = customMitigation.trim() ||
                              (selectedMitigationOptions.length > 0 ? selectedMitigationOptions.join('; ') : answers.mitigation);
      setAnswers(prev => ({ ...prev, mitigation: finalMitigation }));
      setCurrentStep(Step.CONTINGENCY_INPUT);
    } else if (currentStep === Step.CONTINGENCY_SELECTION) {
      // Contingency selection step - final step
      // Allow continuing without a selection, implying the user sticks with their own plan
      
      // Update contingency answer with selection and submit
      const finalContingency = customContingency.trim() ||
                              (selectedContingencyOptions.length > 0 ? selectedContingencyOptions.join('; ') : answers.contingency);
      const finalAnswers = {
        ...answers,
        contingency: finalContingency
      };
      onClose(finalAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > Step.FEAR_INPUT) {
      if (currentStep === Step.MITIGATION_INPUT || currentStep === Step.CONTINGENCY_INPUT) {
        const questionKey = questionKeys[currentStep - 1];
        setAnswers(prev => ({
          ...prev,
          [questionKey]: currentAnswer.trim()
        }));
      }
      
      if (currentStep === Step.MITIGATION_SELECTION) {
        setSelectedMitigationOptions([]);
        setCustomMitigation('');
        setMitigationGenerationCount(0);
      } else if (currentStep === Step.CONTINGENCY_SELECTION) {
        setSelectedContingencyOptions([]);
        setCustomContingency('');
        setContingencyGenerationCount(0);
      }
      
      setCurrentStep(prev => prev - 1);
      setValidationError('');
    }
  };

  // Request fear analysis using the new specialized system
  const requestFearAnalysis = async (risk: string, mitigation: string, contingency?: string) => {
    try {
      const fearContext = {
        painPoint,
        contributingCause,
        actionPlan: actionText,
        fearName: risk,
        userMitigationInput: mitigation,
        userContingencyInput: contingency || ''
      };
      
      await ai.requestFearAnalysis(mitigation, fearContext);
    } catch (error) {
      console.error('Failed to get fear analysis:', error);
    }
  };


  const handleGenerateMoreMitigations = async () => {
    if (mitigationGenerationCount >= maxGenerations) return;
    setMitigationGenerationCount(prev => prev + 1);
    await requestFearAnalysis(answers.risk, answers.mitigation);
  };

  const handleGenerateMoreContingencies = async () => {
    if (contingencyGenerationCount >= maxGenerations) return;
    setContingencyGenerationCount(prev => prev + 1);
    const selectedMitigation = customMitigation.trim() || selectedMitigationOptions[0] || answers.mitigation;
    await requestFearAnalysis(answers.risk, selectedMitigation, answers.contingency);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const getCurrentQuestionText = () => {
    if (currentStep <= questions.length) {
      return questions[currentStep - 1];
    }
    return '';
  };

  const getProgressText = () => {
    if (currentStep === Step.MITIGATION_SELECTION) {
      return 'Choose Mitigation';
    } else if (currentStep === Step.CONTINGENCY_SELECTION) {
      return 'Choose Contingency';
    } else {
      const inputStepNumber = currentStep > Step.MITIGATION_SELECTION ? currentStep - 2 : currentStep;
      return `Question ${inputStepNumber} of 3`;
    }
  };

  const isInputStep = () => {
    return currentStep === Step.FEAR_INPUT || currentStep === Step.MITIGATION_INPUT || currentStep === Step.CONTINGENCY_INPUT;
  };

  const isSelectionStep = () => {
    return currentStep === Step.MITIGATION_SELECTION || currentStep === Step.CONTINGENCY_SELECTION;
  };

  const getNextButtonText = () => {
    if (currentStep === Step.CONTINGENCY_SELECTION) return 'Submit';
    if (currentStep === Step.MITIGATION_SELECTION) return 'Continue';
    return 'Next';
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content cause-analysis-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="modal-close-button">
        </button>
        
        <div className="cause-analysis-header">
          <div className="action-plan-header">Action Plan</div>
          <div className="cause-pill">{actionText}</div>
          
          {/* Context header - show fear after it's been answered */}
          {answers.risk && currentStep > Step.FEAR_INPUT && (
            <div className="fear-context-header collapsible">
              <div className="fear-context-toggle" onClick={() => setIsConcernExpanded(!isConcernExpanded)}>
                <div className="fear-label">Your Concern</div>
                {isConcernExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {isConcernExpanded && (
                <div className="fear-text">{answers.risk}</div>
              )}
            </div>
          )}

          {/* Show mitigation plan persistently after it's been answered */}
          {answers.mitigation && currentStep > Step.MITIGATION_INPUT && (
             <div className="fear-context-header collapsible">
              <div className="fear-context-toggle" onClick={() => setIsMitigationExpanded(!isMitigationExpanded)}>
                <div className="fear-label">Your Mitigation Plan</div>
                {isMitigationExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {isMitigationExpanded && (
                <div className="fear-text">{answers.mitigation}</div>
              )}
            </div>
          )}

          {/* Show contingency plan persistently after it's been answered */}
          {answers.contingency && currentStep > Step.CONTINGENCY_INPUT && (
            <div className="fear-context-header collapsible">
              <div className="fear-context-toggle" onClick={() => setIsContingencyExpanded(!isContingencyExpanded)}>
                <div className="fear-label">Your Contingency Plan</div>
                {isContingencyExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {isContingencyExpanded && (
                <div className="fear-text">{answers.contingency}</div>
              )}
            </div>
          )}
        </div>

        <div className="conversation-container">
          {/* Progress indicator positioned with questions */}
          {isInputStep() && (
            <div className="question-section">
              <div className="progress-indicator-container">
                <div className="progress-indicator">
                  {getProgressText()}
                </div>
              </div>
              <div className="current-question">
                <div className="ai-message">
                  <div className="brain-icon-container">
                    <Brain className="brain-icon" size={20} />
                  </div>
                  <p>{getCurrentQuestionText()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Input area for user input steps */}
          {isInputStep() && (
            <div className="conversation-input">
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => {
                  setCurrentAnswer(e.target.value);
                  setValidationError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="It's okay if you're not sure. Take your best guess... (Press Enter to submit, Shift+Enter for new line)"
                className="expanding-textarea"
              />
              
              {validationError && (
                <div className="validation-error">
                  {validationError}
                </div>
              )}

              <div className="input-actions">
                <div className="primary-actions">
                  <div className="left-action">
                    {currentStep > Step.FEAR_INPUT && (
                      <button onClick={handleBack} className="back-button secondary">
                        <ChevronLeft size={16} />
                        Back
                      </button>
                    )}
                  </div>
                  <div className="right-action">
                    <button
                      onClick={handleNext}
                      disabled={!currentAnswer.trim()}
                      className="send-button primary"
                    >
                      {getNextButtonText()}
                      {currentStep < Step.CONTINGENCY_SELECTION && <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Selection Components */}
          {currentStep === Step.MITIGATION_SELECTION && (
            <div className="ai-selection-section">
              <MitigationContingencySelection
                type="mitigation"
                options={ai.fearAnalysis?.mitigationOptions || []}
                selectedOptions={selectedMitigationOptions}
                customOption={customMitigation}
                isGenerating={ai.loadingStage === 'fear_analysis'}
                maxSelections={maxSelections}
                generationCount={mitigationGenerationCount}
                maxGenerations={maxGenerations}
                onOptionSelect={(option) => {
                  setSelectedMitigationOptions(prev =>
                    prev.includes(option)
                      ? prev.filter(o => o !== option)
                      : prev.length < maxSelections ? [...prev, option] : prev
                  );
                }}
                onCustomOptionChange={setCustomMitigation}
                onGenerateMore={handleGenerateMoreMitigations}
              />
              
              {validationError && (
                <div className="validation-error">
                  {validationError}
                </div>
              )}
              
              <div className="selection-actions">
                <button onClick={handleBack} className="back-button secondary">
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={false}
                  className="send-button primary"
                >
                  Continue
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === Step.CONTINGENCY_SELECTION && (
            <div className="ai-selection-section">
              <MitigationContingencySelection
                type="contingency"
                options={ai.fearAnalysis?.contingencyOptions || []}
                selectedOptions={selectedContingencyOptions}
                customOption={customContingency}
                isGenerating={ai.loadingStage === 'fear_analysis'}
                maxSelections={maxSelections}
                generationCount={contingencyGenerationCount}
                maxGenerations={maxGenerations}
                onOptionSelect={(option) => {
                  setSelectedContingencyOptions(prev =>
                    prev.includes(option)
                      ? prev.filter(o => o !== option)
                      : prev.length < maxSelections ? [...prev, option] : prev
                  );
                }}
                onCustomOptionChange={setCustomContingency}
                onGenerateMore={handleGenerateMoreContingencies}
              />
              
              {validationError && (
                <div className="validation-error">
                  {validationError}
                </div>
              )}
              
              <div className="selection-actions">
                <button onClick={handleBack} className="back-button secondary">
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={false}
                  className="send-button primary"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .conversation-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-height: 300px;
          }

          .fear-context-header {
            margin-top: 0.75rem;
            padding: 0.75rem;
            background: var(--bg-secondary);
            border-left: 3px solid var(--refined-balance-teal);
            border-radius: 8px;
          }
          
          .fear-context-header.collapsible {
            padding: 0.5rem 0.75rem;
          }

          .fear-context-toggle {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            color: var(--text-secondary);
          }
          
          .fear-context-toggle:hover .fear-label {
            color: var(--text-primary);
          }

          .fear-label {
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-secondary);
            letter-spacing: 0.05em;
          }

          .fear-text {
            font-size: 0.95rem;
            line-height: 1.4;
            color: var(--text-primary);
            font-style: italic;
          }

          .current-question {
            padding-top: 0.25rem;
            margin-top: 0;
          }

          .current-question .ai-message {
            margin-top: 0;
            padding: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-height: 3rem;
            background: var(--bg-secondary);
            border-left: 3px solid var(--golden-mustard);
            border-radius: 8px;
          }

          .brain-icon-container {
            flex-shrink: 0;
            min-height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .brain-icon {
            color: var(--refined-balance-teal);
          }

          .current-question .ai-message p {
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.4;
            color: var(--text-primary);
            flex: 1;
          }

          .conversation-input {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .ai-selection-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .selection-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-light);
          }

          .expanding-textarea {
            width: 100%;
            min-height: 3rem;
            max-height: 200px;
            padding: 0.75rem;
            border: 1px solid var(--border-light);
            border-radius: 8px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-size: 1rem;
            line-height: 1.4;
            font-family: inherit;
            resize: none;
            box-sizing: border-box;
            overflow-y: hidden;
          }

          .expanding-textarea:focus {
            outline: none;
            border-color: var(--refined-balance-teal);
            box-shadow: 0 0 0 2px rgba(64, 162, 156, 0.1);
          }

          .expanding-textarea::placeholder {
            color: var(--text-secondary);
            opacity: 0.7;
          }

          .validation-error {
            color: #ef4444;
            font-size: 0.875rem;
            padding: 0.5rem 0;
          }

          .input-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .primary-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }

          .left-action {
            display: flex;
            align-items: center;
          }

          .right-action {
            display: flex;
            align-items: center;
          }

          .back-button, .send-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .back-button.secondary {
            background: rgba(205, 101, 71, 0.1);
            border: 1px solid var(--warm-brick);
            color: var(--warm-brick);
            font-size: 0.9rem;
            font-weight: 500;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .back-button.secondary:hover:not(:disabled) {
            background: rgba(205, 101, 71, 0.15);
            border-color: var(--warm-brick-hover);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(205, 101, 71, 0.3);
          }

          .back-button.secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .send-button.primary {
            background: var(--refined-balance-teal-light);
            border: 1px solid var(--refined-balance-teal);
            color: var(--refined-balance-teal);
            font-size: 0.9rem;
            font-weight: 500;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .send-button.primary:hover:not(:disabled) {
            background: var(--refined-balance-teal-focus);
            border-color: var(--refined-balance-teal);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .send-button.primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Modal structure styles for consistency */
          .cause-analysis-header {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            position: relative;
          }

          .action-plan-header {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary);
            text-align: center;
            margin-bottom: 0.25rem;
          }

          .cause-pill {
            background: var(--refined-balance-teal-light);
            color: var(--refined-balance-teal);
            padding: 0.75rem 1.25rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
            border: 1px solid var(--refined-balance-teal);
            white-space: normal;
            word-break: break-word;
          }

          .question-section {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .progress-indicator-container {
            display: flex;
            justify-content: center;
          }

          .progress-indicator {
            background: var(--bg-secondary);
            color: var(--text-secondary);
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid var(--border-light);
          }


          /* Loading states for consistency */
          .ai-message.loading {
            background: var(--bg-secondary);
            border-left: 3px solid var(--golden-mustard);
            border-radius: 8px;
          }

          .neural-network-brain {
            position: relative;
            width: 20px;
            height: 20px;
          }

          .light-particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: var(--refined-balance-teal);
            border-radius: 50%;
            animation: neural-pulse 2s infinite ease-in-out;
          }

          .light-particle:nth-child(1) {
            top: 2px;
            left: 8px;
            animation-delay: 0s;
          }

          .light-particle:nth-child(2) {
            top: 8px;
            left: 2px;
            animation-delay: 0.4s;
          }

          .light-particle:nth-child(3) {
            top: 8px;
            left: 14px;
            animation-delay: 0.8s;
          }

          .light-particle:nth-child(4) {
            top: 14px;
            left: 8px;
            animation-delay: 1.2s;
          }

          .light-particle:nth-child(5) {
            top: 8px;
            left: 8px;
            animation-delay: 1.6s;
          }

          @keyframes neural-pulse {
            0%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }
        `}</style>
      </div>
    </div>
  );
}