"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { X, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { RootCauseSelection } from './RootCauseSelection';
import Tooltip from './Tooltip';

interface CauseAnalysisModalProps {
  causeId: string;
  causeText: string;
  history: any[];
  totalCauses: number;
  painPoint: string;
  onClose: (selections: string[]) => void;
}

export function CauseAnalysisModal({ causeId, causeText, history, totalCauses, painPoint, onClose }: CauseAnalysisModalProps) {
  const ai = useAIAssistant();
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [savedAnswers, setSavedAnswers] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customOption, setCustomOption] = useState('');
  const [generationCount, setGenerationCount] = useState(0);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationHistoryRef = useRef<HTMLDivElement>(null);

  // Calculate available slots for new causes (max 5 total, but allow up to 3 selections)
  const availableSlots = Math.max(0, 5 - totalCauses);
  const maxSelections = Math.min(3, availableSlots + 1); // +1 because we replace the original cause
  const maxGenerations = 3;

  const handleClose = () => {
    onClose([]);
  };

  // Initialize the conversation when modal opens
  useEffect(() => {
    ai.requestCauseAnalysis(causeText, history, false, painPoint);
    return () => ai.clearCauseAnalysis();
  }, [causeId]);

  // Derived state - calculated from clean sources
  const currentQuestion = ai.causeAnalysis?.history
    ?.filter(item => item.sender === 'ai')
    ?.slice(-1)[0]?.text || '';

  const exchangeCount = Math.floor((ai.causeAnalysis?.history?.length || 0) / 2);
  const currentQuestionNumber = exchangeCount + 1;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentAnswer]);

  // Restore saved answer when AI question changes (forward navigation)
  useEffect(() => {
    if (currentQuestion && !currentAnswer) {
      const currentQuestionIndex = Math.floor((ai.causeAnalysis?.history?.length || 0) / 2);
      const savedAnswer = savedAnswers[currentQuestionIndex] || '';
      
      if (savedAnswer) {
        setCurrentAnswer(savedAnswer);
      }
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (conversationHistoryRef.current) {
      conversationHistoryRef.current.scrollTop = conversationHistoryRef.current.scrollHeight;
    }
  }, [ai.causeAnalysis?.history]);

  const handleSend = () => {
    if (!currentAnswer.trim() || currentAnswer.trim().length < 3) return;
    
    const currentHistory = ai.causeAnalysis?.history || [];
    const currentQuestionIndex = Math.floor(currentHistory.length / 2);
    
    // Always save the current answer to savedAnswers (overwriting if it exists)
    const newSavedAnswers = [...savedAnswers];
    newSavedAnswers[currentQuestionIndex] = currentAnswer;
    setSavedAnswers(newSavedAnswers);
    
    // Create new history with user's response
    // Include all current history plus the user's response
    const newHistory = [...currentHistory, { sender: 'user' as const, text: currentAnswer }];
    
    // Make API call with clean history
    ai.requestCauseAnalysis(causeText, newHistory, false, painPoint);
    
    // Clear current answer after submission
    setCurrentAnswer('');
  };

  const handleSkip = () => {
    const currentHistory = ai.causeAnalysis?.history || [];
    const currentQuestionIndex = Math.floor(currentHistory.length / 2);
    
    // Save "I'm not sure" as the answer
    const newSavedAnswers = [...savedAnswers];
    newSavedAnswers[currentQuestionIndex] = "I'm not sure.";
    setSavedAnswers(newSavedAnswers);
    
    // Create new history with skip response
    const newHistory = [...currentHistory, { sender: 'user' as const, text: "I'm not sure." }];
    
    // Make API call
    ai.requestCauseAnalysis(causeText, newHistory, false, painPoint);
  };

  const handleBack = () => {
    const currentHistory = ai.causeAnalysis?.history || [];
    if (currentHistory.length < 2) return; // Can't go back if no history
    
    // If we're on the final screen (isComplete: true), clear all selections
    // since the user is about to redo questions which might generate different options
    if (ai.causeAnalysis?.isComplete) {
      setSelectedOptions([]);
      setCustomOption('');
      setGenerationCount(0);
    }
    
    // Save current answer if there's text to save
    if (currentAnswer.trim()) {
      const currentQuestionIndex = Math.floor(currentHistory.length / 2);
      const newSavedAnswers = [...savedAnswers];
      newSavedAnswers[currentQuestionIndex] = currentAnswer;
      setSavedAnswers(newSavedAnswers);
    }
    
    // If we are on the final screen, the history includes the full conversation.
    // Going "back" should revert to the state *before* the final AI response was generated,
    // which means removing the last user answer and the AI's concluding analysis/question.
    // If not on the final screen, we just go back one question/answer pair.
    const newHistory = ai.causeAnalysis?.isComplete
      ? currentHistory.slice(0, -1) // Remove only the AI's final "completion" state message if it exists
      : currentHistory.slice(0, -2);
    
    // Update the cause analysis state directly (no API call)
    ai.setCauseAnalysisState({
      cause: causeText,
      history: newHistory,
      isComplete: false,
      summary: null,
      smartChips: [],
      rootCauseOptions: [],
      error: null,
    });
    
    // Restore the previous answer for the question we're going back to
    const previousQuestionIndex = Math.floor(newHistory.length / 2);
    const previousAnswer = savedAnswers[previousQuestionIndex] || '';
    setCurrentAnswer(previousAnswer);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateRootCauses = () => {
    setShowSkipModal(true);
  };

  const handleSkipToRootCauses = () => {
    setShowSkipModal(false);
    // Request root cause analysis with regenerate=true to skip remaining questions
    ai.requestCauseAnalysis(causeText, ai.causeAnalysis?.history || [], true, painPoint);
  };

  const handleCancelSkip = () => {
    setShowSkipModal(false);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content cause-analysis-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="modal-close-button">
        </button>
        
        <div className="cause-analysis-header">
          <div className="cause-pill">{causeText}</div>
          {!ai.causeAnalysis?.isComplete && (
            <div className="progress-indicator-container">
              <div className="progress-indicator">
                Question {currentQuestionNumber}
              </div>
            </div>
          )}
        </div>

        <div className="conversation-container">
          {/* Show conversation history only when analysis is NOT complete */}
          {ai.causeAnalysis && ai.causeAnalysis.history.length > 1 && !ai.causeAnalysis.isComplete && (
            <div className="conversation-history" ref={conversationHistoryRef}>
              {ai.causeAnalysis.history.slice(0, -1).map((message, index) => (
                <div key={index} className={`message ${message.sender === 'ai' ? 'ai-message' : 'user-message'}`}>
                  {message.sender === 'ai' && (
                    <div className="brain-icon-container">
                      <Brain className="brain-icon" size={16} />
                    </div>
                  )}
                  <p className={message.sender === 'user' ? 'user-text' : ''}>{message.text}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Show current AI question if not complete */}
          {ai.causeAnalysis && !ai.causeAnalysis.isComplete && (
            <div className="current-question">
              {ai.loadingStage === 'cause_analysis' ? (
                <div className="ai-message loading">
                  <div className="brain-icon-container">
                    <Brain className="brain-icon" size={20} />
                    <div className="neural-network-brain">
                      <div className="light-particle"></div>
                      <div className="light-particle"></div>
                      <div className="light-particle"></div>
                      <div className="light-particle"></div>
                      <div className="light-particle"></div>
                    </div>
                  </div>
                  <p>Thinking...</p>
                </div>
              ) : currentQuestion ? (
                <div className="ai-message">
                  <div className="brain-icon-container">
                    <Brain className="brain-icon" size={20} />
                  </div>
                  <p>{currentQuestion}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Input area for ongoing conversation */}
          {ai.causeAnalysis && !ai.causeAnalysis.isComplete && (
            <div className="conversation-input">
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts... (Press Enter to submit, Shift+Enter for new line)"
                className="expanding-textarea"
                disabled={ai.loadingStage === 'cause_analysis'}
              />
              <div className="input-actions">
                <div className="primary-actions">
                  <div className="left-action">
                    {exchangeCount > 0 && (
                      <button onClick={handleBack} className="back-button secondary" disabled={ai.loadingStage === 'cause_analysis'}>
                        <ChevronLeft size={16} />
                        Back
                      </button>
                    )}
                  </div>
                  <div className="right-action">
                    <button
                      onClick={handleSend}
                      disabled={!currentAnswer.trim() || currentAnswer.trim().length < 3 || ai.loadingStage === 'cause_analysis'}
                      className="send-button primary"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="secondary-actions">
                  <button onClick={handleSkip} className="skip-button tertiary">
                    Skip Question
                  </button>
                  {exchangeCount >= 2 && (
                    <button
                      onClick={handleGenerateRootCauses}
                      disabled={ai.loadingStage === 'cause_analysis'}
                      className="generate-button tertiary"
                    >
                      Skip to Root Cause Analysis
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Root cause selection when complete */}
          {ai.causeAnalysis?.isComplete && (
            <div className="root-cause-section">
              <RootCauseSelection
                options={ai.causeAnalysis.rootCauseOptions}
                selectedOptions={selectedOptions}
                customOption={customOption}
                isGenerating={ai.loadingStage === 'cause_analysis'}
                maxSelections={maxSelections}
                generationCount={generationCount}
                maxGenerations={maxGenerations}
                onOptionSelect={(option) => {
                  setSelectedOptions(prev =>
                    prev.includes(option)
                      ? prev.filter(o => o !== option)
                      : [...prev, option]
                  );
                }}
                onCustomOptionChange={setCustomOption}
                onGenerateMore={() => {
                  if (generationCount < maxGenerations && selectedOptions.length < maxSelections) {
                    setGenerationCount(prev => prev + 1);
                    ai.requestCauseAnalysis(causeText, ai.causeAnalysis?.history || [], true, painPoint);
                  }
                }}
              />
              <div className="root-cause-actions">
                <button onClick={handleBack} className="back-button secondary">
                  <ChevronLeft size={16} />
                  Back
                </button>
                <Tooltip
                  text="Select one or more root causes, then confirm your selections to complete the analysis."
                  isDisabled={!selectedOptions.length && !customOption.trim()}
                >
                  <button
                    onClick={() => {
                      const selections = customOption.trim() ? [customOption.trim()] : selectedOptions;
                      onClose(selections);
                    }}
                    disabled={!selectedOptions.length && !customOption.trim()}
                    className="send-button primary"
                  >
                    Confirm Selections
                  </button>
                </Tooltip>
              </div>
            </div>
          )}

          {/* Skip confirmation modal */}
          {showSkipModal && (
            <div className="skip-modal-overlay">
              <div className="skip-modal">
                <h3>Are you sure you want to skip ahead?</h3>
                <p>
                  Answering all the questions (usually 3-5) provides the most accurate root cause analysis.
                </p>
                <p>
                  If you skip now, we'll generate the best possible options based on your answers so far.
                </p>
                <div className="skip-modal-actions">
                  <button
                    onClick={handleCancelSkip}
                    className="keep-answering-button primary"
                  >
                    Keep Answering
                  </button>
                  <button
                    onClick={handleSkipToRootCauses}
                    className="skip-ahead-button secondary"
                  >
                    Skip Ahead
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {ai.causeAnalysis?.error && (
            <div className="error-section">
              <p className="error-message">{ai.causeAnalysis.error}</p>
            </div>
          )}
        </div>

        <style jsx>{`
          .conversation-history {
            margin-bottom: 0;
            max-height: 300px;
            overflow-y: auto;
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 0.25rem;
            padding-top: 0.5rem;
          }

          .message {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
            min-height: 3rem;
          }

          .message.ai-message {
            background: var(--bg-secondary);
            border-left: 3px solid var(--golden-mustard);
            margin-top: 0.5rem;
          }

          .message.user-message {
            background: var(--refined-balance-teal-light);
            border-left: 3px solid var(--refined-balance-teal);
            margin-left: 2rem;
          }

          .message .brain-icon-container {
            flex-shrink: 0;
            min-height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .message .brain-icon {
            color: var(--refined-balance-teal);
          }

          .message p {
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.4;
            color: var(--text-primary);
            flex: 1;
          }

          .message .user-text {
            font-style: italic;
            color: var(--text-secondary);
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

          .generate-button {
            background: var(--bg-primary);
            border: 1px solid var(--border-medium);
            color: var(--text-primary);
            font-size: 0.9rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
          }

          .generate-button:hover:not(:disabled) {
            border-color: var(--golden-mustard);
            background: var(--golden-mustard-focus);
            transform: translateY(-1px);
          }

          .generate-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .skip-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .skip-modal {
            background: var(--bg-primary);
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border-medium);
          }

          .skip-modal h3 {
            margin: 0 0 1rem 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            text-align: center;
          }

          .skip-modal p {
            margin: 0 0 1rem 0;
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--text-primary);
            text-align: center;
          }

          .skip-modal p:last-of-type {
            margin-bottom: 2rem;
          }

          .skip-modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .keep-answering-button {
            background: var(--refined-balance-teal);
            color: white;
            border: none;
            font-size: 0.95rem;
            font-weight: 600;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .keep-answering-button:hover {
            background: var(--refined-balance-teal-dark);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(64, 162, 156, 0.3);
          }

          .skip-ahead-button {
            background: transparent;
            color: var(--text-secondary);
            border: 1px solid var(--border-medium);
            font-size: 0.95rem;
            font-weight: 500;
            padding: 0.875rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .skip-ahead-button:hover {
            border-color: var(--text-secondary);
            color: var(--text-primary);
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

          .secondary-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
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

          .tertiary {
            background: transparent;
            color: rgba(156, 163, 175, 0.9);
            border: 1px solid rgba(156, 163, 175, 0.4);
            font-size: 0.85rem;
            font-weight: 400;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .tertiary:hover:not(:disabled) {
            color: var(--text-primary);
            background: var(--bg-secondary);
            border-color: rgba(156, 163, 175, 0.5);
          }

          .tertiary:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .root-cause-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1.5rem;
          }
        `}</style>
      </div>
    </div>
  );
}