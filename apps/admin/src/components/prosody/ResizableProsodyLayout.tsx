'use client';

import { useState } from 'react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { YouTubePlayer } from '@/components/video/YouTubePlayer';
import { LocalVideoPlayer } from '@/components/video/LocalVideoPlayer';
import { SubtitleNotationCard } from './SubtitleNotationCard';
import type { AdminTranscriptLine } from '@echospeak/types';

interface ResizableProsodyLayoutProps {
  lines: AdminTranscriptLine[];
  selectedIds: string[];
  selectedAssetId: string | null;
  selectedAssetSourceUrl?: string | null;
  onToggleSelect: (id: string) => void;
  onRegenerateSelected: () => void;
  onJumpToLine: (index: number) => void;
  isGenerating?: boolean;
}

// 提取 YouTube Video ID
const extractYouTubeId = (url: string): string => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // 直接输入 video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
};

// 判断是否为 YouTube 视频
const isYouTubeVideo = (url?: string | null): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

export const ResizableProsodyLayout = ({
  lines,
  selectedIds,
  selectedAssetId,
  selectedAssetSourceUrl,
  onToggleSelect,
  onRegenerateSelected,
  onJumpToLine,
  isGenerating = false,
}: ResizableProsodyLayoutProps) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [seekToTime, setSeekToTime] = useState<((time: number) => void) | null>(null);

  const currentLine = currentLineIndex >= 0 && currentLineIndex < lines.length
    ? lines[currentLineIndex]
    : lines[0] || null;

  // 跳转到指定字幕
  const handleJumpToLine = (index: number) => {
    if (index < 0 || index >= lines.length) return;

    setCurrentLineIndex(index);
    const line = lines[index];

    if (line.startTime !== undefined && seekToTime) {
      seekToTime(line.startTime / 1000); // 转换为秒
    }
  };

  // 重新生成单条
  const handleRegenerateOne = (id: string) => {
    // 选中该项
    onToggleSelect(id);
    // 触发重新生成（通过调用批量生成函数）
    onRegenerateSelected();
  };

  if (!selectedAssetId || lines.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center text-slate-400">
          <p className="text-lg font-medium mb-2">请先选择视频并加载字幕</p>
          <p className="text-sm">字幕加载完成后即可查看发音谱</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)]">
      {/* 可调整大小的分割面板 */}
      <Allotment defaultSizes={[60, 40]}>
        {/* 左侧：视频播放器（默认 60%） */}
        <Allotment.Pane minSize={400}>
          <div className="h-full bg-slate-900 rounded-2xl p-4 flex flex-col">
            {/* 视频播放器容器 */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {selectedAssetSourceUrl && isYouTubeVideo(selectedAssetSourceUrl) ? (
                <YouTubePlayer
                  videoId={extractYouTubeId(selectedAssetSourceUrl)}
                  transcripts={lines}
                  onSeekReady={(seekFn) => setSeekToTime(() => seekFn)}
                  onCurrentLineChange={(line) => {
                    if (line) {
                      const index = lines.findIndex((l) => l.id === line.id);
                      if (index !== -1) {
                        setCurrentLineIndex(index);
                      }
                    }
                  }}
                  className="w-full h-full"
                />
              ) : selectedAssetSourceUrl ? (
                <LocalVideoPlayer
                  videoUrl={selectedAssetSourceUrl}
                  transcripts={lines}
                  onSeekReady={(seekFn) => setSeekToTime(() => seekFn)}
                  onCurrentLineChange={(line) => {
                    if (line) {
                      const index = lines.findIndex((l) => l.id === line.id);
                      if (index !== -1) {
                        setCurrentLineIndex(index);
                      }
                    }
                  }}
                  className="w-full h-full"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <p className="text-sm">未找到视频源</p>
                </div>
              )}
            </div>

            {/* 播放控制栏 */}
            <div className="mt-3 flex items-center justify-between bg-slate-800 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleJumpToLine(Math.max(0, currentLineIndex - 1))}
                  disabled={currentLineIndex === 0}
                  className="px-3 py-1 text-sm text-white bg-slate-700 hover:bg-slate-600
                           disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                >
                  ◀ 上一句
                </button>

                <div className="text-sm text-white font-mono">
                  {currentLineIndex + 1} / {lines.length}
                </div>

                <button
                  type="button"
                  onClick={() => handleJumpToLine(Math.min(lines.length - 1, currentLineIndex + 1))}
                  disabled={currentLineIndex === lines.length - 1}
                  className="px-3 py-1 text-sm text-white bg-slate-700 hover:bg-slate-600
                           disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
                >
                  下一句 ▶
                </button>
              </div>

              <div className="text-xs text-slate-400">
                点击字幕跳转
              </div>
            </div>
          </div>
        </Allotment.Pane>

        {/* 右侧：字幕+发音谱列表（默认 40%） */}
        <Allotment.Pane minSize={350}>
          <div className="h-full flex flex-col bg-white rounded-2xl">
            {/* 固定顶部：列表头 */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900">
                字幕列表 ({lines.length} 条)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    lines.forEach((l) => onToggleSelect(l.id));
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  全选
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    selectedIds.forEach((id) => onToggleSelect(id));
                  }}
                  className="text-xs text-slate-500 hover:underline"
                >
                  取消
                </button>
              </div>
            </div>

            {/* 可滚动区域：字幕卡片列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {lines.map((line, index) => (
                <SubtitleNotationCard
                  key={line.id}
                  id={line.id}
                  text={line.text}
                  translation={line.translation}
                  notation={line.notation}
                  startTime={line.startTime || 0}
                  confidence={undefined}
                  isActive={index === currentLineIndex}
                  isSelected={selectedIds.includes(line.id)}
                  onToggleSelect={onToggleSelect}
                  onClick={() => handleJumpToLine(index)}
                  onRegenerate={() => handleRegenerateOne(line.id)}
                />
              ))}
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};
