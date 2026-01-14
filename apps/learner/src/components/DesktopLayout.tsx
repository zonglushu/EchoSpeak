import React from 'react';
import { Tv, Loader2, BrainCircuit, Mic, Type, EyeOff, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { TranscriptLine, PlaybackState } from '@echospeak/types';
import { ProsodyRenderer, NotationLegend } from '@echospeak/ui';
import { NOTATION_GUIDE } from '../constants';
import YouTube from 'react-youtube';
import type {
  YouTubePlayer,
  YouTubePlayerReadyEvent,
  YouTubePlayerStateEvent,
} from '../types/youtube';

interface DesktopLayoutProps {
  currentVideoId: string | null;
  youtubeUrl: string;
  onYouTubeUrlChange: (url: string) => void;
  onYouTubeUrlSubmit: () => void;
  isFetchingCaptions: boolean;
  transcript: TranscriptLine[];
  activeId: string;
  onActiveLineChange: (id: string) => void;
  playbackState: PlaybackState;
  playerRef: React.RefObject<YouTubePlayer | null>;
  onPlayerReady: (event: YouTubePlayerReadyEvent) => void;
  onPlayerStateChange: (event: YouTubePlayerStateEvent) => void;
  notationProgress: { current: number; total: number };
  isImporting: boolean;
  feedback: string | null;
  showOverlaySubtitle: boolean;
  onToggleSubtitle: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  showLibrary: boolean;
  onToggleLibrary: () => void;
  onShowImportModal: () => void;
  hasGeminiApiKey: boolean;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
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
  onToggleLegend,
  showLibrary,
  onToggleLibrary,
  onShowImportModal,
  hasGeminiApiKey,
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
    <div className="hidden lg:block min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      {/* 顶部导航栏 */}
      <nav className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl sticky top-0 z-50 flex items-center px-8 gap-10">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Tv className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tighter">
            EchoSpeak <span className="text-blue-500">Pro</span>
          </h1>
        </div>
        <div className="flex-1 max-w-2xl flex items-center gap-3">
          <input
            type="text"
            className="flex-1 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
            placeholder="粘贴 YouTube 链接 (如: https://youtube.com/watch?v=...)"
            value={youtubeUrl}
            onChange={(e) => onYouTubeUrlChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onYouTubeUrlSubmit()}
          />
          <button
            onClick={onYouTubeUrlSubmit}
            disabled={!youtubeUrl.trim() || isFetchingCaptions}
            className="bg-teal-600 hover:bg-teal-500 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingCaptions ? (
              <>
                <Loader2 className="animate-spin" /> 加载中...
              </>
            ) : (
              <>
                <Tv className="w-4 h-4" /> 加载视频
              </>
            )}
          </button>
          <button
            onClick={onShowImportModal}
            className="bg-white/10 border border-white/10 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Type className="w-4 h-4" /> 手动剧本
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLibrary}
            className={`p-3 rounded-xl border transition-all ${
              showLibrary
                ? 'bg-teal-600 border-teal-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleLegend}
            className={`p-3 rounded-xl border transition-all ${
              showLegend
                ? 'bg-teal-600 border-teal-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* API Key 警告 */}
      {!hasGeminiApiKey && (
        <div className="max-w-[1600px] mx-auto w-full px-8 pt-6">
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 text-amber-100 p-6 flex gap-4">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-lg font-black tracking-tight">未检测到 Gemini API Key</p>
              <p className="text-sm mt-1 leading-relaxed">
                请在项目根目录创建 <code>.env.local</code>，写入{' '}
                <code>GEMINI_API_KEY=你的密钥</code>，然后重新启动开发服务器。
                在未配置前，应用界面可以浏览，但 AI 翻译与打谱功能会使用占位文案。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          {showLegend && <NotationLegend guide={NOTATION_GUIDE} />}

          <div className="relative aspect-video bg-black rounded-[3rem] shadow-2xl overflow-hidden group border border-white/5 ring-1 ring-white/10">
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
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                <Tv className="w-16 h-16 opacity-20" />
                <p className="font-bold text-sm tracking-widest uppercase">
                  输入 YouTube 链接开始学习
                </p>
              </div>
            )}

            {(isFetchingCaptions || isImporting || notationProgress.total > 0) && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center z-50">
                <div className="relative mb-8">
                  <div className="w-32 h-32 border-4 border-blue-400/10 border-t-blue-500 rounded-full animate-spin"></div>
                  <BrainCircuit className="absolute inset-0 m-auto w-12 h-12 text-teal-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">
                  AI 智能处理中...
                </h2>
                <p className="text-teal-100/70 text-sm font-medium">
                  {isFetchingCaptions
                    ? '正在获取 YouTube 字幕...'
                    : isImporting
                    ? '正在进行双语对齐与翻译补全...'
                    : `正在生成发音节奏谱：${notationProgress.current}/${notationProgress.total}`}
                </p>
              </div>
            )}

            {!isFetchingCaptions && !isImporting && currentVideoId && showOverlaySubtitle && (
              <div className="absolute inset-x-0 bottom-24 px-10 z-20 text-center select-none flex justify-center pointer-events-none">
                <div className="inline-block px-10 py-6 bg-black/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <p className="text-white text-2xl font-black leading-tight tracking-tight drop-shadow-xl">
                    {activeLine?.text || '准备开始跟读'}
                  </p>
                  <p className="text-teal-400/80 text-sm font-bold mt-2 uppercase tracking-[0.2em]">
                    {activeLine?.translation}
                  </p>
                </div>
              </div>
            )}

            {currentVideoId && (
              <button
                onClick={onToggleSubtitle}
                className="absolute top-6 right-6 z-20 p-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
                title={showOverlaySubtitle ? '隐藏字幕' : '显示字幕'}
              >
                {showOverlaySubtitle ? (
                  <Type className="w-5 h-5 text-teal-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-sm font-bold">
                  {showOverlaySubtitle ? '隐藏字幕' : '显示字幕'}
                </span>
              </button>
            )}
          </div>

          <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 min-h-[300px] relative overflow-hidden">
            <div className="flex items-center gap-6 mb-10 relative z-10">
              <div className="p-4 bg-teal-600 rounded-3xl shadow-xl shadow-blue-600/20">
                <BrainCircuit className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  AI 发音谱子 (Shadowing Script)
                </h2>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  自动标注重音、连读与语调
                </p>
              </div>
            </div>
            <div className="min-h-[140px] flex items-center justify-center relative z-10">
              {activeLine?.notation ? (
                <div className="w-full animate-in fade-in zoom-in-95 duration-500">
                  <ProsodyRenderer notation={activeLine.notation} />
                </div>
              ) : (
                <div className="text-slate-600 italic font-medium">
                  {notationProgress.total > 0
                    ? 'AI 正在分析本句节奏...'
                    : '等待剧本加载'}
                </div>
              )}
            </div>
            {feedback && (
              <div className="mt-10 p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2.5rem] shadow-2xl flex gap-6 items-center animate-in slide-in-from-bottom-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
                  <Info className="w-6 h-6" />
                </div>
                <p className="font-bold text-lg">{feedback}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-8 h-full">
          <div className="flex-1 bg-white/5 rounded-[3rem] border border-white/10 p-10 flex flex-col overflow-hidden max-h-[85vh] sticky top-28">
            <h3 className="text-2xl font-black mb-8 tracking-tighter">练习清单</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
              {transcript.map((line) => (
                <div
                  key={line.id}
                  onClick={() => {
                    onActiveLineChange(line.id);
                    if (playerRef.current) {
                      playerRef.current.seekTo(line.startTime);
                    }
                  }}
                  className={`p-8 rounded-[2rem] cursor-pointer transition-all border-2 active:scale-[0.98] ${
                    activeId === line.id
                      ? 'bg-teal-600 border-teal-500 text-white shadow-3xl'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <p className="text-lg font-black mb-2 leading-tight tracking-tight">
                    {line.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold opacity-50 italic">
                      {line.translation}
                    </p>
                    {line.notation && <CheckCircle2 className="w-4 h-4 text-white/40" />}
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-10 w-full py-8 rounded-[2rem] bg-slate-900 hover:bg-black transition-all flex flex-col items-center gap-3 group shadow-2xl">
              <div className="p-4 rounded-full bg-teal-600 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                录制跟读并点评
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesktopLayout;
