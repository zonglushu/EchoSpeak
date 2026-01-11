'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Type, EyeOff } from 'lucide-react';
import type { AdminTranscriptLine } from '@echospeak/types';

interface LocalVideoPlayerProps {
  videoUrl: string;
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

export const LocalVideoPlayer = ({
  videoUrl,
  transcripts = [],
  onCurrentLineChange,
  onReady,
  onSeekReady,
  autoplay = false,
  className = '',
}: LocalVideoPlayerProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlaySubtitle, setShowOverlaySubtitle] = useState(true);
  const [volume, setVolume] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const subtitleListRef = useRef<HTMLDivElement>(null);
  const textTrackRef = useRef<TextTrack | null>(null);

  // 监听全屏状态变化,添加/移除原生字幕轨道
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === video;

      if (isFullscreen && transcripts.length > 0) {
        // 进入全屏:添加原生字幕轨道
        // 移除旧轨道
        const existingTracks = Array.from(video.textTracks);
        existingTracks.forEach((track) => {
          try {
            video.removeChild(track as any);
          } catch (e) {
            // 忽略移除错误
          }
        });

        // 创建新轨道
        const track = video.addTextTrack('captions', 'Subtitles', 'en');
        track.mode = 'showing';
        textTrackRef.current = track;

        // 添加所有字幕cues
        transcripts.forEach((line) => {
          const cue = new VTTCue(
            line.startTime / 1000,
            line.endTime / 1000,
            `${line.text}\n${line.translation || ''}`
          );
          cue.align = 'center';
          cue.position = 'auto';
          cue.line = 'auto';
          try {
            track.addCue(cue);
          } catch (e) {
            console.error('Failed to add cue:', e);
          }
        });
      } else {
        // 退出全屏:移除字幕轨道
        if (textTrackRef.current) {
          const tracks = Array.from(video.textTracks);
          tracks.forEach((track) => {
            try {
              video.removeChild(track as any);
            } catch (e) {
              // 忽略移除错误
            }
          });
          textTrackRef.current = null;
        }
      }
    };

    // 监听全屏事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [transcripts]);

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
      if (videoRef.current) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
      }
    }, 250);
  };

  // 停止字幕同步
  const stopSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  // 视频事件处理
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // 将 seek 函数传递给父组件
      if (onSeekReady && videoRef.current) {
        onSeekReady((time: number) => {
          if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
        });
      }
      
      if (onReady) {
        onReady();
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    startSync();
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopSync();
  };

  // 播放/暂停切换
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // 点击字幕跳转
  const handleSubtitleClick = (line: AdminTranscriptLine) => {
    if (videoRef.current) {
      const seekTime = line.startTime / 1000;
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      setActiveId(line.id);
      if (onCurrentLineChange) {
        onCurrentLineChange(line);
      }
    }
  };

  // 快进/快退
  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 进度条控制
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 音量控制
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  return (
    <div className={className}>
      {/* 本地视频播放器容器 */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg group">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          autoPlay={autoplay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
        />

        {/* 视频控制栏 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 进度条 */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab"
            />
            <div className="flex justify-between text-xs text-white/80 mt-1.5 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={skipBackward}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="后退 10 秒"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3 bg-white rounded-full hover:bg-white/90 transition shadow-lg"
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-slate-900" />
              ) : (
                <Play className="w-6 h-6 text-slate-900 ml-0.5" />
              )}
            </button>

            <button
              onClick={skipForward}
              className="p-2 hover:bg-white/10 rounded-full transition"
              title="前进 10 秒"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            {/* 音量控制 */}
            <div className="flex items-center gap-2 ml-4">
              <svg
                className="w-4 h-4 text-white/70"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab"
              />
            </div>
          </div>
        </div>

        {/* 字幕开关按钮 */}
        <button
          onClick={() => setShowOverlaySubtitle(!showOverlaySubtitle)}
          className="absolute top-4 right-4 p-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl opacity-0 group-hover:opacity-100"
          title={showOverlaySubtitle ? '隐藏字幕' : '显示字幕'}
        >
          {showOverlaySubtitle ? (
            <Type className="w-4 h-4 text-blue-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-xs font-bold">{showOverlaySubtitle ? '隐藏' : '显示'}</span>
        </button>

        {/* 字幕覆盖层 */}
        {showOverlaySubtitle && currentLine && (
          <div className="absolute inset-x-0 bottom-20 px-8 z-20 text-center select-none flex justify-center pointer-events-none">
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
      </div>
    </div>
  );
};
