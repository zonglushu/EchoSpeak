
export interface TranscriptLine {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  notation?: string;
  isGenerating?: boolean;
}

export interface MediaAsset {
  id: string;
  name: string;
  blob: Blob;
  transcript: TranscriptLine[];
  timestamp: number;
}

export interface NotationGuide {
  symbol: string;
  description: string;
  example: string;
  color: string;
}

export enum PlaybackState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING'
}
