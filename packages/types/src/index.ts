export type TranscriptProductionStatus = 'pending' | 'ai_generating' | 'ready' | 'error';

export interface TranscriptLine {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  notation?: string;
  isGenerating?: boolean;
  lockState?: 'locked' | 'unlocked';
  status?: TranscriptProductionStatus;
}

export interface AdminTranscriptLine extends TranscriptLine {
  lockState: 'locked' | 'unlocked';
  status: TranscriptProductionStatus;
}

export interface MediaAsset {
  id: string;
  name: string;
  blob: Blob;
  transcript: TranscriptLine[];
  timestamp: number;
}

export type UploadStage = 'upload' | 'transcribe' | 'notation' | 'publish';

// 每个阶段的专属状态
export type UploadStageStatus =
  | 'queued'
  | 'uploading'
  | 'verifying'
  | 'completed'
  | 'error';

export type TranscribeStageStatus =
  | 'queued'
  | 'detecting_source'
  | 'downloading'
  | 'extracting_subtitles'
  | 'transcribing_audio'
  | 'analyzing_language'
  | 'translating'
  | 'saving_database'
  | 'completed'
  | 'error';

export type NotationStageStatus =
  | 'queued'
  | 'loading_sentences'
  | 'generating_notation'
  | 'applying_notation'
  | 'completed'
  | 'error';

export type PublishStageStatus =
  | 'queued'
  | 'validating'
  | 'publishing'
  | 'notifying'
  | 'completed'
  | 'error';

// 联合类型：所有阶段状态
export type StageSpecificStatus =
  | UploadStageStatus
  | TranscribeStageStatus
  | NotationStageStatus
  | PublishStageStatus;

// 保持向后兼容的通用状态（已弃用，建议使用 StageSpecificStatus）
/** @deprecated 使用 StageSpecificStatus 替代 */
export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'completed' | 'error';

export interface UploadJob {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  status: UploadStatus; // 保留用于向后兼容
  stageStatus: StageSpecificStatus; // 新增：阶段专属状态
  stage: UploadStage;
  progress: number;
  language: '双语' | '仅英文' | '仅中文';
  payload?: {
    youtubeUrl?: string;
    videoId?: string;
    thumbnail?: string;
    embedUrl?: string;
    [key: string]: any;
  };
}

export type MediaAssetStatus = 'draft' | 'processing' | 'published' | 'archived';

export interface MediaAssetSummary {
  id: string;
  title: string;
  tags: string[];
  status: MediaAssetStatus;
  durationSeconds: number;
  language: 'bilingual' | 'english' | 'chinese';
  coverUrl: string;
  description: string;
  updatedAt: string;
  jobProgress: number;
  transcriptCount: number;
}

export interface NotationGuide {
  symbol: string;
  description: string;
  example: string;
  color: string;
}

export const PlaybackState = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  RECORDING: 'RECORDING',
  ANALYZING: 'ANALYZING',
} as const;

export type PlaybackState = (typeof PlaybackState)[keyof typeof PlaybackState];

// ============================================================================
// P0 Feature Types
// ============================================================================

// Daily Check-in System (P0-1)
export interface UserCheckin {
  id: string;
  user_id: string;
  checkin_date: string; // ISO date string
  streak_count: number;
  total_checkins: number;
  practice_duration_seconds: number;
  sentences_practiced: number;
  created_at: string;
  updated_at: string;
}

// Practice History (P0-2)
export interface PracticeHistory {
  id: string;
  user_id: string;
  asset_id?: string;
  video_id?: string;
  video_title: string;
  video_thumbnail?: string;
  practice_date: string; // ISO date string
  duration_seconds: number;
  sentences_completed: number;
  sentences_total: number;
  progress_percentage: number;
  completed_at: string;
  created_at: string;
}

// Practice Playlist / Favorites (P0-3)
export interface PracticePlaylistItem {
  id: string;
  user_id: string;
  asset_id?: string;
  video_id?: string;
  video_title: string;
  video_thumbnail?: string;
  video_duration?: number;
  sort_order: number;
  notes?: string;
  tags?: string[];
  added_at: string;
  updated_at: string;
}

// Achievement System (P0-4)
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_name: string;
  category: 'streak' | 'practice' | 'sentences' | 'time' | 'playlist' | 'milestone';
  requirement_type: string;
  requirement_value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress_value: number;
  is_displayed: boolean;
  achievement?: Achievement; // Joined data
}

// View History for Trending (P0-6)
export interface ViewHistory {
  id: string;
  user_id?: string;
  asset_id?: string;
  video_id?: string;
  viewed_at: string;
  view_duration_seconds: number;
  completed: boolean;
}

// User Stats Summary
export interface UserStats {
  user_id: string;
  total_practice_seconds: number;
  total_sentences_practiced: number;
  total_videos_completed: number;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_xp: number;
  level: number;
  last_practice_date?: string;
  updated_at: string;
}

// Trending Content
export interface TrendingItem {
  asset_id?: string;
  video_id?: string;
  video_title: string;
  video_thumbnail?: string;
  view_count_today: number;
  view_count_week: number;
  view_count_month: number;
  completion_rate: number;
  trend_score: number; // Calculated score for ranking
}

// 导出状态常量
export * from './statusConstants';
