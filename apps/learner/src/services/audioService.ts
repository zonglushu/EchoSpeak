/**
 * Audio Service - Web Audio API wrapper for audio processing
 *
 * Provides audio recording, analysis, and visualization capabilities.
 * Handles microphone access, audio buffer analysis, and feature extraction.
 *
 * @module services/audioService
 */

import { logError, ServiceError } from './errors';

/**
 * Custom error class for audio service operations.
 */
export class AudioServiceError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'AUDIO_SERVICE_ERROR', cause, false);
  }
}

/**
 * Audio analysis result with various acoustic features
 */
export interface AudioAnalysisResult {
  volume: number;           // RMS amplitude (0-1)
  maxVolume: number;        // Peak amplitude (0-1)
  averageVolume: number;    // Average amplitude over the entire buffer
  duration: number;         // Duration in seconds
  sampleRate: number;       // Sample rate in Hz
}

/**
 * Pitch analysis result
 */
export interface PitchAnalysisResult {
  pitch: number;            // Fundamental frequency in Hz
  confidence: number;       // Confidence score (0-1)
  averagePitch: number;     // Average pitch over the buffer
  pitchRange: number;       // Min to max pitch range in Hz
}

/**
 * Recording configuration options
 */
export interface RecordingConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

/**
 * Default recording configuration
 */
const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  sampleRate: 44100,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * Audio recording state
 */
export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
  buffer?: AudioBuffer;
}

/**
 * Audio Service class
 */
export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private volumeCallback?: (volume: number) => void;
  private volumeIntervalId: number | null = null;

  /**
   * Initializes the audio context
   */
  async initialize(): Promise<void> {
    if (this.audioContext) {
      return; // Already initialized
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
    } catch (error) {
      logError(error, 'audioService.initialize');
      throw new AudioServiceError('Failed to initialize audio context', error);
    }
  }

  /**
   * Checks if microphone access is available
   */
  async checkMicrophoneAccess(): Promise<boolean> {
    try {
      // Try to get permission status
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return permissionStatus.state === 'granted';
    } catch {
      // If permissions API is not supported, try to get media stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Requests microphone access and starts the audio stream
   *
   * @param config - Optional recording configuration
   */
  async startMicrophone(config?: Partial<RecordingConfig>): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: config?.sampleRate || DEFAULT_RECORDING_CONFIG.sampleRate,
          channelCount: config?.channelCount || DEFAULT_RECORDING_CONFIG.channelCount,
          echoCancellation: config?.echoCancellation ?? DEFAULT_RECORDING_CONFIG.echoCancellation,
          noiseSuppression: config?.noiseSuppression ?? DEFAULT_RECORDING_CONFIG.noiseSuppression,
          autoGainControl: config?.autoGainControl ?? DEFAULT_RECORDING_CONFIG.autoGainControl,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.audioContext || !this.analyser) {
        throw new AudioServiceError('Audio context not initialized');
      }

      // Connect microphone to analyser
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      logError(error, 'audioService.startMicrophone');
      throw new AudioServiceError(
        'Failed to access microphone. Please allow microphone permissions.',
        error
      );
    }
  }

  /**
   * Starts audio recording
   */
  async startRecording(): Promise<void> {
    if (!this.mediaStream) {
      throw new AudioServiceError('Microphone not started. Call startMicrophone() first.');
    }

    try {
      // Check supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new AudioServiceError('No supported MIME type found for MediaRecorder');
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });

      this.audioChunks = [];
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      logError(error, 'audioService.startRecording');
      throw new AudioServiceError('Failed to start recording', error);
    }
  }

  /**
   * Stops audio recording and returns the recording
   */
  async stopRecording(): Promise<AudioRecording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new AudioServiceError('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const duration = (Date.now() - this.recordingStartTime) / 1000;

          // Optionally decode audio for analysis
          let buffer: AudioBuffer | undefined;
          if (this.audioContext) {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              buffer = await this.audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
              logError(error, 'audioService.stopRecording - decodeAudioData');
              // Continue without buffer - analysis won't be available
            }
          }

          resolve({
            blob,
            url,
            duration,
            buffer,
          });
        } catch (error) {
          reject(new AudioServiceError('Failed to process recording', error));
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Stops the microphone stream
   */
  stopMicrophone(): void {
    if (this.volumeIntervalId !== null) {
      clearInterval(this.volumeIntervalId);
      this.volumeIntervalId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Starts monitoring volume levels
   */
  startVolumeMonitoring(callback: (volume: number) => void, interval: number = 50): void {
    if (!this.analyser) {
      throw new AudioServiceError('Analyser not initialized');
    }

    this.volumeCallback = callback;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.volumeIntervalId = window.setInterval(() => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedVolume = average / 255; // Normalize to 0-1

      if (this.volumeCallback) {
        this.volumeCallback(normalizedVolume);
      }
    }, interval);
  }

  /**
   * Stops volume monitoring
   */
  stopVolumeMonitoring(): void {
    if (this.volumeIntervalId !== null) {
      clearInterval(this.volumeIntervalId);
      this.volumeIntervalId = null;
    }
    this.volumeCallback = undefined;
  }

  /**
   * Analyzes an audio buffer for various features
   */
  async analyzeAudio(buffer: AudioBuffer): Promise<AudioAnalysisResult> {
    if (!buffer) {
      throw new AudioServiceError('No audio buffer provided');
    }

    try {
      const channelData = buffer.getChannelData(0); // Use first channel
      const sampleRate = buffer.sampleRate;

      // Calculate RMS (root mean square) for volume
      let sumSquares = 0;
      let maxAmplitude = 0;

      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.abs(channelData[i]);
        sumSquares += sample * sample;
        if (sample > maxAmplitude) {
          maxAmplitude = sample;
        }
      }

      const rms = Math.sqrt(sumSquares / channelData.length);
      const duration = buffer.duration;

      return {
        volume: rms,
        maxVolume: maxAmplitude,
        averageVolume: rms,
        duration,
        sampleRate,
      };
    } catch (error) {
      logError(error, 'audioService.analyzeAudio');
      throw new AudioServiceError('Failed to analyze audio', error);
    }
  }

  /**
   * Detects pitch from audio buffer using autocorrelation
   * This is a simplified pitch detection algorithm
   */
  detectPitch(buffer: AudioBuffer): PitchAnalysisResult {
    if (!buffer) {
      throw new AudioServiceError('No audio buffer provided');
    }

    try {
      const channelData = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;

      // Use autocorrelation for pitch detection
      const correlations: number[] = [];
      const maxPeriod = Math.floor(sampleRate / 80); // Minimum 80Hz
      const minPeriod = Math.floor(sampleRate / 500); // Maximum 500Hz

      for (let lag = minPeriod; lag < maxPeriod; lag++) {
        let correlation = 0;
        for (let i = 0; i < channelData.length - lag; i++) {
          correlation += channelData[i] * channelData[i + lag];
        }
        correlations.push(correlation);
      }

      // Find the peak correlation
      let maxCorrelation = 0;
      let bestPeriod = minPeriod;

      for (let i = 0; i < correlations.length; i++) {
        if (correlations[i] > maxCorrelation) {
          maxCorrelation = correlations[i];
          bestPeriod = minPeriod + i;
        }
      }

      const pitch = sampleRate / bestPeriod;
      const confidence = maxCorrelation / correlations.length;

      return {
        pitch,
        confidence,
        averagePitch: pitch, // Simplified - use single value
        pitchRange: 0, // Would need multiple frames for range
      };
    } catch (error) {
      logError(error, 'audioService.detectPitch');
      throw new AudioServiceError('Failed to detect pitch', error);
    }
  }

  /**
   * Gets the current audio context state
   */
  getAudioContextState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    this.stopVolumeMonitoring();
    this.stopMicrophone();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.analyser = null;
    this.mediaRecorder = null;
  }
}

/**
 * Factory function to create an audio service instance
 */
export async function createAudioService(): Promise<AudioService> {
  const service = new AudioService();
  await service.initialize();
  return service;
}
