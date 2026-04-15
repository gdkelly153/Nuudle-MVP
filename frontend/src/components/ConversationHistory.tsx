import React, { useEffect, useRef } from 'react';

interface ConversationTurn {
  speaker: 'user' | 'ai';
  content: string;
}

export interface ConversationHistoryProps {
  messages: ConversationTurn[];
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4 p-4">
      {messages.map((turn, index) => (
        <div
          key={index}
          className={`flex items-end gap-2 ${
            turn.speaker === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
              turn.speaker === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{turn.content}</p>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationHistory;