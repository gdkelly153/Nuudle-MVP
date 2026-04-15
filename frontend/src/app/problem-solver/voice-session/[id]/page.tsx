'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { type SessionData } from '@/hooks/useSummaryDownloader';
import { VoiceProvider, useVoice } from '@/contexts/VoiceContext';
import VoiceControls from '@/components/VoiceControls';
import ConversationHistory from '@/components/ConversationHistory';
import AudioVisualizer from '@/components/AudioVisualizer';
import { AIAssistantProvider, useAIAssistant, ChatMessage } from '@/contexts/AIAssistantContext';

type ConversationStep =
  | 'articulating_problem'
  | 'exploring_causes'
  | 'self_awareness'
  | 'developing_solutions'
  | 'exploring_fears'
  | 'selecting_action'
  | 'session_complete';

const VoiceSessionWizard: React.FC = () => {
  const { id: sessionId } = useParams();
  const ai = useAIAssistant();
  const { playNarration, isPlaying, isListening, startListening, stopListening, stopNarration, audioStream } = useVoice();
  const [sessionData, setSessionData] = useState<SessionData>({
    pain_point: '',
    causes: [],
    assumptions: [],
    perpetuations: [],
    solutions: [],
    fears: [],
    action_plan: '',
  });
  const [currentStep, setCurrentStep] = useState<ConversationStep>('articulating_problem');
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [isOffTrack, setIsOffTrack] = useState(false);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!hasPlayedGreeting) {
      const initialGreeting = "Welcome to the voice-driven Problem Solver. Let's start by articulating the problem you're facing. What's on your mind?";
      setConversationHistory([{ sender: 'ai', text: initialGreeting }]);
      playNarration(initialGreeting, 'sarah-warm-coach', 'encouraging');
      setHasPlayedGreeting(true);
    }
  }, [hasPlayedGreeting, playNarration]);

  useEffect(() => {
    const aiResponse = ai.getCurrentResponse();
    if (aiResponse && conversationHistory.length > 0 && conversationHistory[conversationHistory.length - 1]?.sender === 'user') {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage.text !== aiResponse) {
        setConversationHistory(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        playNarration(aiResponse, 'sarah-warm-coach', 'supportive');
      }
    }
  }, [ai.responses, conversationHistory, playNarration]);

  const processConversationStep = async (history: ChatMessage[]) => {
    const userResponse = history[history.length - 1].text;
    const context = {
      sessionData,
      conversationHistory: history,
    };

    if (userResponse.toLowerCase().includes("tell me a joke")) {
      setIsOffTrack(true);
      await ai.requestAssistance('voice_off_track_management', userResponse, context);
      return;
    }

    setIsOffTrack(false);

    switch (currentStep) {
      case 'articulating_problem':
        await ai.requestAssistance('voice_problem_articulation', userResponse, context);
        setSessionData(prev => ({ ...prev, pain_point: userResponse }));
        setCurrentStep('exploring_causes');
        break;
      // ... other cases
    }
  };

  const handleUserInput = (text: string) => {
    const newHistory: ChatMessage[] = [...conversationHistory, { sender: 'user', text: text }];
    setConversationHistory(newHistory);
    processConversationStep(newHistory);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white font-sans">
      <header className="bg-gray-900 p-4 shadow-lg z-10">
        <h1 className="text-xl md:text-2xl font-bold text-center">Voice Problem Solver</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        {currentStep === 'session_complete' ? (
          <div className="p-4 bg-gray-700 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold mb-4 text-center">Session Summary</h2>
            <pre className="whitespace-pre-wrap bg-gray-800 p-4 rounded-md text-sm">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </div>
        ) : (
          <ConversationHistory messages={conversationHistory.map(h => ({ speaker: h.sender, content: h.text }))} />
        )}
      </main>

      <footer className="bg-gray-900 p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto">
          <AudioVisualizer audioStream={audioStream} isActive={isListening} />
          <div className="mt-4">
            <VoiceControls
              isListening={isListening}
              isSpeaking={isPlaying}
              onStartListening={() => {
                stopNarration();
                startListening(handleUserInput);
              }}
              onStopListening={stopListening}
              onStopSpeaking={stopNarration}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

const VoiceSessionPage: React.FC = () => {
  const { id } = useParams();
  const sessionId = typeof id === 'string' ? id : '';

  return (
    <AIAssistantProvider sessionId={sessionId}>
      <VoiceProvider>
        <VoiceSessionWizard />
      </VoiceProvider>
    </AIAssistantProvider>
  );
};

export default VoiceSessionPage;