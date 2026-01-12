import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, X, Languages } from 'lucide-react';
import { TranscriptLine, PlaybackState, MediaAsset } from '@echospeak/types';
import { INITIAL_TRANSCRIPT } from './constants';
import { generateProsodyNotation, bilingualizeText } from '@echospeak/services';
import { HomePage } from './pages/HomePage';
import { VideoLearningPage } from './pages/VideoLearningPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpPage } from './pages/HelpPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { LearnPage } from './pages/LearnPage';
import { PracticePage } from './pages/PracticePage';
import { DashboardPage } from './pages/DashboardPage';
import { MobileBottomNav, TabType } from './components/MobileBottomNav';
import { ThemeProvider } from './contexts/ThemeContext';
import { OnboardingFlow, useOnboarding } from './components/OnboardingFlow';

const DB_NAME = 'EchoSpeakStudioDB_v3';
const STORE_NAME = 'youtube_library';
const LAST_ASSET_KEY = 'echo_speak_last_youtube_id';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
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

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const fetchYouTubeCaptions = async (videoId: string): Promise<TranscriptLine[]> => {
  try {
    console.log('[字幕] 开始请求后端 API 获取字幕...', videoId);
    const apiUrl = process.env.ADMIN_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/youtube/captions?videoId=${videoId}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[字幕] API 返回错误:', errorData);
      return [];
    }
    const data = await response.json();
    if (!data.success || !data.lines || data.lines.length === 0) {
      console.log('[字幕] 未找到字幕数据');
      return [];
    }
    console.log(`[字幕] 成功获取 ${data.lines.length} 条字幕`);
    return data.lines;
  } catch (error) {
    console.error('[字幕] 请求失败:', error);
    return [];
  }
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
      translation: "AI 翻译中...",
    };
  }).filter(x => x !== null) as TranscriptLine[];
};

const AppContent: React.FC = () => {
  // 状态
  const [transcript, setTranscript] = useState<TranscriptLine[]>(INITIAL_TRANSCRIPT);
  const [activeId, setActiveId] = useState<string>(INITIAL_TRANSCRIPT[0]?.id || '');
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFetchingCaptions, setIsFetchingCaptions] = useState(false);
  const [notationProgress, setNotationProgress] = useState({ current: 0, total: 0 });
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(null);
  const [showOverlaySubtitle, setShowOverlaySubtitle] = useState(true);
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const hasGeminiApiKey = Boolean(process.env.API_KEY || process.env.GEMINI_API_KEY);
  const playerRef = useRef<any>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasCompleted } = useOnboarding();

  // 检查是否需要显示引导
  useEffect(() => {
    if (!hasCompleted) {
      setShowOnboarding(true);
    }
  }, [hasCompleted]);

  // 初始化：加载上次使用的视频
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

  // 自动保存到本地库
  useEffect(() => {
    if (currentVideoId && !isFetchingCaptions && !isImporting) {
      saveAsset({
        id: currentVideoId,
        name: currentVideoTitle || `YouTube: ${currentVideoId}`,
        transcript,
        timestamp: Date.now(),
      } as any);
    }
  }, [transcript]);

  // YouTube 播放器回调
  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    console.log('[YouTube] 播放器就绪');
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    if (state === 1) {
      setPlaybackState(PlaybackState.PLAYING);
      startSync();
    } else if (state === 2) {
      setPlaybackState(PlaybackState.IDLE);
      stopSync();
    }
  };

  const loadFromLibrary = (asset: MediaAsset) => {
    setTranscript(asset.transcript);
    setActiveId(asset.transcript[0]?.id || '1');
    setCurrentVideoId(asset.id);
    setCurrentVideoTitle(asset.name);
    localStorage.setItem(LAST_ASSET_KEY, asset.id);
  };

  const handleYouTubeUrlSubmit = async () => {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setFeedback('无效的 YouTube 链接，请检查后重试');
      return;
    }
    setCurrentVideoId(videoId);
    setCurrentVideoTitle(`YouTube: ${videoId}`);
    setYoutubeUrl('');
    setFeedback('视频加载成功！正在尝试获取字幕...');
    setIsFetchingCaptions(true);
    try {
      const captions = await fetchYouTubeCaptions(videoId);
      if (captions.length > 0) {
        setTranscript(captions);
        setActiveId(captions[0]?.id || '1');
        setFeedback(`视频已播放！成功获取 ${captions.length} 条字幕，正在 AI 翻译...`);
        if (hasGeminiApiKey) {
          processNotationInBatch(captions);
        } else {
          setIsFetchingCaptions(false);
        }
      } else {
        setIsFetchingCaptions(false);
        setFeedback('视频已播放！未找到自动字幕，您可以点击"手动剧本"添加字幕文本');
      }
    } catch (error) {
      setIsFetchingCaptions(false);
      setFeedback('视频已播放！字幕获取失败，您可以点击"手动剧本"手动添加字幕');
    }
  };

  const handleManualImport = async () => {
    if (!pastedText.trim() || isImporting) return;
    setIsImporting(true);
    setFeedback("AI 正在解析您的文本，智能补全双语对照...");
    try {
      let newLines: TranscriptLine[] = [];
      if (pastedText.includes('-->')) {
        const parsed = parseSRT(pastedText);
        newLines = parsed;
      } else {
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

  const startSync = () => {
    if (syncIntervalRef.current) return;
    syncIntervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        const line = transcript.find(l => time >= l.startTime && time <= l.endTime);
        if (line && line.id !== activeId) setActiveId(line.id);
      }
    }, 250);
  };

  const stopSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  // 根据路径确定当前标签
  const getActiveTab = (): TabType => {
    switch (location.pathname) {
      case '/learn':
        return 'learn';
      case '/practice':
        return 'practice';
      case '/discover':
        return 'favorites'; // Discover uses favorites tab as secondary
      case '/favorites':
        return 'favorites';
      case '/profile':
      case '/help':
        return 'profile'; // 帮助中心也在"我的"标签
      case '/video':
      case '/video/:id':
        return 'practice'; // 视频学习页面显示练习tab
      default:
        return 'home';
    }
  };

  // 处理导航到视频学习页面
  const handleNavigateToVideo = (videoId: string) => {
    navigate(`/video/${videoId}`);
    // 这里可以添加加载视频数据的逻辑
    setCurrentVideoId(videoId);
  };

  // 处理引导完成
  const handleOnboardingComplete = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setUserLevel(level);
    setShowOnboarding(false);
  };

  // 处理跳过引导
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {/* 引导页 */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* 导入模态框 */}
      {!showOnboarding && showImportModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2rem] p-8 shadow-3xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black flex items-center gap-3">
                <Languages className="text-blue-500" /> 智能剧本录入
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              粘贴任何格式：仅英文、仅中文、或乱序的中英混合文本。<br/>
              AI 会自动为您对齐、翻译并生成标准剧本。
            </p>
            <textarea
              className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-6 custom-scrollbar"
              placeholder="可以直接粘贴 B 站字幕，或者一整段英文/中文文本..."
              value={pastedText}
              disabled={isImporting}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <button
              onClick={handleManualImport}
              disabled={isImporting}
              className="w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
            >
              {isImporting ? (
                <>
                  <Loader2 className="animate-spin" /> AI 正在全力处理中...
                </>
              ) : (
                "开始智能导入"
              )}
            </button>
          </div>
        </div>
      )}

      {/* 路由 */}
      {!showOnboarding && (
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onNavigateToVideo={handleNavigateToVideo}
                userLevel={userLevel}
              />
            }
          />
          <Route
            path="/video/:id"
            element={
              <VideoLearningPage
                videoId={currentVideoId}
                transcript={transcript}
                activeId={activeId}
                onActiveLineChange={setActiveId}
                playbackState={playbackState}
                playerRef={playerRef}
                onPlayerReady={onPlayerReady}
                onPlayerStateChange={onPlayerStateChange}
                notationProgress={notationProgress}
                isImporting={isImporting}
                feedback={feedback}
                showOverlaySubtitle={showOverlaySubtitle}
                onToggleSubtitle={() => setShowOverlaySubtitle(!showOverlaySubtitle)}
              />
            }
          />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Routes>
      )}

      {/* 底部导航 - 只在移动端显示，且不在引导页时 */}
      {!showOnboarding && (
        <MobileBottomNav activeTab={getActiveTab()} onTabChange={(tab) => {
          const routes: Record<TabType, string> = {
          home: '/',
          learn: '/learn',
          practice: '/practice',
          favorites: '/favorites',
          profile: '/profile',
        };
        window.location.href = routes[tab];
      }} />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;
