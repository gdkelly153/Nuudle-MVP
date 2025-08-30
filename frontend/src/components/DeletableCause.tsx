"use client";

import React, { useEffect, useRef } from 'react';

interface DeletableCauseProps {
  text: string;
  isRootCause?: boolean;
  onDelete: () => void;
  onConvertToRootCause: () => void;
  hideRootCauseButton?: boolean;
}

export function DeletableCause({ text, isRootCause, onDelete, onConvertToRootCause, hideRootCauseButton = false }: DeletableCauseProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <div className="deletable-cause-container">
      {isRootCause && <div className="root-cause-badge">Root Cause Found</div>}
      <textarea
        ref={textareaRef}
        className="cause-textarea"
        value={text}
        readOnly
      />
      <button
        type="button"
        className="delete-cause-button"
        onClick={onDelete}
        aria-label="Remove selection"
      >
        &times;
      </button>
      {!isRootCause && !hideRootCauseButton && (
        <button
          type="button"
          className="convert-cause-button"
          onClick={onConvertToRootCause}
          aria-label="Convert to Root Cause"
        >
          Find Root Cause
        </button>
      )}
      <style jsx>{`
        .deletable-cause-container {
          position: relative;
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .root-cause-badge {
          position: absolute;
          top: 0.5rem;
          right: 2.5rem;
          z-index: 1;
          background: var(--golden-mustard);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
        }
        .cause-textarea {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: 1px solid var(--refined-balance-teal);
          border-radius: 12px;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.5;
          resize: none;
          overflow: hidden;
          box-sizing: border-box;
          min-height: 50px;
        }
        .delete-cause-button {
          position: absolute;
          top: 0;
          right: 0;
          transform: translate(25%, -50%);
          background: var(--warm-brick);
          border: 1px solid var(--warm-brick-hover);
          border-radius: 50%;
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          color: white;
          padding: 2px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: monospace;
          transition: all 0.2s ease;
          z-index: 10;
        }
        .delete-cause-button:hover {
          background: var(--warm-brick-hover);
          transform: translate(25%, -50%) translateY(-1px);
          box-shadow: 0 2px 4px rgba(205, 101, 71, 0.3);
        }
        .convert-cause-button {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          background: var(--golden-mustard);
          border: 1px solid var(--golden-mustard-dark);
          border-radius: 8px;
          font-size: 0.8rem;
          line-height: 1;
          cursor: pointer;
          color: white;
          padding: 0.25rem 0.5rem;
          transition: all 0.2s ease;
          z-index: 10;
        }
        .convert-cause-button:hover {
          background: var(--golden-mustard-dark);
        }
      `}</style>
    </div>
  );
}