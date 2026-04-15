'use client';

import React,
{
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode
} from 'react';
import { voiceService } from '@/services/VoiceService';

type PersonalityId = 'sarah-warm-coach' | 'james-professional-guide';
type EmotionalContext = 'encouraging' | 'questioning' | 'supportive' | 'celebratory';

interface VoiceContextType {
  isPlaying: boolean;
  isListening: boolean;
  audioStream: MediaStream | null;
  playNarration: (text: string, personalityId: PersonalityId, emotionalContext: EmotionalContext) => Promise<void>;
  stopNarration: () => void;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNarration = async (text: string, personalityId: PersonalityId, emotionalContext: EmotionalContext) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(true);

    try {
      const audioBlob = await voiceService.synthesizeWithPersonality(text, personalityId, emotionalContext);
      if (audioBlob && audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Failed to play narration:", error);
      setIsPlaying(false);
    }
  };

  const stopNarration = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const startListening = async (onResult: (text: string) => void) => {
    setIsListening(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("Speech recognition not supported in this browser.");
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        stopListening();
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    setAudioStream(null);
    setIsListening(false);
  };

  return (
    <VoiceContext.Provider value={{ isPlaying, isListening, audioStream, playNarration, stopNarration, startListening, stopListening }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};