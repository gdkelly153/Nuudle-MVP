'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../../daily-riddle/DailyRiddle.module.css';
import { VoiceProvider, useVoice } from '../../../../contexts/VoiceContext';
import VoiceControls from '../../../../components/VoiceControls';
import ConversationHistory from '../../../../components/ConversationHistory';
import AudioVisualizer from '../../../../components/AudioVisualizer';

interface Checkpoint {
  narrative: string;
  options: Record<string, string>;
}

const ScenarioSession: React.FC = () => {
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const { id: sessionId } = params;
  const { playNarration, isPlaying, isListening, startListening, stopListening, stopNarration } = useVoice();

  useEffect(() => {
    const fetchInitialCheckpoint = async () => {
      setIsLoading(false);
      const initialCheckpoint = {
        narrative: "The anomaly flashes across your screen, a wave of impossible data. Your heart pounds. This could be everything you've worked for, or it could be a catastrophic failure.",
        options: {
          "A": "Immediately isolate the quantum processor to prevent potential damage.",
          "B": "Run a deep diagnostic to understand the anomaly's source.",
          "C": "Push more power to the processor to amplify the signal and gather more data."
        }
      };
      setCheckpoint(initialCheckpoint);
      await playNarration(initialCheckpoint.narrative, 'james-professional-guide', 'questioning');
    };

    fetchInitialCheckpoint();
  }, [sessionId, playNarration]);

  const handleDecision = async (decision: string) => {
    console.log(`Decision made: ${decision}`);
    const nextCheckpoint = {
      narrative: `You chose to ${decision}. The system is now responding...`,
      options: {
        "X": "Analyze the response.",
        "Y": "Prepare for the consequences."
      }
    };
    setCheckpoint(nextCheckpoint);
    await playNarration(nextCheckpoint.narrative, 'james-professional-guide', 'supportive');
  };

  if (isLoading) {
    return <div className={styles.container}><p>Loading session...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p>Error: {error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <ConversationHistory messages={[{ speaker: 'ai', content: checkpoint?.narrative || '' }]} />
      <div className={styles.options}>
        {checkpoint && Object.entries(checkpoint.options).map(([key, value]) => (
          <button key={key} onClick={() => handleDecision(value)} className={styles.button}>
            {value}
          </button>
        ))}
      </div>
      <AudioVisualizer audioStream={null} isActive={isListening} />
      <VoiceControls
        isListening={isListening}
        isSpeaking={isPlaying}
        onStartListening={startListening}
        onStopListening={stopListening}
        onStopSpeaking={stopNarration}
      />
    </div>
  );
};

const ScenarioSessionPage: React.FC = () => (
  <VoiceProvider>
    <ScenarioSession />
  </VoiceProvider>
);

export default ScenarioSessionPage;