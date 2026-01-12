import React, { useEffect, useState } from 'react';
import { Tv, Loader2, BrainCircuit, Type, EyeOff, ArrowLeft, CheckCircle, Gauge } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { TranscriptLine, PlaybackState } from '@echospeak/types';
import { ProsodyRenderer } from '@echospeak/ui';
import YouTube from 'react-youtube';
import { usePracticeTracking } from '../hooks/usePracticeTracking';

interface VideoLearningPageProps {
  videoId?: string;
  transcript: TranscriptLine[];
  activeId: string;
  onActiveLineChange: (id: string) => void;
  playbackState: PlaybackState;
  playerRef: React.RefObject<any>;
  onPlayerReady: (event: any) => void;
  onPlayerStateChange: (event: any) => void;
  notationProgress: { current: number; total: number };
  isImporting: boolean;
  feedback: string | null;
  showOverlaySubtitle: boolean;
  onToggleSubtitle: () => void;
}

// 模拟数据 - 实际应该从API获取
const mockVideoData: Record<string, {
  title: string;
  category: string;
  difficulty: string;
  youtubeId: string;
}> = {
  'video-1': {
    title: 'Daily English Conversation',
    category: '日常对话',
    difficulty: '中级',
    youtubeId: 'dQw4w9WgXcQ', // 示例ID，实际应该从数据库获取
  },
};

export const VideoLearningPage: React.FC<VideoLearningPageProps> = ({
  videoId,
  transcript,
  activeId,
  onActiveLineChange,
  playbackState,
  playerRef,
  onPlayerReady,
  onPlayerStateChange,
  notationProgress,
  isImporting,
  feedback,
  showOverlaySubtitle,
  onToggleSubtitle,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const currentVideoId = params.id || videoId;

  const videoData = currentVideoId ? mockVideoData[currentVideoId] || mockVideoData['video-1'] : null;
  const youtubeVideoId = videoData?.youtubeId || '';

  // Track practiced sentences
  const [practicedSentences, setPracticedSentences] = useState<Set<string>>(new Set());

  // Initialize practice tracking
  const { startPractice, updateProgress, endPractice, isTracking } = usePracticeTracking({
    videoId: currentVideoId || '',
    videoTitle: videoData?.title || '',
    videoThumbnail: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
  });

  // Start practice session when component mounts
  useEffect(() => {
    if (transcript.length > 0 && !isTracking) {
      startPractice(transcript.length);
    }
  }, [transcript.length, startPractice, isTracking]);

  // Update progress when user interacts with a sentence
  useEffect(() => {
    if (activeId && !practicedSentences.has(activeId)) {
      setPracticedSentences(prev => new Set(prev).add(activeId));
      updateProgress(practicedSentences.size + 1);
    }
  }, [activeId, practicedSentences, updateProgress]);

  // End practice session when leaving
  useEffect(() => {
    return () => {
      endPractice();
    };
  }, [endPractice]);

  const activeLine = transcript.find((line) => line.id === activeId);

  // Playback speed control
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const speedOptions = [0.75, 1, 1.25, 1.5];

  const handleSpeedChange = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(newSpeed);
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      cc_load_policy: 0,
      rel: 0,
      modestbranding: 1,
    },
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 dark:bg-dark-background dark:text-dark-text-primary">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-2xl border-b border-border p-4 safe-top dark:bg-dark-background/95 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-xl hover:bg-surface-hover transition-all touch-friendly dark:hover:bg-dark-surface-hover"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-text-primary truncate dark:dark-text-primary">{videoData?.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-text-secondary dark:text-dark-text-secondary">{videoData?.category}</span>
              <span className="text-[10px] text-text-tertiary">•</span>
              <span className="text-[10px] text-text-secondary dark:text-dark-text-secondary">{videoData?.difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 视频区域 - 16:9 比例 */}
      <div className="relative aspect-video bg-black border-b border-border dark:border-dark-border">
        {youtubeVideoId ? (
          <YouTube
            videoId={youtubeVideoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="w-full h-full"
            containerClassName="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-text-secondary p-8 dark:text-dark-text-secondary">
            <Tv className="w-12 h-12 opacity-20" />
            <p className="font-bold text-xs tracking-widest uppercase text-center">视频加载中...</p>
          </div>
        )}

        {/* 加载遮罩 */}
        {(isImporting || notationProgress.total > 0) && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center dark:bg-dark-background/90">
            <div className="relative mb-6">
              <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
              <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-primary-light animate-pulse" />
            </div>
            <h2 className="text-lg font-black mb-2 tracking-tight">AI 智能处理中...</h2>
            <p className="text-primary-light/70 text-xs font-medium">
              {isImporting
                ? '正在进行双语对齐与翻译补全...'
                : `正在生成发音节奏谱：${notationProgress.current}/${notationProgress.total}`}
            </p>
          </div>
        )}

        {/* 悬浮字幕 - 优化版 */}
        {!isImporting && youtubeVideoId && showOverlaySubtitle && (
          <div className="absolute inset-x-0 bottom-12 px-6 z-20 text-center select-none flex justify-center pointer-events-none">
            <div className="inline-block px-8 py-5 bg-black/80 backdrop-blur-3xl rounded-3xl border-2 border-white/20 shadow-2xl max-w-4xl">
              <p className="text-white text-xl font-black leading-tight tracking-tight drop-shadow-2xl mb-2">
                {activeLine?.text || '准备开始跟读'}
              </p>
              {activeLine?.translation && (
                <p className="text-teal-300 text-sm font-bold uppercase tracking-wider">
                  {activeLine.translation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 播放器控制按钮组 */}
        {youtubeVideoId && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {/* 播放速度 */}
            <button
              onClick={handleSpeedChange}
              className="p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all shadow-xl touch-friendly group"
              title={`播放速度: ${playbackSpeed}x`}
            >
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">{playbackSpeed}x</span>
              </div>
            </button>

            {/* 字幕开关 */}
            <button
              onClick={onToggleSubtitle}
              className={`p-3 backdrop-blur-xl border rounded-xl transition-all shadow-xl touch-friendly ${showOverlaySubtitle
                ? 'bg-teal-600 border-teal-500 hover:bg-teal-500'
                : 'bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800'
                }`}
              title={showOverlaySubtitle ? '隐藏字幕' : '显示字幕'}
            >
              {showOverlaySubtitle ? (
                <Type className="w-4 h-4 text-white" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* AI 发音谱子 */}
      <div className="bg-surface border-b border-border p-6 dark:bg-dark-surface dark:border-dark-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary rounded-xl">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-text-primary tracking-tight dark:dark-text-primary">AI 发音谱子</h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider dark:text-dark-text-secondary">
              自动标注节奏与语调
            </p>
          </div>
        </div>
        <div className="min-h-[80px] flex items-center justify-center">
          {activeLine?.notation ? (
            <div className="w-full animate-in fade-in zoom-in-95 duration-300">
              <ProsodyRenderer notation={activeLine.notation} />
            </div>
          ) : (
            <div className="text-text-tertiary italic text-sm dark:text-dark-text-tertiary">
              {notationProgress.total > 0
                ? 'AI 正在分析本句节奏...'
                : '等待剧本加载'}
            </div>
          )}
        </div>
        {feedback && (
          <div className="mt-4 p-4 bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg flex gap-3 items-center">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-lg">ℹ️</span>
            </div>
            <p className="font-bold text-sm">{feedback}</p>
          </div>
        )}
      </div>

      {/* 练习清单 - 优化版 */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            练习清单 ({transcript.length} 个句子)
          </h3>
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
              <span className="text-green-700 dark:text-green-400">
                {practicedSentences.size}/{transcript.length}
              </span>
            </div>
          </div>
        </div>
        {transcript.map((line, index) => {
          const isPracticed = practicedSentences.has(line.id);
          const isActive = activeId === line.id;
          return (
            <div
              key={line.id}
              onClick={() => {
                onActiveLineChange(line.id);
                if (playerRef.current) {
                  playerRef.current.seekTo(line.startTime);
                }
              }}
              className={`
                relative overflow-hidden p-4 rounded-2xl cursor-pointer transition-all border-2 active:scale-[0.98] touch-manipulation
                ${isActive
                  ? 'bg-gradient-to-br from-teal-600 to-cyan-500 border-teal-500 text-white shadow-xl scale-[1.02]'
                  : isPracticed
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 hover:shadow-lg'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md'
                }
              `}
            >
              {/* 背景装饰 */}
              {isActive && (
                <>
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                </>
              )}

              <div className="relative flex items-start gap-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isPracticed
                    ? 'bg-green-600 text-white shadow-lg'
                    : isActive
                      ? 'bg-white/20 backdrop-blur-sm text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {isPracticed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold mb-1.5 leading-tight ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                    {line.text}
                  </p>
                  <p className={`text-xs font-medium italic ${isActive ? 'text-teal-100' : isPracticed ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                    {line.translation}
                  </p>
                </div>
                {line.notation && (
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-teal-500 dark:bg-blue-400'
                      }`} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoLearningPage;
