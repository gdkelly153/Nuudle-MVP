import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';

export interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onStopSpeaking,
}) => {
  const { stopListening, stopNarration } = useVoice();

  const handleToggleListening = () => {
    if (isListening) {
      onStopListening();
      stopListening();
    } else {
      onStartListening();
    }
  };

  const handleStopSpeaking = () => {
    onStopSpeaking();
    stopNarration();
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      <button
        onClick={handleToggleListening}
        className={`p-4 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
          isListening
            ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      <button
        onClick={handleStopSpeaking}
        disabled={!isSpeaking}
        className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
        aria-label="Stop speaking"
      >
        <Square size={24} />
      </button>
    </div>
  );
};

export default VoiceControls;