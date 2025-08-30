"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { DeletableCause } from './DeletableCause';

interface ActionPlanSelectionProps {
  options: string[];
  selectedOptions: string[];
  customOption: string;
  onOptionSelect: (option: string) => void;
  onCustomOptionChange: (value: string) => void;
  onGenerateMore: () => void;
  isGenerating?: boolean;
  maxSelections?: number;
  generationCount?: number;
  maxGenerations?: number;
}

export function ActionPlanSelection({
  options,
  selectedOptions,
  customOption,
  onOptionSelect,
  onCustomOptionChange,
  onGenerateMore,
  isGenerating = false,
  maxSelections = 3,
  generationCount = 0,
  maxGenerations = 3,
}: ActionPlanSelectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [customOption]);

  const isSelectionLimitReached = selectedOptions.length >= maxSelections;
  const isGenerationLimitReached = generationCount >= maxGenerations;
  const canGenerateMore = !isGenerationLimitReached && !isSelectionLimitReached;

  const handleOptionClick = (option: string) => {
    if (!isSelectionLimitReached || selectedOptions.includes(option)) {
      onOptionSelect(option);
    }
  };

  const handleGenerateMore = () => {
    setHasGenerated(true);
    onGenerateMore();
  };

  return (
    <div className="root-cause-selection">
      <div className="selection-header">
        <h3>
          Choose the action that feels most doable.
          <span className="subtitle">
            (Select up to {maxSelections} if multiple feel right — {selectedOptions.length}/{maxSelections} selected)
          </span>
        </h3>
      </div>

      {selectedOptions.length > 0 && generationCount > 0 && (
        <div className="selected-options-section">
          <h4>Your Selections:</h4>
          <div className="selected-options-list">
            {selectedOptions.map((option, index) => (
              <DeletableCause
                key={index}
                text={option}
                isRootCause={false}
                onDelete={() => onOptionSelect(option)}
                onConvertToRootCause={() => {}}
                hideRootCauseButton={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {!isGenerating && (
        <div className="options-container">
          {options.map((option, index) => {
            const isSelected = selectedOptions.includes(option);
            const isDisabled = isSelectionLimitReached && !isSelected;
            
            return (
              <div
                key={index}
                className={`option-item ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option)}
                style={{
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {isSelected && (
                  <Check
                    className="checkmark-icon"
                  />
                )}
                <div className="root-cause-text">
                  {option}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="generate-more-container">
        {!isGenerationLimitReached && isSelectionLimitReached && (
          <div className="generation-info">
            <p className="limit-message">
              You've selected the maximum ({maxSelections}). Remove a selection to generate more options.
            </p>
          </div>
        )}
        
        <button
          type="button"
          onClick={handleGenerateMore}
          disabled={isGenerating || !canGenerateMore}
          className={`action-button ${isGenerating ? 'loading' : ''} ${!canGenerateMore ? 'disabled' : ''}`}
        >
          {isGenerating ? (
            <>
              <span className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Generating new actions...
            </>
          ) : isGenerationLimitReached ? (
            `Generation limit reached (${maxGenerations}/${maxGenerations})`
          ) : isSelectionLimitReached ? (
            'Remove a selection to generate more'
          ) : (
            `Generate More Actions (${maxGenerations - generationCount} remaining)`
          )}
        </button>
      </div>

      <div className="custom-option">
        <textarea
          ref={textareaRef}
          value={customOption}
          onChange={(e) => onCustomOptionChange(e.target.value)}
          placeholder="None of these feel right. I'll write my own."
          className="custom-textarea"
        />
      </div>


      <style jsx>{`
        .root-cause-selection {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .selection-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .selection-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.3;
        }
        .selection-header h3 .subtitle {
          display: block;
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .selection-count {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .selected-options-section {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .selected-options-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 500;
          color: var(--refined-balance-teal);
        }
        .selected-options-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .selected-option-item {
          padding: 0.75rem 1rem;
          background: var(--refined-balance-teal-light);
          border: 1px solid var(--refined-balance-teal);
          border-radius: 8px;
        }
        .selected-option-text {
          flex: 1;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .options-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .option-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 1.5rem;
          margin: 0;
          border: 1px solid var(--border-medium);
          border-radius: 16px;
          background: var(--bg-primary);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .option-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .option-item:hover:not(.disabled) {
          border-color: var(--golden-mustard);
          background: var(--golden-mustard-focus);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .option-item.selected {
          border-color: var(--refined-balance-teal);
          background: var(--refined-balance-teal-light);
        }
        .checkmark-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          color: var(--refined-balance-teal);
          z-index: 1;
        }
        .root-cause-text {
          text-align: center;
          font-size: 0.95rem;
          line-height: 1.4;
          color: var(--text-primary);
          font-weight: normal;
          width: 100%;
          padding: 0 1.5rem;
        }
        .option-item.disabled:hover {
          transform: none;
          box-shadow: none;
        }
        .generate-more-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          margin-top: 1.5rem;
        }
        .generation-info {
          text-align: center;
        }
        .generation-count {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .limit-message {
          font-size: 0.85rem;
          color: var(--golden-mustard);
          margin: 0;
          font-weight: 500;
        }
        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }
        .action-button.loading {
          opacity: 0.8;
        }
        .action-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-button.disabled:hover {
          transform: none;
          box-shadow: none;
        }
        .thinking-dots {
          display: flex;
          gap: 2px;
          align-items: center;
        }
        .thinking-dots span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--refined-balance-teal);
          animation: thinking-pulse 1.4s infinite ease-in-out both;
        }
        .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
        .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0s; }
        @keyframes thinking-pulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .custom-option {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .custom-textarea {
          width: 100%;
          min-height: 80px;
          max-height: 200px;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-medium);
          border-radius: 12px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.5;
          resize: none;
          overflow-y: hidden;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .custom-textarea:focus {
          outline: none;
          border-color: var(--golden-mustard);
          box-shadow: 0 0 0 3px var(--golden-mustard-focus);
        }
        .custom-submit-button {
          align-self: flex-end;
        }
        .confirm-container {
          display: flex;
          justify-content: center;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}