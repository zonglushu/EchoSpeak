'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ProsodyRenderer, NotationLegend } from '@echospeak/ui';
import type { NotationGuide, AdminTranscriptLine } from '@echospeak/types';
import { useTranscriptStore } from '@/stores/transcriptStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  CheckCircle2,
  Loader2,
  MonitorSpeaker,
  Sparkles,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Play,
  RotateCcw,
  Zap,
  Eye,
  Trash2,
} from 'lucide-react';
import { VideoGridSelector } from '@/components/video/VideoGridSelector';
import { ResizableProsodyLayout } from './ResizableProsodyLayout';

const legend: NotationGuide[] = [
  { symbol: '**FOCUS**', description: '主重音 / 句子焦点', example: '**keep** going', color: 'text-rose-500' },
  { symbol: '*soft stress*', description: '次重音，保持旋律', example: "*incredible*", color: 'text-slate-500' },
  { symbol: '[ə]', description: '弱读 / 模糊化', example: 'of → [ə]v', color: 'text-green-500' },
  { symbol: '_', description: '连读、吞音', example: 'pick_it_up', color: 'text-orange-500' },
  { symbol: '↗ ↘', description: '升降调，语气变化', example: '↗really ↘now', color: 'text-blue-500' },
  { symbol: '| ||', description: '短/长停顿', example: 'Ready | Set || Go', color: 'text-purple-500' },
];

interface NotationResult {
  id: string;
  notation: string;
}

interface MediaAsset {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  source_url?: string;
  cover_url?: string;
  status?: string;
  tag_list?: string[];
}

export const ProsodyPanel = () => {
  const { lines, selectedIds, setSelected, updateLine, importFromFile } = useTranscriptStore();
  const { selectedAssetId, selectedAssetName, selectAsset } = useWorkflowStore();

  const [logs, setLogs] = useState<{ id: string; message: string; status: 'running' | 'success' | 'failed' }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0); // 当前播放到的字幕索引
  const [seekToTime, setSeekToTime] = useState<((time: number) => void) | null>(null); // 视频跳转函数
  const [isAutoPlay, setIsAutoPlay] = useState(false); // 是否自动播放下一句
  const [isLoopPlay, setIsLoopPlay] = useState(false); // 是否循环播放当前句
  const subtitleListRef = useRef<HTMLDivElement>(null); // 字幕列表容器引用

  const selectedLine = useMemo(() => {
    if (currentLineIndex >= 0 && currentLineIndex < lines.length) {
      return lines[currentLineIndex];
    }
    return lines[0];
  }, [lines, currentLineIndex]);

  // 加载视频列表
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoadingAssets(true);
      try {
        const response = await fetch('/api/assets?limit=20');
        if (response.ok) {
          const data = await response.json();
          setAssets(data.assets || []);
        }
      } catch (error) {
        console.error('加载视频列表失败:', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  // 加载选中视频的字幕
  const loadSubtitles = useCallback(async (assetId: string) => {
    setIsLoadingSubtitles(true);
    try {
      const response = await fetch(`/api/transcripts/${assetId}`);
      if (!response.ok) {
        // 该视频暂无字幕，这是正常情况
        console.warn('该视频暂无字幕数据');
        return;
      }

      const data = await response.json();
      if (data.transcripts && data.transcripts.length > 0) {
        importFromFile(data.transcripts);
      }
    } catch (error) {
      console.error('Failed to load subtitles:', error);
    } finally {
      setIsLoadingSubtitles(false);
    }
  }, [importFromFile]);

  // 当选中的资源变化时，加载其字幕数据
  useEffect(() => {
    if (!selectedAssetId) {
      // 没有选择资源，清空字幕
      importFromFile([]);
      setSelected([]);
      return;
    }

    // 加载该视频的字幕
    loadSubtitles(selectedAssetId);
  }, [selectedAssetId, importFromFile, loadSubtitles, setSelected]);

  // 当当前字幕索引变化时，自动滚动到可见区域
  useEffect(() => {
    if (currentLineIndex >= 0 && subtitleListRef.current) {
      const container = subtitleListRef.current;
      const subtitleItems = container.querySelectorAll('[data-subtitle-index]');
      const currentItem = subtitleItems[currentLineIndex] as HTMLElement;

      if (currentItem) {
        // 使用 scrollIntoView 自动滚动到视野中
        currentItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentLineIndex]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelected(selectedIds.filter((item) => item !== id));
    } else {
      setSelected([...selectedIds, id]);
    }
  };

  const canGenerate = lines.length > 0 && selectedAssetId;

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

  // 跳转到指定字幕
  const jumpToLine = (index: number) => {
    if (index < 0 || index >= lines.length) return;
    setCurrentLineIndex(index);
    const line = lines[index];
    if (line.startTime !== undefined && seekToTime) {
      seekToTime(line.startTime);
    }
  };

  // 批量生成全部发音谱
  const generateAll = async () => {
    if (!canGenerate || lines.length === 0) return;
    
    setIsGenerating(true);
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        message: `正在为全部 ${lines.length} 句生成发音谱…`,
        status: 'running',
      },
      ...prev,
    ]);
    
    try {
      const response = await fetch('/api/ai/notation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sentences: lines.map((line) => ({ id: line.id, text: line.text })) 
        }),
      });
      
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'AI 打谱失败');
      }
      
      (payload.results as NotationResult[]).forEach(({ id, notation }: NotationResult) => {
        updateLine(id, { notation, status: 'ready' });
      });
      
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          message: `✅ 完成 ${payload.results.length} 条发音谱，耗时 ${(payload?.durationMs ?? 0) / 1000}s`,
          status: 'success',
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          message: '❌ 批量生成失败，请重试',
          status: 'failed',
        },
        ...prev,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 重新生成选中的发音谱
  const regenerateSelected = async () => {
    if (!canGenerate || selectedIds.length === 0) return;
    
    const targets = lines.filter((line) => selectedIds.includes(line.id));
    if (!targets.length) return;

    setIsGenerating(true);
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        message: `正在重新生成 ${targets.length} 句发音谱…`,
        status: 'running',
      },
      ...prev,
    ]);
    
    try {
      const response = await fetch('/api/ai/notation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sentences: targets.map((line) => ({ id: line.id, text: line.text })) 
        }),
      });
      
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'AI 打谱失败');
      }
      
      (payload.results as NotationResult[]).forEach(({ id, notation }: NotationResult) => {
        updateLine(id, { notation, status: 'ready' });
      });
      
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          message: `✅ 重新生成完成 ${payload.results.length} 条`,
          status: 'success',
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          message: '❌ 重新生成失败，请重试',
          status: 'failed',
        },
        ...prev,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 清除选中的发音谱
  const clearSelected = () => {
    if (selectedIds.length === 0) return;
    
    selectedIds.forEach((id) => {
      updateLine(id, { notation: undefined });
    });
    
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        message: `🗑️ 已清除 ${selectedIds.length} 条发音谱`,
        status: 'success',
      },
      ...prev,
    ]);
  };

  const runNotation = async () => {
    if (!canGenerate) return;
    
    const targets = selectedIds.length ? lines.filter((line) => selectedIds.includes(line.id)) : lines.slice(0, 3);
    if (!targets.length) return;
    setIsGenerating(true);
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        message: `正在为 ${targets.length} 句生成发音谱…`,
        status: 'running',
      },
      ...prev,
    ]);
    try {
      const response = await fetch('/api/ai/notation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences: targets.map((line) => ({ id: line.id, text: line.text })) }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'AI 打谱失败');
      }
      (payload.results as NotationResult[]).forEach(({ id, notation }: NotationResult) => {
        updateLine(id, { notation, status: 'ready' });
      });
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          message: `完成 ${payload.results.length} 条发音谱，耗时 ${(payload?.durationMs ?? 0) / 1000}s`,
          status: 'success',
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      setLogs((prev) => [
        {
          id: crypto.randomUUID(),
          message: '打谱失败，请重试',
          status: 'failed',
        },
        ...prev,
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="glass-panel rounded-3xl border border-white/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex-1">
          <p className="text-lg font-semibold text-slate-900">AI 发音谱生成</p>
          <p className="text-sm text-slate-500">
            {selectedAssetName ? `正在处理: ${selectedAssetName}` : '请选择要处理的视频'}
          </p>
        </div>

        {/* 切换视频按钮 */}
        <button
          type="button"
          onClick={() => {
            selectAsset(null, null, null);
            importFromFile([]);
            setSelected([]);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className="h-4 w-4 text-slate-400" />
          切换视频
        </button>
      </div>

      {/* 如果没有选择视频，显示视频选择卡片 */}
      {!selectedAssetId ? (
        <div className="min-h-[400px]">
          <VideoGridSelector
            assets={assets}
            isLoading={isLoadingAssets}
            pageSize={9}
            onSelect={(asset) => {
              selectAsset(asset.id, asset.title, asset.source_url);
            }}
            hoverIcon={MonitorSpeaker}
            hoverText="点击选择"
          />
        </div>
      ) : (
        <>
          {/* 顶部操作栏 */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">
                已选择 <span className="font-semibold text-primary">{selectedIds.length}</span> / {lines.length} 句
              </div>
              {lines.some((line) => line.notation) && (
                <div className="text-xs text-emerald-600">
                  已生成 {lines.filter((line) => line.notation).length} 条
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateAll}
                disabled={isGenerating || !canGenerate}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 transition"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                批量生成全部
              </button>
              
              <button
                type="button"
                onClick={regenerateSelected}
                disabled={isGenerating || selectedIds.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
              >
                <RotateCcw className="h-4 w-4" />
                重新生成选中
              </button>
              
              <button
                type="button"
                onClick={clearSelected}
                disabled={selectedIds.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition"
              >
                <Trash2 className="h-4 w-4" />
                清除选中
              </button>
            </div>
          </div>

          {/* 新布局：可调整大小的分割面板 */}
          <ResizableProsodyLayout
            lines={lines}
            selectedIds={selectedIds}
            selectedAssetId={selectedAssetId}
            selectedAssetSourceUrl={assets.find((a) => a.id === selectedAssetId)?.source_url}
            onToggleSelect={toggleSelect}
            onRegenerateSelected={regenerateSelected}
            onJumpToLine={jumpToLine}
            isGenerating={isGenerating}
          />

          {/* 执行日志（折叠） */}
          {logs.length > 0 && (
            <details className="mt-4 pt-4 border-t border-slate-200">
              <summary className="text-xs font-medium text-slate-500 cursor-pointer hover:text-slate-700">
                执行日志 ({logs.length})
              </summary>
              <div className="mt-2 space-y-1 text-xs max-h-32 overflow-auto">
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center gap-2 ${
                      log.status === 'success' ? 'text-emerald-600' :
                      log.status === 'failed' ? 'text-rose-600' : 'text-slate-600'
                    }`}
                  >
                    {log.status === 'running' && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                    {log.status === 'success' && <CheckCircle2 className="h-3 w-3 flex-shrink-0" />}
                    {log.status === 'failed' && <AlertCircle className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{log.message}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* 符号说明 */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">符号说明</p>
            <NotationLegend guide={legend} title="" />
          </div>
        </>
      )}
    </section>
  );
};
