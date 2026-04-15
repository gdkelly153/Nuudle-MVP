// Voice service with three-tier fallback

// Define interfaces for services and results
interface ElevenLabsService {
  synthesize(text: string, personalityId: string): Promise<Blob>;
}

interface AzureCognitiveService {
  synthesize(text: string, personalityId: string): Promise<Blob>;
}

interface WebSpeechService {
  synthesize(text: string, personalityId: string): Promise<Blob>;
}

interface VoiceServiceConfig {
  primary: ElevenLabsService;
  fallback: AzureCognitiveService;
  ultimate: WebSpeechService;
}

type PersonalityId = 'sarah-warm-coach' | 'james-professional-guide';
type EmotionalContext = 'encouraging' | 'questioning' | 'supportive' | 'celebratory';

interface TranscriptionResult {
  text: string;
  confidence: number;
}

interface ConversationTurn {
  speaker: 'user' | 'ai';
  content: string;
}

// Placeholder implementations for the voice services
const elevenLabsService: ElevenLabsService = {
  async synthesize(text: string, personalityId: string): Promise<Blob> {
    throw new Error("Simulating ElevenLabs failure.");
  }
};

const azureCognitiveService: AzureCognitiveService = {
  async synthesize(text: string, personalityId: string): Promise<Blob> {
    console.log("Azure Cognitive Services not implemented yet.");
    throw new Error("Azure Cognitive Services not implemented.");
  }
};

const webSpeechService: WebSpeechService = {
  async synthesize(text: string, personalityId: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return reject(new Error("Web Speech API not supported."));
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Basic personality mapping
      if (personalityId === 'sarah-warm-coach') {
        const femaleVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'));
        utterance.voice = femaleVoice || voices[0];
      } else {
        const maleVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Male'));
        utterance.voice = maleVoice || voices[0];
      }

      utterance.onend = () => {
        // The Web Speech API doesn't directly provide a Blob.
        // This is a limitation we'll accept for the ultimate fallback.
        // We resolve with an empty Blob to satisfy the interface.
        resolve(new Blob());
      };

      utterance.onerror = (event) => {
        reject(new Error(`Web Speech API error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }
};

class VoiceService {
  private config: VoiceServiceConfig;
  private conversationHistory: ConversationTurn[] = [];
  private audioCache: Cache | null = null;

  constructor() {
    this.config = {
      primary: elevenLabsService,
      fallback: azureCognitiveService,
      ultimate: webSpeechService,
    };
  }

  private async initCache() {
    if (typeof window !== 'undefined' && 'caches' in window) {
      this.audioCache = await caches.open('audio-cache-v1');
    }
  }

  async synthesizeWithPersonality(
    text: string,
    personalityId: PersonalityId,
    emotionalContext: EmotionalContext
  ): Promise<Blob> {
    const cacheKey = `${personalityId}-${text}`;
    if (this.audioCache) {
      const cachedResponse = await this.audioCache.match(cacheKey);
      if (cachedResponse) {
        console.log("Serving from cache:", cacheKey);
        return cachedResponse.blob();
      }
    }

    try {
      const audioBlob = await this.config.primary.synthesize(text, personalityId);
      if (this.audioCache) {
        const responseToCache = new Response(audioBlob);
        await this.audioCache.put(cacheKey, responseToCache);
        console.log("Caching audio:", cacheKey);
      }
      return audioBlob;
    } catch (primaryError) {
      console.warn("Primary voice service failed:", primaryError);
      try {
        const audioBlob = await this.config.fallback.synthesize(text, personalityId);
        if (this.audioCache) {
          const responseToCache = new Response(audioBlob);
          await this.audioCache.put(cacheKey, responseToCache);
          console.log("Caching audio:", cacheKey);
        }
        return audioBlob;
      } catch (fallbackError) {
        console.warn("Fallback voice service failed:", fallbackError);
        return this.config.ultimate.synthesize(text, personalityId);
      }
    }
  }

  async transcribeSpeech(audioBlob: Blob): Promise<TranscriptionResult> {
    // Placeholder for speech-to-text implementation
    console.log("Speech transcription not implemented yet.");
    return { text: "Transcription result.", confidence: 0.95 };
  }

  addToConversation(speaker: 'user' | 'ai', content: string): void {
    this.conversationHistory.push({ speaker, content });
  }

  getConversationHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }
}

export const voiceService = new VoiceService();