"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from '@/contexts/SessionContext';

const ProblemSolverHome = () => {
  const { startSession, isLoading } = useSession();

  return (
    <main className="wizard-container">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Problem Solver</h1>
        <p className="text-xl text-gray-600 mb-12">Choose your mode to begin.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
        <ModeCard
          title="Text-Based"
          description="Engage in a guided, text-based session to break down your problems."
          onClick={() => startSession('problem-solver')}
          isLoading={isLoading}
        />
        <ModeCard
          title="Voice Mode"
          description="Talk through your problems in a conversational voice session."
          onClick={() => startSession('problem-solver-voice')}
        />
      </div>
    </main>
  );
};

interface ModeCardProps {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, onClick, disabled, isLoading }) => {
  const content = (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`p-6 rounded-lg shadow-lg h-full flex flex-col ${
        disabled
          ? 'bg-gray-200 cursor-not-allowed'
          : 'bg-white hover:shadow-xl transition-shadow cursor-pointer'
      }`}
    >
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-700 flex-grow">{description}</p>
      {!disabled && (
        <div className="mt-4">
          <button className="landing-button" disabled={isLoading}>
            {isLoading ? 'Starting...' : 'Begin Session'}
          </button>
        </div>
      )}
      {disabled && (
        <div className="mt-4">
          <span className="text-sm text-gray-500">Coming Soon</span>
        </div>
      )}
    </div>
  );

  if (disabled) {
    return content;
  }

  return content;
};

export default ProblemSolverHome;