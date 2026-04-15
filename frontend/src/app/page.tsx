"use client";

import React from 'react';
import Link from 'next/link';

const Home = () => {
  return (
    <main className="wizard-container">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to Nuudle</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <ModuleCard
          title="Problem Solver"
          description="Work through complex problems and find actionable solutions."
          link="/problem-solver"
        />
        <ModuleCard
          title="Daily Riddle"
          description="Engage your mind with a daily riddle to sharpen your critical thinking."
          link="/daily-riddle"
        />
        <ModuleCard
          title="Daily Puzzle"
          description="Challenge your mind with creative puzzles that require thinking outside the box."
          link="/lateral-thinking-puzzles"
        />
        <ModuleCard
          title="Daily Scenario"
          description="Explore hypothetical scenarios to practice your decision-making skills."
          link="/daily-scenario"
        />
      </div>
    </main>
  );
};

interface ModuleCardProps {
  title: string;
  description: string;
  link: string;
  disabled?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, link, disabled }) => {
  const content = (
    <div
      className={`p-6 rounded-lg shadow-lg h-full flex flex-col ${
        disabled
          ? 'bg-gray-200 cursor-not-allowed'
          : 'bg-white hover:shadow-xl transition-shadow'
      }`}
    >
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-700 flex-grow">{description}</p>
      {!disabled && (
        <div className="mt-4">
          <button className="landing-button">
            Launch
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

  return (
    <Link href={link} passHref>
      {content}
    </Link>
  );
};

export default Home;
