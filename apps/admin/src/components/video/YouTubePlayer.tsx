'use client';

import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { Play, Pause, SkipBack, SkipForward, Type, EyeOff } from 'lucide-react';
import type { AdminTranscriptLine } from '@echospeak/types';

interface YouTubePlayerProps {
  videoId: string;
  transcripts: AdminTranscriptLine[];
  onCurrentLineChange?: (line: AdminTranscriptLine | null) => void;
  onReady?: () => void;
  onSeekReady?: (seekFn: (time: number) => void) => void;
  autoplay?: boolean;
  className?: string;
}

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const YouTubePlayer = ({
  videoId,
  transcripts = [],
  onCurrentLineChange,
  onReady,
  onSeekReady,
  autoplay = false,
  className = '',
}: YouTubePlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showOverlaySubtitle, setShowOverlaySubtitle] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 当前字幕
  const currentLine = transcripts.find((line) => {
    const startTime = line.startTime / 1000;
    const endTime = line.endTime / 1000;
    return currentTime >= startTime && currentTime <= endTime;
  });

  // 同步字幕状态
  useEffect(() => {
    if (currentLine && currentLine.id !== activeId) {
      setActiveId(currentLine.id);
      if (onCurrentLineChange) {
        onCurrentLineChange(currentLine);
      }

      // 自动滚动到当前字幕（只滚动字幕列表容器，不滚动页面）
      setTimeout(() => {
        const subtitleElement = document.getElementById(`subtitle-${currentLine.id}`);
        if (subtitleElement && subtitleListRef.current) {
          const container = subtitleListRef.current;
          const element = subtitleElement;

          // 计算滚动位置
          const containerTop = container.scrollTop;
          const containerBottom = containerTop + container.clientHeight;
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.clientHeight;

          // 如果元素不在可见区域内，滚动到容器顶部
          if (elementTop < containerTop || elementTop > containerBottom) {
            container.scrollTo({
              top: elementTop - container.offsetTop - 8, // 8px 顶部间距
              behavior: 'smooth',
            });
          }
        }
      }, 100);
    }
  }, [currentLine, activeId, onCurrentLineChange]);

  // 启动字幕同步
  const startSync = () => {
    if (syncIntervalRef.current) return;
    syncIntervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // 只在第一次获取时长
        if (duration === 0) {
          const videoDuration = playerRef.current.getDuration();
          if (videoDuration && videoDuration > 0) {
            setDuration(videoDuration);
          }
        }
      }
    }, 500); // 增加到 500ms 以减少性能开销
  };

  // 停止字幕同步
  const stopSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  // YouTube 播放器就绪回调
  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration() || 0);
    
    // 将 seek 函数传递给父组件
    if (onSeekReady && playerRef.current) {
      onSeekReady((time: number) => {
        if (playerRef.current) {
          playerRef.current.seekTo(time, true);
        }
      });
    }
    
    if (onReady) {
      onReady();
    }
  };

  // YouTube 播放器状态改变回调
  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    if (state === 1) {
      // YT.PlayerState.PLAYING
      startSync();
    } else if (state === 2) {
      // YT.PlayerState.PAUSED
      stopSync();
    }
  };

  // 点击字幕跳转
  const handleSubtitleClick = (line: AdminTranscriptLine) => {
    if (playerRef.current) {
      const seekTime = line.startTime / 1000;
      playerRef.current.seekTo(seekTime, true);
      setCurrentTime(seekTime);
      setActiveId(line.id);
      if (onCurrentLineChange) {
        onCurrentLineChange(line);
      }
    }
  };

  // 快进/快退
  const skipForward = () => {
    if (playerRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  const skipBackward = () => {
    if (playerRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    }
  };

  // YouTube 播放器配置选项 - 优化性能
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: autoplay ? 1 : 0,
      controls: 1,
      cc_load_policy: 0, // 禁用 YouTube 原生字幕
      rel: 0,
      modestbranding: 1,
      playsinline: 1, // 在移动设备上内联播放,避免全屏切换
      fs: 1, // 允许全屏
    },
  };

  return (
    <div className={className}>
      {/* YouTube 播放器容器 */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          className="w-full h-full"
        />

        {/* 自定义控制按钮 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={skipBackward}
            className="p-2 hover:bg-white/10 rounded-full transition"
            title="后退 10 秒"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={() => {
              if (playerRef.current) {
                const state = playerRef.current.getPlayerState();
                if (state === 1) {
                  playerRef.current.pauseVideo();
                } else {
                  playerRef.current.playVideo();
                }
              }
            }}
            className="p-3 bg-white rounded-full hover:bg-white/90 transition"
            title="播放/暂停"
          >
            <Play className="w-6 h-6 text-slate-900" />
          </button>

          <button
            onClick={skipForward}
            className="p-2 hover:bg-white/10 rounded-full transition"
            title="前进 10 秒"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 字幕开关按钮 */}
        <button
          onClick={() => setShowOverlaySubtitle(!showOverlaySubtitle)}
          className="absolute top-4 right-4 p-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
          title={showOverlaySubtitle ? '隐藏字幕' : '显示字幕'}
        >
          {showOverlaySubtitle ? (
            <Type className="w-4 h-4 text-blue-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-xs font-bold">{showOverlaySubtitle ? '隐藏' : '显示'}</span>
        </button>

        {/* 字幕覆盖层 - 全屏时隐藏 */}
        {showOverlaySubtitle && !isFullscreen && currentLine && (
          <div className="absolute inset-x-0 bottom-8 px-8 z-20 text-center select-none flex justify-center pointer-events-none">
            <div className="inline-block px-8 py-4 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
              <p className="text-white text-xl font-bold leading-tight tracking-tight drop-shadow-lg">
                {currentLine.text}
              </p>
              {currentLine.translation && (
                <p className="text-blue-400/90 text-sm font-bold mt-1 uppercase tracking-wide">
                  {currentLine.translation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 全屏提示 */}
        {isFullscreen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl px-8 py-6 text-center">
              <p className="text-white text-lg font-bold mb-2">全屏模式</p>
              <p className="text-slate-300 text-sm">请使用 YouTube 内置字幕功能 (CC 按钮)</p>
            </div>
          </div>
        )}

        {/* 时间显示 */}
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs font-mono text-white/90">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};
