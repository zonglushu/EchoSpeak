'use client';

import { CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { ProsodyRenderer } from '@echospeak/ui';

interface SubtitleNotationCardProps {
  id: string;
  text: string;
  translation?: string;
  notation?: string;
  startTime: number;
  confidence?: number;
  isActive?: boolean;
  isSelected?: boolean;
  onToggleSelect: (id: string) => void;
  onClick: () => void;
  onRegenerate: () => void;
  onPlay?: () => void;
}

export const SubtitleNotationCard = ({
  id,
  text,
  translation,
  notation,
  startTime,
  confidence = 0,
  isActive = false,
  isSelected = false,
  onToggleSelect,
  onClick,
  onRegenerate,
  onPlay,
}: SubtitleNotationCardProps) => {
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 1000 / 60);
    const seconds = Math.floor(ms / 1000) % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 85) return { label: '高', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 70) return { label: '中', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: '低', color: 'text-rose-600', bg: 'bg-rose-100' };
  };

  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div
      id={`subtitle-${id}`}
      onClick={onClick}
      data-active={isActive}
      className={`
        group relative p-5 rounded-2xl border-2 transition-all cursor-pointer
        ${isActive
          ? 'bg-blue-50 border-blue-500 shadow-lg'
          : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md'
        }
        active:scale-[0.99]
      `}
    >
      {/* 🔝 顶部：发音谱预览（重点区域） */}
      <div className={`
        mb-4 p-4 rounded-xl border transition-all
        ${confidence < 70 && notation
          ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
          : 'bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200'
        }
      `}>
        {/* 状态栏 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`
              text-xs font-semibold px-2 py-1 rounded-full
              ${notation ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}
            `}>
              {notation ? '✨ AI 发音谱' : '⏳ 待生成'}
            </span>

            {notation && confidence > 0 && (
              <span className={`
                text-xs font-medium px-2 py-1 rounded-full
                ${confidenceLevel.bg} ${confidenceLevel.color}
              `}>
                置信度: {confidence}%
              </span>
            )}
          </div>

          {/* 快捷操作 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100
                         transition-opacity">
            {onPlay && (
              <button
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="p-2 rounded-lg hover:bg-white/80 transition text-sm"
                title="播放原句"
              >
                🔊
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
              className="p-2 rounded-lg hover:bg-white/80 transition text-sm"
              title="重新生成"
            >
              🔄
            </button>
          </div>
        </div>

        {/* 发音谱内容 */}
        {notation ? (
          <ProsodyRenderer notation={notation} />
        ) : (
          <div className="text-center py-6 text-slate-400">
            <button
              onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
              className="inline-flex items-center gap-2 px-4 py-2
                             rounded-lg bg-primary text-white text-sm font-medium
                             hover:bg-primary/90 transition"
            >
              <Zap className="h-4 w-4" />
              点击生成发音谱
            </button>
          </div>
        )}
      </div>

      {/* 📝 中部：原文 */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          📝 原文
        </label>
        <p className="text-base font-medium text-slate-900 mt-1.5 leading-relaxed">
          {text}
        </p>
      </div>

      {/* 🌐 下部：译文 */}
      {translation && (
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            🌐 译文
          </label>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed italic">
            {translation}
          </p>
        </div>
      )}

      {/* ⏱️ 底部：时间戳 + 状态 + 选择框 */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {formatTime(startTime)}
          </span>

          {confidence < 70 && notation && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              建议人工检查
            </span>
          )}

          {notation && confidence >= 85 && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              质量良好
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(id);
            }}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          <label className="text-xs text-slate-400 cursor-pointer">选择</label>
        </div>
      </div>
    </div>
  );
};
