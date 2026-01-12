import React from 'react';
import { Play, Pause, Tv, Loader2, BrainCircuit, Mic, Type, EyeOff } from 'lucide-react';
import { TranscriptLine, PlaybackState } from '@echospeak/types';
import { ProsodyRenderer } from '@echospeak/ui';
import YouTube from 'react-youtube';

interface MobileHomeLayoutProps {
  currentVideoId: string | null;
  youtubeUrl: string;
  onYouTubeUrlChange: (url: string) => void;
  onYouTubeUrlSubmit: () => void;
  isFetchingCaptions: boolean;
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
  showLegend: boolean;
}

export const MobileHomeLayout: React.FC<MobileHomeLayoutProps> = ({
  currentVideoId,
  youtubeUrl,
  onYouTubeUrlChange,
  onYouTubeUrlSubmit,
  isFetchingCaptions,
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
  showLegend,
}) => {
  const activeLine = transcript.find((line) => line.id === activeId);

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
    <div className="lg:hidden min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            placeholder="粘贴 YouTube 链接..."
            value={youtubeUrl}
            onChange={(e) => onYouTubeUrlChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onYouTubeUrlSubmit()}
          />
          <button
            onClick={onYouTubeUrlSubmit}
            disabled={!youtubeUrl.trim() || isFetchingCaptions}
            className="bg-teal-600 hover:bg-teal-500 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {isFetchingCaptions ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Tv className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 视频区域 - 16:9 比例 */}
      <div className="relative aspect-video bg-black border-b border-white/5">
        {currentVideoId ? (
          <YouTube
            videoId={currentVideoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="w-full h-full"
            containerClassName="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500 p-8">
            <Tv className="w-12 h-12 opacity-20" />
            <p className="font-bold text-xs tracking-widest uppercase text-center">输入 YouTube 链接开始学习</p>
          </div>
        )}

        {/* 加载遮罩 */}
        {(isFetchingCaptions || isImporting || notationProgress.total > 0) && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 border-4 border-blue-400/10 border-t-blue-500 rounded-full animate-spin"></div>
              <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-teal-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black mb-2 tracking-tight">AI 智能处理中...</h2>
            <p className="text-teal-100/70 text-xs font-medium">
              {isFetchingCaptions
                ? '正在获取 YouTube 字幕...'
                : isImporting
                ? '正在进行双语对齐与翻译补全...'
                : `正在生成发音节奏谱：${notationProgress.current}/${notationProgress.total}`}
            </p>
          </div>
        )}

        {/* 悬浮字幕 */}
        {!isFetchingCaptions && !isImporting && currentVideoId && showOverlaySubtitle && (
          <div className="absolute inset-x-0 bottom-16 px-6 z-20 text-center select-none flex justify-center pointer-events-none">
            <div className="inline-block px-6 py-4 bg-black/70 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl">
              <p className="text-white text-lg font-black leading-tight tracking-tight drop-shadow-xl">
                {activeLine?.text || '准备开始跟读'}
              </p>
              <p className="text-teal-400/80 text-xs font-bold mt-1 uppercase tracking-[0.2em]">
                {activeLine?.translation}
              </p>
            </div>
          </div>
        )}

        {/* 字幕开关 */}
        {currentVideoId && (
          <button
            onClick={onToggleSubtitle}
            className="absolute top-4 right-4 z-20 p-3 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
            style={{ minHeight: '44px', minWidth: '44px' }}
            title={showOverlaySubtitle ? '隐藏字幕' : '显示字幕'}
          >
            {showOverlaySubtitle ? (
              <Type className="w-4 h-4 text-teal-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* AI 发音谱子 */}
      <div className="bg-white/5 border-b border-white/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-600 rounded-xl">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight">AI 发音谱子</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
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
            <div className="text-slate-600 italic text-sm">
              {notationProgress.total > 0
                ? 'AI 正在分析本句节奏...'
                : '等待剧本加载'}
            </div>
          )}
        </div>
        {feedback && (
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg flex gap-3 items-center">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-lg">ℹ️</span>
            </div>
            <p className="font-bold text-sm">{feedback}</p>
          </div>
        )}
      </div>

      {/* 练习清单 - 卡片式 */}
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider px-2">
          练习清单
        </h3>
        {transcript.map((line, index) => (
          <div
            key={line.id}
            onClick={() => {
              onActiveLineChange(line.id);
              if (playerRef.current) {
                playerRef.current.seekTo(line.startTime);
              }
            }}
            className={`
              p-5 rounded-2xl cursor-pointer transition-all border-2 active:scale-[0.98]
              touch-manipulation
              ${
                activeId === line.id
                  ? 'bg-teal-600 border-teal-500 text-white shadow-xl'
                  : 'bg-white/5 border-transparent hover:bg-white/10'
              }
            `}
            style={{ minHeight: '44px' }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black mb-1 leading-tight tracking-tight">
                  {line.text}
                </p>
                <p className="text-xs font-bold opacity-60 italic truncate">
                  {line.translation}
                </p>
              </div>
              {line.notation && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 录音按钮 */}
        <button className="w-full p-6 rounded-2xl bg-slate-900 hover:bg-black transition-all flex flex-col items-center gap-2 group shadow-xl border border-white/5">
          <div className="p-3 rounded-full bg-teal-600 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            录制跟读并点评
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileHomeLayout;
