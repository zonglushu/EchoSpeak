/**
 * Speech Recognition Service - Web Speech API wrapper
 *
 * Provides speech-to-text functionality using the browser's Web Speech API.
 * Handles browser compatibility, permissions, and error cases gracefully.
 *
 * @module services/speechRecognitionService
 */

import { logError, ServiceError } from './errors';

/**
 * Custom error class for speech recognition operations.
 */
export class SpeechRecognitionError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'SPEECH_RECOGNITION_ERROR', cause, false);
  }
}

/**
 * Speech recognition configuration options
 */
export interface SpeechRecognitionConfig {
  language: 'zh-CN' | 'en-US' | 'en-GB' | 'ja-JP' | 'ko-KR';
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

/**
 * Default configuration for speech recognition
 */
const DEFAULT_CONFIG: SpeechRecognitionConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
};

/**
 * Result callback type for speech recognition
 */
export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  alternatives?: Array<{ transcript: string; confidence: number }>;
}

/**
 * Checks if the browser supports speech recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Gets the SpeechRecognition constructor with browser prefix handling
 */
function getSpeechRecognitionConstructor(): typeof SpeechRecognition | null {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

/**
 * Speech Recognition Service class
 */
export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private config: SpeechRecognitionConfig;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onInterimCallback?: (interim: string) => void;
  private interimTranscript: string = '';

  constructor(config?: Partial<SpeechRecognitionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initializes the speech recognition engine
   *
   * @throws {SpeechRecognitionError} If browser doesn't support speech recognition
   */
  async initialize(): Promise<void> {
    if (!isSpeechRecognitionSupported()) {
      throw new SpeechRecognitionError(
        'Browser does not support speech recognition. Please use Chrome, Edge, or Safari.'
      );
    }

    const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionConstructor) {
      throw new SpeechRecognitionError('Failed to initialize speech recognition');
    }

    this.recognition = new SpeechRecognitionConstructor();
    this.setupRecognitionHandlers();
  }

  /**
   * Sets up event handlers for the recognition instance
   */
  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.interimTranscript = '';
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // If we still have interim results, fire a final result
      if (this.interimTranscript && this.onResultCallback) {
        this.onResultCallback({
          transcript: this.interimTranscript,
          isFinal: true,
          confidence: 0.5,
        });
        this.interimTranscript = '';
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Store interim for later use
      if (interimTranscript) {
        this.interimTranscript = interimTranscript;
        if (this.onInterimCallback) {
          this.onInterimCallback(interimTranscript);
        }
      }

      // Fire callback with results
      if (finalTranscript && this.onResultCallback) {
        const result: SpeechRecognitionResult = {
          transcript: finalTranscript,
          isFinal: true,
          confidence: event.results[event.results.length - 1][0].confidence || 0.5,
        };

        // Add alternatives if available
        if (event.results[event.results.length - 1].length > 1) {
          result.alternatives = Array.from(event.results[event.results.length - 1])
            .slice(1)
            .map(alt => ({
              transcript: alt.transcript,
              confidence: alt.confidence || 0,
            }));
        }

        this.onResultCallback(result);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      this.handleError(event.error);
    };
  }

  /**
   * Handles speech recognition errors
   */
  private handleError(error: string): void {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found. Please check your microphone.',
      'not-allowed': 'Microphone permission denied. Please allow microphone access.',
      'network': 'Network error. Please check your internet connection.',
      'aborted': 'Speech recognition was aborted.',
      'language-not-supported': 'Language not supported. Using default language.',
    };

    const message = errorMessages[error] || `Speech recognition error: ${error}`;

    if (this.onErrorCallback) {
      this.onErrorCallback(message);
    }

    if (error === 'not-allowed') {
      logError(new SpeechRecognitionError(message), 'speechRecognitionService.handleError');
    }
  }

  /**
   * Starts listening for speech input
   *
   * @param onResult - Callback fired when speech is recognized
   * @param onError - Callback fired when an error occurs
   * @param onInterim - Callback fired with interim results (optional)
   */
  startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onInterim?: (interim: string) => void
  ): void {
    if (!this.recognition) {
      onError('Speech recognition not initialized. Call initialize() first.');
      return;
    }

    if (this.isListening) {
      return; // Already listening
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onInterimCallback = onInterim;

    try {
      // Configure recognition
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;

      // Start listening
      this.recognition.start();
    } catch (error) {
      logError(error, 'speechRecognitionService.startListening');
      onError('Failed to start speech recognition. Please try again.');
    }
  }

  /**
   * Stops listening for speech input
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        logError(error, 'speechRecognitionService.stopListening');
      }
    }
  }

  /**
   * Aborts the current recognition session immediately
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (error) {
        logError(error, 'speechRecognitionService.abort');
      }
    }
  }

  /**
   * Updates the language setting
   */
  setLanguage(language: SpeechRecognitionConfig['language']): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Gets the current listening state
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    this.abort();
    this.recognition = null;
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onInterimCallback = undefined;
  }
}

/**
 * Factory function to create a speech recognition service instance
 *
 * @param config - Optional configuration overrides
 * @returns A new SpeechRecognitionService instance
 */
export async function createSpeechRecognitionService(
  config?: Partial<SpeechRecognitionConfig>
): Promise<SpeechRecognitionService> {
  const service = new SpeechRecognitionService(config);
  await service.initialize();
  return service;
}
