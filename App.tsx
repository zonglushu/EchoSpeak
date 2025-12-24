
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Square, Sparkles, Link as LinkIcon, Loader2, AlertCircle, Upload, Tv, FileVideo, Info, CheckCircle2, History, Trash2, MonitorPlay, HelpCircle, Play, Pause, Undo2, BrainCircuit, Save, FileText, X, ScanText, Languages
} from 'lucide-react';
import { TranscriptLine, PlaybackState, MediaAsset } from './types';
import { INITIAL_TRANSCRIPT } from './constants';
import { generateProsodyNotation, transcribeMedia, bilingualizeText } from './services/geminiService';
import ProsodyRenderer from './components/ProsodyRenderer';
import NotationLegend from './components/NotationLegend';

const DB_NAME = 'EchoSpeakStudioDB_v2';
const STORE_NAME = 'media_library';
const LAST_ASSET_KEY = 'echo_speak_last_asset_id';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveAsset = async (asset: MediaAsset) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(asset);
};

const getLibrary = async (): Promise<MediaAsset[]> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<TranscriptLine[]>(INITIAL_TRANSCRIPT);
  const [activeId, setActiveId] = useState<string>(INITIAL_TRANSCRIPT[0]?.id || '');
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [showLegend, setShowLegend] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notationProgress, setNotationProgress] = useState({ current: 0, total: 0 });

  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [currentAssetName, setCurrentAssetName] = useState<string | null>(null);
  const [currentAssetBlob, setCurrentAssetBlob] = useState<Blob | null>(null);
  const [playerMode, setPlayerMode] = useState<'youtube' | 'local'>('youtube');
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  
  const activeLine = transcript.find(line => line.id === activeId);
  const localPlayerRef = useRef<HTMLVideoElement>(null);
  const syncIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const items = await getLibrary();
      const lastId = localStorage.getItem(LAST_ASSET_KEY);
      if (lastId) {
        const lastAsset = items.find(a => a.id === lastId);
        if (lastAsset) loadFromLibrary(lastAsset);
      }
    };
    init();
  }, []);

  const loadFromLibrary = (asset: MediaAsset) => {
    if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    setLocalFileUrl(URL.createObjectURL(asset.blob));
    setPlayerMode('local');
    setTranscript(asset.transcript);
    setActiveId(asset.transcript[0]?.id || '1');
    setCurrentAssetId(asset.id);
    setCurrentAssetName(asset.name);
    setCurrentAssetBlob(asset.blob);
    localStorage.setItem(LAST_ASSET_KEY, asset.id);
    setShowLibrary(false);
  };

  const parseSRT = (data: string): TranscriptLine[] => {
    const lines = data.replace(/\r/g, '').split(/\n\s*\n/);
    return lines.map((block, i) => {
      const parts = block.trim().split('\n');
      if (parts.length < 3) return null;
      const timeMatch = parts[1].match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/);
      if (!timeMatch) return null;
      
      const toSeconds = (s: string) => {
        const [h, m, sec] = s.split(':');
        const [ss, ms] = sec.split(',');
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(ss) + parseInt(ms) / 1000;
      };

      return {
        id: `srt-${i}`,
        startTime: toSeconds(timeMatch[1]),
        endTime: toSeconds(timeMatch[2]),
        text: parts.slice(2).join(' '),
        translation: "AI 识别中...",
      };
    }).filter(x => x !== null) as TranscriptLine[];
  };

  const handleManualImport = async () => {
    if (!pastedText.trim() || isImporting) return;
    
    setIsImporting(true);
    setFeedback("AI 正在解析您的文本，智能补全双语对照...");
    
    try {
      let newLines: TranscriptLine[] = [];
      
      // 如果看起来像 SRT，先用本地快速解析，然后再让 AI 翻译
      if (pastedText.includes('-->')) {
        const parsed = parseSRT(pastedText);
        // 对解析出的每一行，如果是中文，AI 自动翻译英文；如果是英文，AI 自动翻译中文
        // 这里为了体验流畅，可以先加载结构，再逐句补全翻译
        newLines = parsed;
      } else {
        // 如果是纯文本（仅中/仅英/混合），直接交给 AI 处理结构
        newLines = await bilingualizeText(pastedText);
      }

      setTranscript(newLines);
      setShowImportModal(false);
      setPastedText('');
      setFeedback("双语剧本解析完成。正在逐句生成发音谱子...");
      processNotationInBatch(newLines);
    } catch (error) {
      setFeedback("剧本解析失败，请检查网络或文本格式。");
    } finally {
      setIsImporting(false);
    }
  };

  const processNotationInBatch = async (lines: TranscriptLine[]) => {
    setNotationProgress({ current: 0, total: lines.length });
    let updated = [...lines];
    for (let i = 0; i < lines.length; i++) {
      try {
        const notation = await generateProsodyNotation(lines[i].text);
        updated = updated.map(l => l.id === lines[i].id ? { ...l, notation } : l);
        setTranscript([...updated]);
        setNotationProgress(p => ({ ...p, current: i + 1 }));
      } catch (e) {
        console.error("Notation generation failed for", lines[i].text);
      }
    }
    setNotationProgress({ current: 0, total: 0 });
    setFeedback("✅ 剧本解析与 AI 打谱全部就绪！");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const assetId = `loc-${Date.now()}`;
    setCurrentAssetId(assetId);
    setCurrentAssetName(file.name);
    setCurrentAssetBlob(file);
    if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    setLocalFileUrl(URL.createObjectURL(file));
    setPlayerMode('local');
    setFeedback("正在分析视频内容（支持识别画面中/英/双语字幕）...");
    
    try {
      setIsTranscribing(true);
      const base64 = await blobToBase64(file);
      const newTranscript = await transcribeMedia(base64, file.type);
      setTranscript(newTranscript);
      setIsTranscribing(false);
      setFeedback(`识别成功！共提取 ${newTranscript.length} 段对话。`);
      processNotationInBatch(newTranscript);
    } catch (err) {
      setIsTranscribing(false);
      setFeedback("视频自动解析失败。请尝试使用‘粘贴剧本’功能。");
    }
  };

  const togglePlay = () => {
    if (playerMode === 'local' && localPlayerRef.current) {
      if (localPlayerRef.current.paused) {
        localPlayerRef.current.play();
      } else {
        localPlayerRef.current.pause();
      }
    }
  };

  const startSync = () => {
    if (syncIntervalRef.current) return;
    syncIntervalRef.current = window.setInterval(() => {
      const time = localPlayerRef.current?.currentTime || 0;
      const line = transcript.find(l => time >= l.startTime && time <= l.endTime);
      if (line && line.id !== activeId) setActiveId(line.id);
    }, 250);
  };

  const stopSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (currentAssetId && !isTranscribing && !isImporting) {
      saveAsset({ id: currentAssetId, name: currentAssetName!, blob: currentAssetBlob!, transcript, timestamp: Date.now() });
    }
  }, [transcript]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      {showImportModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 shadow-3xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black flex items-center gap-3"><Languages className="text-blue-500" /> 智能剧本录入</h3>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              粘贴任何格式：仅英文、仅中文、或乱序的中英混合文本。<br/>
              AI 会自动为您对齐、翻译并生成标准剧本。
            </p>
            <textarea 
              className="w-full h-64 bg-black/40 border border-white/10 rounded-3xl p-6 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-8 custom-scrollbar"
              placeholder="可以直接粘贴 B 站字幕，或者一整段英文/中文文本..."
              value={pastedText}
              disabled={isImporting}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <button 
              onClick={handleManualImport} 
              disabled={isImporting}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
            >
              {isImporting ? <><Loader2 className="animate-spin" /> AI 正在全力处理中...</> : "开始智能导入"}
            </button>
          </div>
        </div>
      )}

      <nav className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-2xl sticky top-0 z-50 flex items-center px-8 gap-10">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><MonitorPlay className="text-white w-6 h-6" /></div>
          <h1 className="text-xl font-black tracking-tighter">EchoSpeak <span className="text-blue-500">Pro</span></h1>
        </div>
        <div className="flex-1 max-w-2xl flex items-center gap-3">
          <label className="bg-white text-slate-950 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" /> 上传视频 (AI 自动转录)
            <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
          </label>
          <button onClick={() => setShowImportModal(true)} className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-blue-600/30 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" /> 粘贴手动剧本
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLibrary(!showLibrary)} className={`p-3 rounded-xl border transition-all ${showLibrary ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}><History className="w-5 h-5" /></button>
          <button onClick={() => setShowLegend(!showLegend)} className={`p-3 rounded-xl border transition-all ${showLegend ? 'bg-blue-600 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}><HelpCircle className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          {showLegend && <NotationLegend />}
          
          <div className="relative aspect-video bg-black rounded-[3rem] shadow-2xl overflow-hidden group border border-white/5 ring-1 ring-white/10">
            {localFileUrl ? (
              <video 
                ref={localPlayerRef} src={localFileUrl} className="w-full h-full object-contain" 
                onPlay={() => { setPlaybackState(PlaybackState.PLAYING); startSync(); }}
                onPause={() => { setPlaybackState(PlaybackState.IDLE); stopSync(); }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                <FileVideo className="w-16 h-16 opacity-20" />
                <p className="font-bold text-sm tracking-widest uppercase">请上传带字幕视频或粘贴剧本</p>
              </div>
            )}
            
            {(isTranscribing || isImporting || notationProgress.total > 0) && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center z-50">
                <div className="relative mb-8">
                  <div className="w-32 h-32 border-4 border-blue-400/10 border-t-blue-500 rounded-full animate-spin"></div>
                  <BrainCircuit className="absolute inset-0 m-auto w-12 h-12 text-blue-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">AI 智能处理中...</h2>
                <p className="text-blue-100/70 text-sm font-medium">
                  {isTranscribing ? '正在根据画面字幕与音频同步剧本...' : 
                   isImporting ? '正在进行双语对齐与翻译补全...' :
                   `正在生成发音节奏谱：${notationProgress.current}/${notationProgress.total}`}
                </p>
              </div>
            )}

            {!isTranscribing && !isImporting && (
              <div className="absolute inset-x-0 bottom-24 px-10 z-20 text-center select-none flex justify-center pointer-events-none">
                <div className="inline-block px-10 py-6 bg-black/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <p className="text-white text-2xl font-black leading-tight tracking-tight drop-shadow-xl">{activeLine?.text || "准备开始跟读"}</p>
                  <p className="text-blue-400/80 text-sm font-bold mt-2 uppercase tracking-[0.2em]">{activeLine?.translation}</p>
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 p-8 flex justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
                <button onClick={togglePlay} className="w-16 h-16 bg-white text-slate-950 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                  {playbackState === PlaybackState.PLAYING ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 min-h-[300px] relative overflow-hidden">
             <div className="flex items-center gap-6 mb-10 relative z-10">
                <div className="p-4 bg-blue-600 rounded-3xl shadow-xl shadow-blue-600/20"><Sparkles className="w-7 h-7 text-white" /></div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">AI 发音谱子 (Shadowing Script)</h2>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">自动标注重音、连读与语调</p>
                </div>
             </div>
             <div className="min-h-[140px] flex items-center justify-center relative z-10">
                {activeLine?.notation ? (
                  <div className="w-full animate-in fade-in zoom-in-95 duration-500">
                    <ProsodyRenderer notation={activeLine.notation} />
                  </div>
                ) : (
                  <div className="text-slate-600 italic font-medium">
                    {notationProgress.total > 0 ? 'AI 正在分析本句节奏...' : '等待剧本加载'}
                  </div>
                )}
             </div>
             {feedback && (
                <div className="mt-10 p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2.5rem] shadow-2xl flex gap-6 items-center animate-in slide-in-from-bottom-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10"><Info className="w-6 h-6" /></div>
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
                  key={line.id} onClick={() => { setActiveId(line.id); if(localPlayerRef.current) localPlayerRef.current.currentTime = line.startTime; }} 
                  className={`p-8 rounded-[2rem] cursor-pointer transition-all border-2 active:scale-[0.98] ${activeId === line.id ? 'bg-blue-600 border-blue-500 text-white shadow-3xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <p className="text-lg font-black mb-2 leading-tight tracking-tight">{line.text}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold opacity-50 italic">{line.translation}</p>
                    {line.notation && <CheckCircle2 className="w-4 h-4 text-white/40" />}
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-10 w-full py-8 rounded-[2rem] bg-slate-900 hover:bg-black transition-all flex flex-col items-center gap-3 group shadow-2xl">
              <div className="p-4 rounded-full bg-blue-600 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30"><Mic className="w-6 h-6 text-white" /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">录制跟读并点评</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
