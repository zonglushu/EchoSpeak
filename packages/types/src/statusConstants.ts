import type {
  UploadStageStatus,
  TranscribeStageStatus,
  NotationStageStatus,
  PublishStageStatus,
  StageSpecificStatus,
  UploadStage,
} from './index';

// ============================================================================
// Upload Stage Constants
// ============================================================================

export const UPLOAD_STAGE_LABELS: Record<UploadStage, string> = {
  upload: '上传',
  transcribe: '转写',
  notation: '打谱',
  publish: '发布',
};

export const UPLOAD_STAGE_STATUS_LABELS: Record<UploadStageStatus, string> = {
  queued: '队列中',
  uploading: '上传中',
  verifying: '验证文件中',
  completed: '已完成',
  error: '失败',
};

export const UPLOAD_STAGE_STATUS_COLORS: Record<UploadStageStatus, string> = {
  queued: 'bg-slate-100 text-slate-600',
  uploading: 'bg-amber-100 text-amber-600',
  verifying: 'bg-indigo-100 text-indigo-600',
  completed: 'bg-emerald-100 text-emerald-600',
  error: 'bg-rose-100 text-rose-600',
};

export const UPLOAD_STAGE_STATUS_PROGRESS: Record<UploadStageStatus, number> = {
  queued: 0,
  uploading: 30,
  verifying: 80,
  completed: 100,
  error: 0,
};

// ============================================================================
// Transcribe Stage Constants
// ============================================================================

export const TRANSCRIBE_STAGE_STATUS_LABELS: Record<TranscribeStageStatus, string> = {
  queued: '队列中',
  detecting_source: '检测视频源中',
  downloading: '下载视频中',
  extracting_subtitles: '提取字幕中',
  transcribing_audio: 'AI转写音频中',
  analyzing_language: '分析语言中',
  translating: '翻译字幕中',
  saving_database: '存入数据库中',
  completed: '已完成',
  error: '失败',
};

export const TRANSCRIBE_STAGE_STATUS_COLORS: Record<TranscribeStageStatus, string> = {
  queued: 'bg-slate-100 text-slate-600',
  detecting_source: 'bg-blue-50 text-blue-600',
  downloading: 'bg-cyan-100 text-cyan-600',
  extracting_subtitles: 'bg-violet-100 text-violet-600',
  transcribing_audio: 'bg-purple-100 text-purple-600',
  analyzing_language: 'bg-fuchsia-100 text-fuchsia-600',
  translating: 'bg-pink-100 text-pink-600',
  saving_database: 'bg-orange-100 text-orange-600',
  completed: 'bg-emerald-100 text-emerald-600',
  error: 'bg-rose-100 text-rose-600',
};

export const TRANSCRIBE_STAGE_STATUS_PROGRESS: Record<TranscribeStageStatus, number> = {
  queued: 0,
  detecting_source: 10,
  downloading: 20,
  extracting_subtitles: 40,
  transcribing_audio: 60,
  analyzing_language: 70,
  translating: 85,
  saving_database: 95,
  completed: 100,
  error: 0,
};

// ============================================================================
// Notation Stage Constants
// ============================================================================

export const NOTATION_STAGE_STATUS_LABELS: Record<NotationStageStatus, string> = {
  queued: '队列中',
  loading_sentences: '加载句子中',
  generating_notation: 'AI生成韵律中',
  applying_notation: '应用标注中',
  completed: '已完成',
  error: '失败',
};

export const NOTATION_STAGE_STATUS_COLORS: Record<NotationStageStatus, string> = {
  queued: 'bg-slate-100 text-slate-600',
  loading_sentences: 'bg-teal-100 text-teal-600',
  generating_notation: 'bg-emerald-100 text-emerald-600',
  applying_notation: 'bg-green-100 text-green-600',
  completed: 'bg-emerald-100 text-emerald-600',
  error: 'bg-rose-100 text-rose-600',
};

export const NOTATION_STAGE_STATUS_PROGRESS: Record<NotationStageStatus, number> = {
  queued: 0,
  loading_sentences: 10,
  generating_notation: 60,
  applying_notation: 90,
  completed: 100,
  error: 0,
};

// ============================================================================
// Publish Stage Constants
// ============================================================================

export const PUBLISH_STAGE_STATUS_LABELS: Record<PublishStageStatus, string> = {
  queued: '队列中',
  validating: '验证内容中',
  publishing: '发布中',
  notifying: '通知中',
  completed: '已完成',
  error: '失败',
};

export const PUBLISH_STAGE_STATUS_COLORS: Record<PublishStageStatus, string> = {
  queued: 'bg-slate-100 text-slate-600',
  validating: 'bg-sky-100 text-sky-600',
  publishing: 'bg-lime-100 text-lime-600',
  notifying: 'bg-yellow-100 text-yellow-600',
  completed: 'bg-emerald-100 text-emerald-600',
  error: 'bg-rose-100 text-rose-600',
};

export const PUBLISH_STAGE_STATUS_PROGRESS: Record<PublishStageStatus, number> = {
  queued: 0,
  validating: 20,
  publishing: 70,
  notifying: 90,
  completed: 100,
  error: 0,
};

// ============================================================================
// Unified Helpers
// ============================================================================

// 获取状态标签
export function getStatusLabel(stage: UploadStage, stageStatus: StageSpecificStatus): string {
  switch (stage) {
    case 'upload':
      return UPLOAD_STAGE_STATUS_LABELS[stageStatus as UploadStageStatus];
    case 'transcribe':
      return TRANSCRIBE_STAGE_STATUS_LABELS[stageStatus as TranscribeStageStatus];
    case 'notation':
      return NOTATION_STAGE_STATUS_LABELS[stageStatus as NotationStageStatus];
    case 'publish':
      return PUBLISH_STAGE_STATUS_LABELS[stageStatus as PublishStageStatus];
    default:
      return stageStatus;
  }
}

// 获取状态颜色
export function getStatusColor(stage: UploadStage, stageStatus: StageSpecificStatus): string {
  switch (stage) {
    case 'upload':
      return UPLOAD_STAGE_STATUS_COLORS[stageStatus as UploadStageStatus];
    case 'transcribe':
      return TRANSCRIBE_STAGE_STATUS_COLORS[stageStatus as TranscribeStageStatus];
    case 'notation':
      return NOTATION_STAGE_STATUS_COLORS[stageStatus as NotationStageStatus];
    case 'publish':
      return PUBLISH_STAGE_STATUS_COLORS[stageStatus as PublishStageStatus];
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// 获取状态进度
export function getStatusProgress(stage: UploadStage, stageStatus: StageSpecificStatus): number {
  switch (stage) {
    case 'upload':
      return UPLOAD_STAGE_STATUS_PROGRESS[stageStatus as UploadStageStatus];
    case 'transcribe':
      return TRANSCRIBE_STAGE_STATUS_PROGRESS[stageStatus as TranscribeStageStatus];
    case 'notation':
      return NOTATION_STAGE_STATUS_PROGRESS[stageStatus as NotationStageStatus];
    case 'publish':
      return PUBLISH_STAGE_STATUS_PROGRESS[stageStatus as PublishStageStatus];
    default:
      return 0;
  }
}

// 检查状态是否为最终状态（completed 或 error）
export function isTerminalStatus(stageStatus: StageSpecificStatus): boolean {
  return stageStatus === 'completed' || stageStatus === 'error';
}

// 检查状态是否为运行中状态
export function isRunningStatus(stageStatus: StageSpecificStatus): boolean {
  return !isTerminalStatus(stageStatus) && stageStatus !== 'queued';
}
