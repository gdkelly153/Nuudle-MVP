'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import styles from '../daily-riddle/DailyRiddle.module.css';

interface DailyScenario {
  id: string;
  title: string;
  briefing: string;
}

const DailyScenarioPage: React.FC = () => {
  const [scenario, setScenario] = useState<DailyScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startSession, isLoading: isSessionLoading } = useSession();

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const response = await fetch('/api/v1/scenarios/daily');
        if (!response.ok) {
          throw new Error('Failed to fetch daily scenario');
        }
        const data = await response.json();
        setScenario(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchScenario();
  }, []);

  const handleBegin = async () => {
    if (scenario) {
      await startSession('daily-scenario', { scenario_id: scenario.id });
    }
  };

  if (isLoading) {
    return <div className={styles.container}><p>Loading scenario...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p>Error: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{scenario?.title}</h1>
      <p className={styles.briefing}>{scenario?.briefing}</p>
      <button
        onClick={handleBegin}
        className={styles.button}
        disabled={isSessionLoading}
      >
        {isSessionLoading ? 'Starting...' : 'Begin Scenario'}
      </button>
    </div>
  );
};

export default DailyScenarioPage;