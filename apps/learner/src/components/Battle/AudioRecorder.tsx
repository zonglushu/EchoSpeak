/**
 * Audio Recorder Component
 *
 * Provides a hold-to-record button with real-time:
 * - Speech recognition (transcription)
 * - Volume visualization
 * - Audio recording for playback
 *
 * Integrates both Web Speech API and Web Audio API.
 *
 * @module components/Battle/AudioRecorder
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import {
  createSpeechRecognitionService,
  type SpeechRecognitionService,
  type SpeechRecognitionResult,
  isSpeechRecognitionSupported,
} from '../../services/speechRecognitionService';
import {
  createAudioService,
  type AudioService,
  type AudioRecording,
} from '../../services/audioService';

export interface AudioRecorderProps {
  /** Callback fired when final transcript is available */
  onTranscript: (transcript: string, recording?: AudioRecording) => void;
  /** Maximum recording duration in milliseconds (default: 30000ms) */
  maxLength?: number;
  /** Language for speech recognition (default: 'en-US') */
  language?: 'zh-CN' | 'en-US' | 'en-GB';
  /** Whether to show the interim (partial) transcript */
  showInterim?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Whether the recorder is disabled */
  disabled?: boolean;
}

export function AudioRecorder({
  onTranscript,
  maxLength = 30000,
  language = 'en-US',
  showInterim = true,
  className = '',
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const speechServiceRef = useRef<SpeechRecognitionService | null>(null);
  const audioServiceRef = useRef<AudioService | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Initialize services on mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setIsInitializing(true);

      try {
        // Check browser support
        if (!isSpeechRecognitionSupported()) {
          setError('您的浏览器不支持语音识别。请使用 Chrome、Edge 或 Safari。');
          setHasPermission(false);
          setIsInitializing(false);
          return;
        }

        // Initialize speech recognition
        const speechService = await createSpeechRecognitionService({ language });
        if (mounted) {
          speechServiceRef.current = speechService;
        }

        // Initialize audio service (don't check permission yet)
        const audioService = await createAudioService();
        if (mounted) {
          audioServiceRef.current = audioService;
          // Assume we have permission until proven otherwise
          setHasPermission(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize audio recorder:', err);
        if (mounted) {
          setError('初始化录音功能失败，请刷新页面重试。');
          setHasPermission(false);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      // Cleanup
      speechServiceRef.current?.dispose();
      audioServiceRef.current?.dispose();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language]);

  // Start recording
  const startRecording = async () => {
    if (!speechServiceRef.current || !audioServiceRef.current) {
      setError('录音服务未初始化，请刷新页面。');
      return;
    }

    if (disabled) return;

    try {
      setIsRecording(true);
      setError(null);
      setInterimTranscript('');

      // Start microphone and audio recording
      await audioServiceRef.current.startMicrophone();
      await audioServiceRef.current.startRecording();

      // Start volume monitoring
      audioServiceRef.current.startVolumeMonitoring((vol) => {
        setVolume(vol);
      });

      // Start speech recognition
      speechServiceRef.current.startListening(
        (result: SpeechRecognitionResult) => {
          if (result.isFinal) {
            stopRecording(result.transcript);
          }
        },
        (errorMsg: string) => {
          setError(errorMsg);
          stopRecording('');
        },
        (interim: string) => {
          setInterimTranscript(interim);
        }
      );

      // Auto-stop after maxLength
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        stopRecording(interimTranscript);
      }, maxLength);
    } catch (err: any) {
      console.error('Failed to start recording:', err);

      // Check if it's a permission error
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setError('请允许麦克风权限以使用录音功能。');
        setHasPermission(false);
      } else {
        setError('启动录音失败，请重试。');
      }
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = async (finalTranscript?: string) => {
    if (!speechServiceRef.current || !audioServiceRef.current) return;

    // Prevent duplicate calls
    if (!isRecording) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      setIsRecording(false); // Set immediately to prevent duplicate calls

      // Stop speech recognition
      speechServiceRef.current.stopListening();

      // Stop audio recording (may already be stopped, so wrap in try-catch)
      let recording: AudioRecording | undefined;
      try {
        recording = await audioServiceRef.current.stopRecording();
      } catch (err) {
        console.warn('Recording already stopped or failed:', err);
      }

      // Cleanup microphone and monitoring
      try {
        audioServiceRef.current.stopMicrophone();
        audioServiceRef.current.stopVolumeMonitoring();
      } catch (err) {
        console.warn('Cleanup warning:', err);
      }

      // Use provided transcript or fall back to interim
      const transcript = finalTranscript || interimTranscript;

      setVolume(0);
      setInterimTranscript('');

      // Fire callback with transcript and recording
      if (transcript.trim()) {
        onTranscript(transcript.trim(), recording);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
      setVolume(0);
      setInterimTranscript('');
    }
  };

  // Mouse/touch event handlers
  const handleMouseDown = () => {
    if (!isRecording) {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const handleMouseLeave = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRecording) {
      startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isRecording) {
      stopRecording();
    }
  };

  // Don't render if not supported
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  return (
    <div className={`audio-recorder ${className}`}>
      <div className="flex items-center gap-4">
        {/* Record Button */}
        <button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={disabled || isInitializing}
          className={`
            relative p-4 rounded-full transition-all shadow-lg
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
              : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white'
            }
            ${disabled || isInitializing || hasPermission === false
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:scale-105'
            }
          `}
        >
          {isInitializing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isRecording ? (
            <>
              <Mic className="w-6 h-6" />
              <motion.span
                className="absolute inset-0 rounded-full bg-red-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </>
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        {/* Volume Meter & Interim Transcript */}
        <div className="flex-1">
          {/* Volume Meter */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-2"
            >
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${volume * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}

          {/* Interim Transcript */}
          {(showInterim || interimTranscript) && (
            <div className="min-h-[24px]">
              {interimTranscript ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {interimTranscript}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {isRecording ? '正在录音...' : '按住说话'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-red-500 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Recording Timer (optional) */}
      {isRecording && maxLength > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          最多 {Math.round(maxLength / 1000)} 秒
        </div>
      )}
    </div>
  );
}
