'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  AlertCircle,
  Download,
  FileDown,
  Lock,
  RefreshCw,
  Sparkles,
  Unlock,
  Upload,
  Loader2,
  CheckCircle2,
  Play,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import type { AdminTranscriptLine, UploadJob, StageSpecificStatus } from '@echospeak/types';
import {
  getStatusLabel,
  TRANSCRIBE_STAGE_STATUS_LABELS,
} from '@echospeak/types';
import { useTranscriptStore } from '@/stores/transcriptStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import { exportAsCsv, exportAsJson, parseTimedText } from '@/utils/srt';
import { YouTubePlayer } from '@/components/video/YouTubePlayer';
import { LocalVideoPlayer } from '@/components/video/LocalVideoPlayer';
import { VideoGridSelector } from '@/components/video/VideoGridSelector';

type TranscribeStatus = 'idle' | 'transcribing' | 'success' | 'failed';

// 转写进度步骤
const TRANSCRIBE_STEPS: Array<{
  key: StageSpecificStatus;
  label: string;
  progress: number;
}> = [
  { key: 'detecting_source', label: '检测视频源', progress: 10 },
  { key: 'downloading', label: '下载视频', progress: 20 },
  { key: 'extracting_subtitles', label: '提取字幕', progress: 40 },
  { key: 'transcribing_audio', label: 'AI转写', progress: 60 },
  { key: 'analyzing_language', label: '分析语言', progress: 70 },
  { key: 'translating', label: '翻译字幕', progress: 85 },
  { key: 'saving_database', label: '保存数据库', progress: 95 },
];

// 提取 YouTube Video ID（用于 YouTube 播放器）
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

export const SubtitleWorkbench = () => {
  const { lines, importFromFile, updateLine, selectedIds, setSelected } = useTranscriptStore();
  const { selectedAssetId, selectedAssetName, selectAsset } = useWorkflowStore();

  const [activeId, setActiveId] = useState<string | null>(lines[0]?.id ?? null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState<string | null>(null);
  const [transcribeStatus, setTranscribeStatus] = useState<TranscribeStatus>('idle');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [currentStageStatus, setCurrentStageStatus] = useState<StageSpecificStatus | null>(null);
  const [currentProgress, setCurrentProgress] = useState<number>(0); // ← 添加实际进度状态
  const [transcribeJobId, setTranscribeJobId] = useState<string | null>(null);
  const [pipelineId, setPipelineId] = useState<string | null>(null); // ← 添加 pipelineId 追踪
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  
  // 视频跳转函数 - 由播放器组件提供
  const [seekToTime, setSeekToTime] = useState<((time: number) => void) | null>(null);
  
  // 使用 ref 来追踪轮询定时器，确保能正确清理
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用 ref 保存最新进度，用于动态调整轮询间隔（避免闭包陷阱）
  const latestProgressRef = useRef<number>(0);

  const activeLine = useMemo(() => lines.find((line) => line.id === activeId), [lines, activeId]);

  // 自动滚动到当前激活的字幕
  useEffect(() => {
    if (selectedIds.length > 0) {
      const firstSelectedId = selectedIds[0];
      const element = document.getElementById(`subtitle-${firstSelectedId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  }, [selectedIds]);

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

  // 当选中的资源变化时，加载其字幕数据
  useEffect(() => {
    if (!selectedAssetId) {
      // 没有选择资源，清空字幕
      importFromFile([]);
      setTranscribeStatus('idle');
      return;
    }

    // 加载该视频的现有字幕
    loadExistingSubtitles(selectedAssetId);
  }, [selectedAssetId]);

  useEffect(() => {
    if (!lines.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !lines.some((line) => line.id === activeId)) {
      setActiveId(lines[0].id);
      setSelected([lines[0].id]);
    }
  }, [activeId, lines, setSelected]);

  // 加载视频现有的字幕
  const loadExistingSubtitles = useCallback(async (assetId: string) => {
    try {
      console.log('🔍 开始加载字幕，assetId:', assetId);
      const response = await fetch(`/api/transcripts/${assetId}`);
      console.log('📥 字幕 API 响应状态:', response.status);
      
      if (!response.ok) {
        console.log('⚠️ 该视频暂无字幕');
        // 该视频暂无字幕，这是正常情况
        return;
      }

      const data = await response.json();
      console.log('📊 字幕数据:', data);
      
      if (data.transcripts && data.transcripts.length > 0) {
        console.log('✅ 加载了', data.transcripts.length, '条字幕');
        importFromFile(data.transcripts);
        setTranscribeStatus('success');
      } else {
        console.log('⚠️ 字幕数据为空');
      }
    } catch (error) {
      console.error('❌ 加载字幕失败:', error);
    }
  }, [importFromFile]);

  // 当选中的资源变化时，加载其字幕数据
  useEffect(() => {
    if (!selectedAssetId) {
      // 没有选择资源，清空字幕
      importFromFile([]);
      setTranscribeStatus('idle');
      return;
    }

    // 加载该视频的现有字幕
    loadExistingSubtitles(selectedAssetId);
  }, [selectedAssetId, importFromFile, loadExistingSubtitles]);
  
  // 监听翻译任务完成，自动刷新字幕
  useEffect(() => {
    if (!selectedAssetId) return;
    
    // 动态导入 Supabase 客户端
    import('@/lib/supabase/client').then(({ supabase }) => {
      // 订阅 pipeline_stages 表的 UPDATE 事件
      const channel = supabase
        .channel(`subtitle_updates:${selectedAssetId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pipeline_stages',
            filter: `asset_id=eq.${selectedAssetId}`,
          },
          (payload: { new: { stage: string; status: string } }) => {
            // 检查是否是翻译任务完成
            const newRecord = payload.new;
            if (newRecord.stage === 'translate' && newRecord.status === 'completed') {
              console.warn('[实时监听] 翻译任务完成，重新加载字幕！');
              
              // 重新加载字幕数据
              loadExistingSubtitles(selectedAssetId);
            }
          }
        )
        .subscribe();
      
      // 清理函数
      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [selectedAssetId, loadExistingSubtitles]);

  // 注释掉：不要根据字幕数据自动设置 success
  // 因为转写完成后可能还有翻译任务在运行
  // 应该让轮询逻辑来判断整个 pipeline 是否完成
  
  // useEffect(() => {
  //   if (selectedAssetId && lines.length > 0) {
  //     // 如果已经有字幕数据，说明转写已完成
  //     setTranscribeStatus('success');
  //   }
  // }, [selectedAssetId, lines.length]);

  // 轮询转写任务状态
  useEffect(() => {
    // 清理之前的定时器
    if (pollIntervalRef.current) {
      console.log('🧹 [轮询] 清理之前的定时器');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // 只有在转写中才轮询
    if (!transcribeJobId || transcribeStatus !== 'transcribing') {
      console.log('⏸️ [轮询] 不满足轮询条件:', {
        hasJobId: !!transcribeJobId,
        status: transcribeStatus
      });
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 [轮询] 开始轮询任务状态');
    console.log('   ├─ Job ID:', transcribeJobId);
    console.log('   └─ Pipeline ID:', pipelineId || '(未设置)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let pollCount = 0;

    // 立即执行一次检查
    const checkJobStatus = async () => {
      pollCount++;
      console.log(`🔍 [轮询 #${pollCount}] 检查任务状态...`);
      console.log(`   ├─ 有 pipelineId: ${!!pipelineId}`);
      console.log(`   └─ 将使用 ${pipelineId ? 'Pipeline' : 'Job'} 模式查询`);
      
      try {
        // 如果有 pipelineId，查询整个 pipeline 的所有 stage
        const url = pipelineId 
          ? `/api/jobs?pipelineId=${pipelineId}&limit=100`
          : `/api/jobs`;
        
        console.log(`   └─ 查询 URL: ${url}`);
        const response = await fetch(url);
        console.log(`📡 [轮询 #${pollCount}] API 响应:`, response.status);
        
        if (!response.ok) {
          console.warn(`⚠️ [轮询 #${pollCount}] API 返回非 200 状态`);
          return false;
        }

        const data = await response.json();
        
        if (pipelineId) {
          // 检查整个 pipeline 的所有 stage
          const allStages = data.jobs || [];
          console.log(`📊 [轮询 #${pollCount}] Pipeline 状态 (${allStages.length} stages):`, 
            allStages.map((s: UploadJob) => `${s.stage}:${s.stageStatus}`).join(', ')
          );
          
          if (allStages.length === 0) {
            console.warn(`⚠️ [轮询 #${pollCount}] 未找到 Pipeline:`, pipelineId);
            return false;
          }
          
          // 检查是否所有 stage 都完成了
          const allCompleted = allStages.every((s: UploadJob) => s.stageStatus === 'completed');
          const anyFailed = allStages.some((s: UploadJob) => s.stageStatus === 'error');
          
          // 找到当前正在运行的 stage（用于显示状态标签）
          const runningStage = allStages.find((s: UploadJob) => 
            s.stageStatus !== 'completed' && s.stageStatus !== 'error'
          );
          
          const currentStage = runningStage || allStages[allStages.length - 1];
          
          // 计算整个 pipeline 的总体进度
          // 不同 stage 有不同的权重（因为耗时不同）
          const stageWeights: Record<string, number> = {
            'transcribe': 0.7,  // 转写占 70%
            'translate': 0.3,   // 翻译占 30%
          };
          
          let totalWeight = 0;
          let weightedProgress = 0;
          
          allStages.forEach((stage: UploadJob) => {
            const weight = stageWeights[stage.stage] || 1;
            const stageProgress = stage.stageStatus === 'completed' 
              ? 100 
              : (stage.progress || 0);
            
            weightedProgress += stageProgress * weight;
            totalWeight += weight;
          });
          
          const totalProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;
          
          if (currentStage) {
            console.log(`📊 [轮询 #${pollCount}] 当前阶段:`, {
              stage: currentStage.stage,
              stageStatus: currentStage.stageStatus,
              stageProgress: currentStage.progress + '%',
              totalProgress: Math.round(totalProgress) + '%'
            });
            
            // 更新UI状态和进度（使用总体进度）
            setCurrentStageStatus(currentStage.stageStatus || null);
            setCurrentProgress(Math.round(totalProgress));
            latestProgressRef.current = Math.round(totalProgress);
          }
          
          if (allCompleted) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ [轮询] 整个 Pipeline 完成！');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            setTranscribeStatus('success');
            setCurrentStageStatus('completed');
            setCurrentProgress(100);
            setProgressMessage(null);

            // 重新加载字幕
            if (selectedAssetId) {
              console.log('📥 [轮询] 开始加载字幕...');
              await loadExistingSubtitles(selectedAssetId);
            }
            return true; // 返回 true 表示应该停止轮询
          }
          
          if (anyFailed) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ [轮询] Pipeline 中有任务失败！');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            setTranscribeStatus('failed');
            setTranscribeError('处理任务失败');
            setProgressMessage(null);
            setCurrentProgress(0);
            return true; // 返回 true 表示应该停止轮询
          }
          
          return false; // 继续轮询
        } else {
          // 旧的逻辑：只检查单个 job
          const job = data.jobs?.find((j: UploadJob) => j.id === transcribeJobId);

          if (!job) {
            console.warn(`⚠️ [轮询 #${pollCount}] 未找到 Job:`, transcribeJobId);
            return false;
          }

          console.log(`📊 [轮询 #${pollCount}] 任务状态:`, {
            jobId: job.id,
            stageStatus: job.stageStatus,
            progress: job.progress + '%',
            stage: job.stage,
            status: job.status
          });

          if (job.payload) {
            console.log(`   └─ Payload:`, job.payload);
          }

          // 检查是否是终止状态
          if (job.stageStatus === 'completed') {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ [轮询] 任务完成！');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            setTranscribeStatus('success');
            setCurrentStageStatus('completed');
            setCurrentProgress(100);
            setProgressMessage(null);

            // 重新加载字幕
            if (selectedAssetId) {
              console.log('📥 [轮询] 开始加载字幕...');
              await loadExistingSubtitles(selectedAssetId);
            }
            return true; // 返回 true 表示应该停止轮询
          }
          
          if (job.stageStatus === 'error') {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ [轮询] 任务失败！');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            setTranscribeStatus('failed');
            setTranscribeError('转写任务失败');
            setProgressMessage(null);
            setCurrentProgress(0);
            return true; // 返回 true 表示应该停止轮询
          }

          // 更新UI状态和进度
          console.log(`✅ [轮询 #${pollCount}] 更新 UI:`, {
            stageStatus: job.stageStatus,
            progress: job.progress
          });
          
          setCurrentStageStatus(job.stageStatus || null);
          setCurrentProgress(job.progress || 0);
          
          // 更新最新进度到 ref，供轮询间隔计算使用
          latestProgressRef.current = job.progress || 0;
          
          // 提取进度消息（如果有）
          if (job.payload && typeof job.payload === 'object') {
            const payload = job.payload as Record<string, unknown>;
            if (payload.message && typeof payload.message === 'string') {
              console.log(`💬 [轮询 #${pollCount}] 进度消息:`, payload.message);
              setProgressMessage(payload.message);
            }
          }
        }
        
        console.log(`⏭️ [轮询 #${pollCount}] 继续轮询...`);
        return false; // 返回 false 表示继续轮询
      } catch (error) {
        console.error(`❌ [轮询 #${pollCount}] 错误:`, error);
        if (error instanceof Error) {
          console.error('   错误详情:', error.message);
        }
        return false;
      }
    };

    // 智能轮询策略：根据进度动态调整轮询间隔
    // - 初期（0-30%）：每 3 秒（检测源、下载阶段）
    // - 中期（30-70%）：每 2 秒（提取字幕阶段）
    // - 后期（70%+）：每 3 秒（翻译阶段，AI 响应慢，不需要太频繁）
    const getPollingInterval = (progress: number) => {
      if (progress < 30) return 3000;
      if (progress < 70) return 2000;
      return 3000; // 翻译阶段使用更长间隔，减少数据库压力
    };
    
    const schedulePoll = () => {
      // 根据最新进度计算间隔
      const interval = getPollingInterval(latestProgressRef.current);
      
      pollIntervalRef.current = setTimeout(async () => {
        const shouldStop = await checkJobStatus();
        
        // 更新最新进度（从 checkJobStatus 内部更新的 state）
        // 注意：这里我们需要在 checkJobStatus 返回 job 数据
        
        if (shouldStop && pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        } else {
          // 递归调度下一次轮询
          schedulePoll();
        }
      }, interval);
    };

    // 立即执行一次检查
    checkJobStatus();
    
    // 开始轮询
    schedulePoll();

    // 清理函数
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [transcribeJobId, pipelineId, transcribeStatus, selectedAssetId, loadExistingSubtitles]);

  // 自动转写功能
  const autoTranscribe = useCallback(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [转写流程] 开始自动转写');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!selectedAssetId) {
      console.error('❌ [转写流程] 错误：未选择视频');
      setTranscribeError('请先选择视频');
      return;
    }

    console.log('📋 [转写流程] Asset ID:', selectedAssetId);
    
    setTranscribeStatus('transcribing');
    setTranscribeError(null);
    setCurrentStageStatus('detecting_source');
    setCurrentProgress(0);
    console.log('✅ [转写流程] 状态初始化完成');

    try {
      // 立即开始轮询 - 通过 assetId 查找对应的 job
      // API 会创建 job，我们通过轮询发现它
      const startPolling = async (attemptNum: number = 0) => {
        console.log(`🔍 [Job查找] 尝试 #${attemptNum + 1} - 查询转写任务...`);
        
        try {
          // 使用 assetId 参数直接查询该资源的任务
          // 注意：只查询 status=queued 或 status=running 的任务，排除已完成的
          const queryUrl = `/api/jobs?assetId=${selectedAssetId}&type=transcribe&limit=10`;
          console.log(`🌐 [Job查找] 请求 URL:`, queryUrl);
          
          const response = await fetch(queryUrl);
          console.log(`📡 [Job查找] 响应状态:`, response.status, response.statusText);
          
          if (!response.ok) {
            console.warn(`⚠️ [Job查找] API 返回非 200 状态:`, response.status);
            return;
          }
          
          const data = await response.json();
          console.log(`📦 [Job查找] 返回数据:`, {
            hasJobs: !!data.jobs,
            jobCount: data.jobs?.length || 0,
            allJobs: data.jobs?.map((j: UploadJob) => ({
              id: j.id.slice(0, 8),
              status: j.status,
              stageStatus: j.stageStatus,
              progress: j.progress
            }))
          });
          
          // 获取最新的进行中的转写任务（排除已完成的）
          if (data.jobs && data.jobs.length > 0) {
            // 找第一个非完成状态的任务
            const job = data.jobs.find((j: UploadJob) => 
              j.status !== 'completed' && j.stageStatus !== 'completed'
            ) || data.jobs[0]; // 如果都是完成的，就用第一个
            
            console.log('✅ [Job查找] 找到转写任务!');
            console.log('   ├─ Job ID:', job.id);
            console.log('   ├─ 状态:', job.stageStatus);
            console.log('   ├─ 进度:', job.progress + '%');
            console.log('   ├─ 阶段:', job.stage);
            console.log('   ├─ 通用状态:', job.status);
            console.log('   └─ 创建时间:', job.createdAt);
            
            // 如果找到的是已完成的旧任务，不要更新进度
            if (job.stageStatus === 'completed' && job.progress === 100) {
              console.log('⚠️ [Job查找] 这是一个已完成的旧任务，等待新任务创建...');
              return;
            }
            
            setTranscribeJobId(job.id);
            // 立即更新一次状态
            setCurrentStageStatus(job.stageStatus);
            setCurrentProgress(job.progress || 0);
            
            console.log('✅ [Job查找] 状态已更新到 UI:', {
              stageStatus: job.stageStatus,
              progress: job.progress
            });
          } else {
            console.log('⏳ [Job查找] 还没有找到转写任务，继续查找...');
          }
        } catch (error) {
          console.error('❌ [Job查找] 查找任务失败:', error);
          if (error instanceof Error) {
            console.error('   错误详情:', error.message);
            console.error('   错误堆栈:', error.stack);
          }
        }
      };

      // 先尝试查找一次
      console.log('🔄 [Job查找] 立即执行第一次查找');
      await startPolling(0);
      
      // 然后每秒查找一次，最多 5 次
      console.log('⏱️ [Job查找] 启动定时查找（每秒一次，最多5次）');
      let attempts = 0;
      const findJobInterval = setInterval(async () => {
        attempts++;
        console.log(`⏱️ [Job查找] 定时器触发，尝试 #${attempts + 1}`);
        
        if (attempts > 5) {
          console.log('⏹️ [Job查找] 达到最大尝试次数（5次），停止查找');
          clearInterval(findJobInterval);
          return;
        }
        await startPolling(attempts);
      }, 1000);

      // 调用转写 API（这是一个长时间运行的请求）
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🌐 [API调用] 开始调用转写 API');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const apiStartTime = Date.now();
      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: selectedAssetId }),
      });

      const apiDuration = ((Date.now() - apiStartTime) / 1000).toFixed(2);
      console.log(`⏱️ [API调用] API 响应耗时: ${apiDuration}秒`);
      console.log(`📡 [API调用] 响应状态: ${response.status} ${response.statusText}`);

      clearInterval(findJobInterval);
      console.log('⏹️ [Job查找] 停止定时查找');

      if (!response.ok) {
        console.error('❌ [API调用] API 返回错误状态');
        const error = await response.json();
        console.error('   错误信息:', error);
        throw new Error(error.error || '转写失败');
      }

      const data = await response.json();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 [API调用] 转写 API 返回数据:');
      console.log('   ├─ 有 Job ID:', !!data.jobId);
      console.log('   ├─ Job ID:', data.jobId);
      console.log('   ├─ 有 Pipeline ID:', !!data.pipelineId);
      console.log('   ├─ Pipeline ID:', data.pipelineId);
      console.log('   ├─ 有字幕数据:', !!data.transcripts);
      console.log('   └─ 字幕数量:', data.transcripts?.length || 0);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 更新为真实的 jobId 和 pipelineId
      if (data.jobId) {
        console.log('✅ [API调用] 更新 Job ID:', data.jobId);
        setTranscribeJobId(data.jobId);
      }
      
      if (data.pipelineId) {
        console.log('✅ [API调用] 更新 Pipeline ID:', data.pipelineId);
        setPipelineId(data.pipelineId);
      }

      if (data.transcripts && data.transcripts.length > 0) {
        console.log('✅ [转写完成] 转写成功，导入字幕');
        console.log('   └─ 字幕数量:', data.transcripts.length, '条');
        
        importFromFile(data.transcripts);
        
        // ⚠️ 不要在这里设置 success！让轮询继续监控整个 pipeline
        // 包括可能的翻译任务
        console.log('✅ [转写完成] 字幕已导入，继续监控 pipeline 状态');
      } else {
        console.log('⚠️ [转写完成] API 返回的字幕数据为空');
        console.log('🔄 [转写完成] 尝试重新加载字幕...');
        
        // 尝试重新加载字幕
        await loadExistingSubtitles(selectedAssetId);
        
        // ⚠️ 不要在这里设置 success！让轮询继续监控
        console.log('✅ [转写完成] 字幕已加载，继续监控 pipeline 状态');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 [转写流程] 转写 API 调用完成，字幕已导入');
      console.log('⏳ [转写流程] 继续轮询监控 pipeline 状态（包括翻译任务）');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [转写流程] 转写失败!');
      console.error('   错误对象:', error);
      
      if (error instanceof Error) {
        console.error('   错误类型:', error.name);
        console.error('   错误消息:', error.message);
        console.error('   错误堆栈:', error.stack);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      setTranscribeStatus('failed');
      setTranscribeError(error instanceof Error ? error.message : '自动转写失败');
      setCurrentStageStatus(null);
      setCurrentProgress(0);
    }
  }, [selectedAssetId, importFromFile, loadExistingSubtitles]);

  const setEditing = (line: AdminTranscriptLine) => {
    setActiveId(line.id);
    if (!selectedIds.includes(line.id)) {
      setSelected([line.id]);
    }
  };

  const handleFile = useCallback(
    async (file: File) => {
      try {
        setIsImporting(true);
        setImportError(null);
        const content = await file.text();
        const parsed = parseTimedText(content);
        if (!parsed.length) {
          throw new Error('解析失败，请确认文件是有效的 SRT/VTT/文本');
        }
        importFromFile(parsed);
        setTranscribeStatus('success');
        setImportError(null);
      } catch (error) {
        console.error(error);
        setImportError('无法解析文件，请检查格式。');
      } finally {
        setIsImporting(false);
      }
    },
    [importFromFile]
  );

  const acceptSuggestion = (id: string) => {
    const suggestion = pendingDiff[id];
    if (!suggestion) return;
    updateLine(id, { translation: suggestion, status: 'ready' });
    setPendingDiff((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const acceptAll = () => {
    Object.keys(pendingDiff).forEach((id) => acceptSuggestion(id));
  };

  // 清空字幕（调试用）
  const clearSubtitles = useCallback(async () => {
    if (!selectedAssetId) return;
    
    const confirmed = window.confirm('确定要清空该视频的所有字幕吗？此操作不可恢复！');
    if (!confirmed) return;

    setIsClearing(true);
    try {
      const response = await fetch(`/api/transcripts/${selectedAssetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '清空字幕失败');
      }

      // 清空前端状态
      importFromFile([]);
      setTranscribeStatus('idle');
      
      alert('字幕已清空');
    } catch (error) {
      console.error('清空字幕失败:', error);
      alert(error instanceof Error ? error.message : '清空字幕失败');
    } finally {
      setIsClearing(false);
    }
  }, [selectedAssetId, importFromFile]);

  const onFieldChange = (field: keyof Pick<AdminTranscriptLine, 'text' | 'translation'>, value: string) => {
    if (!activeLine) return;
    updateLine(activeLine.id, { [field]: value } as Partial<AdminTranscriptLine>);
  };

  const toggleLock = () => {
    if (!activeLine) return;
    updateLine(activeLine.id, {
      lockState: activeLine.lockState === 'locked' ? 'unlocked' : 'locked',
    });
  };

  return (
    <section className="glass-panel rounded-3xl border border-white/10 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex-1">
          <p className="text-lg font-semibold text-slate-900">字幕处理工作台</p>
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
            setTranscribeStatus('idle');
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
            hoverIcon={Play}
            hoverText="点击选择"
          />
        </div>
      ) : (
        <>
          {/* 转写状态提示 */}
          {transcribeStatus === 'idle' && lines.length === 0 && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Sparkles className="h-4 w-4" />
                  <span>可以开始自动转写，或手动上传字幕文件</span>
                </div>
                <button
                  type="button"
                  onClick={autoTranscribe}
                  className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  开始自动转写
                </button>
              </div>
            </div>
          )}

          {transcribeStatus === 'transcribing' && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="flex flex-col">
                    <span>
                      {currentStageStatus
                        ? getStatusLabel('transcribe', currentStageStatus)
                        : '正在自动转写视频字幕...'}
                    </span>
                    {progressMessage && (
                      <span className="text-xs font-normal text-blue-600">
                        {progressMessage}
                      </span>
                    )}
                    {/* 调试信息 */}
                    <span className="text-xs font-normal text-blue-400 mt-1">
                      当前状态: {currentStageStatus || 'queued'} | Job ID: {transcribeJobId?.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-blue-600">
                  {currentProgress}%
                </span>
              </div>

              {/* 进度条 */}
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: `${currentProgress}%`,
                  }}
                />
              </div>

              {/* 步骤列表 */}
              <div className="mt-3 space-y-1">
                {TRANSCRIBE_STEPS.map((step) => {
                  const isActive = currentStageStatus === step.key;
                  const isCompleted = currentProgress > step.progress;

                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-2 text-xs ${
                        isActive ? 'text-blue-700 font-medium' : 
                        isCompleted ? 'text-emerald-600' :
                        'text-blue-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : isActive ? (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border-2 border-blue-300" />
                      )}
                      <span className="flex-1">{step.label}</span>
                      {isActive && progressMessage && (
                        <span className="text-blue-600">{progressMessage}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {transcribeStatus === 'success' && lines.length > 0 && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>字幕已生成! 共 {lines.length} 条 · 现在可以编辑和翻译</span>
              </div>
            </div>
          )}

          {transcribeStatus === 'failed' && transcribeError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-rose-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>自动转写失败: {transcribeError}</span>
                </div>
                <p className="text-xs text-rose-600">请手动上传 SRT/VTT 字幕文件继续工作流程</p>
              </div>
            </div>
          )}

          {/* 字幕编辑区域 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => exportAsJson(lines)}
                disabled={lines.length === 0}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> JSON
              </button>
              <button
                type="button"
                onClick={() => exportAsCsv(lines)}
                disabled={lines.length === 0}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 disabled:opacity-50"
              >
                <FileDown className="h-3.5 w-3.5" /> CSV
              </button>
              
              {/* 清空字幕按钮（调试用） */}
              <button
                type="button"
                onClick={clearSubtitles}
                disabled={lines.length === 0 || isClearing}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isClearing ? '清空中...' : '清空字幕'}
              </button>
            </div>
          </div>

          {/* 视频播放器和字幕列表的左右布局 */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] items-stretch">
            {/* 左侧: 视频播放器 */}
            <div id="video-player-section" className="rounded-2xl border border-slate-200 bg-white/80 p-4 flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">视频预览</h3>
                {transcribeStatus === 'success' && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    字幕已生成 ({lines.length} 条)
                  </span>
                )}
              </div>

              {/* 视频播放器容器 - 16:9 比例 */}
              <div className="bg-black rounded-lg overflow-hidden shadow-lg flex-1" style={{ aspectRatio: '16/9' }}>
                {/* 根据视频类型使用不同的播放器 */}
                {assets.find((a) => a.id === selectedAssetId)?.tag_list?.includes('youtube') ||
                assets.find((a) => a.id === selectedAssetId)?.source_url?.includes('youtube') ? (
                  <YouTubePlayer
                    videoId={
                      extractYouTubeId(assets.find((a) => a.id === selectedAssetId)?.source_url || '') ||
                      ''
                    }
                    transcripts={lines}
                    onCurrentLineChange={(line) => {
                      if (line) {
                        setActiveId(line.id);
                        if (!selectedIds.includes(line.id)) {
                          setSelected([line.id]);
                        }
                      }
                    }}
                    onSeekReady={(seekFn) => {
                      setSeekToTime(() => seekFn);
                    }}
                  />
                ) : (
                  <LocalVideoPlayer
                    videoUrl={assets.find((a) => a.id === selectedAssetId)?.source_url || ''}
                    transcripts={lines}
                    onCurrentLineChange={(line) => {
                      if (line) {
                        setActiveId(line.id);
                        if (!selectedIds.includes(line.id)) {
                          setSelected([line.id]);
                        }
                      }
                    }}
                    onSeekReady={(seekFn) => {
                      setSeekToTime(() => seekFn);
                    }}
                  />
                )}
              </div>
            </div>

            {/* 右侧: 字幕列表 */}
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900">字幕列表 ({lines.length} 条)</p>
                <label className="cursor-pointer rounded-lg border border-dashed border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
                  <input
                    type="file"
                    accept=".srt,.vtt,.txt"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                  <Upload className="h-3 w-3 text-primary" />
                  {isImporting ? '解析中…' : '上传 SRT/VTT'}
                </label>
              </div>

              {importError && (
                <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  <AlertCircle className="mr-1 inline h-3 w-3" />
                  {importError}
                </div>
              )}

              {lines.length > 0 && (
                <div className="overflow-y-auto space-y-2 pr-2 flex-1" style={{ aspectRatio: '16/9' }}>
                    {lines.map((line) => (
                      <div
                        key={line.id}
                        id={`subtitle-${line.id}`}
                        onClick={() => {
                          setEditing(line);
                          // 跳转到对应时间 - 使用 seekToTime 回调
                          if (seekToTime) {
                            seekToTime(line.startTime / 1000);
                          }
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 active:scale-[0.98] ${
                          selectedIds.includes(line.id)
                            ? 'bg-blue-50 border-blue-500 shadow-lg'
                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm font-semibold text-slate-900 leading-tight flex-1">
                            {line.text}
                          </p>
                          <span className="text-xs text-slate-400 font-mono shrink-0">
                            {Math.floor(line.startTime / 1000 / 60)}:{(Math.floor(line.startTime / 1000) % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        {line.translation && (
                          <p className="text-xs text-slate-600 italic">{line.translation}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* 采纳全部 AI 翻译按钮 */}
              {Object.keys(pendingDiff).length > 0 && (
                <button
                  type="button"
                  onClick={acceptAll}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 flex-shrink-0"
                >
                  采纳全部 AI 翻译 ({Object.keys(pendingDiff).length})
                </button>
              )}
            </div>

            {/* 编辑选中句子面板 - 横跨整个底部 */}
            {activeLine && (
              <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white/80 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">编辑选中句子</h3>
                  <button
                    type="button"
                    onClick={toggleLock}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
                  >
                    {activeLine.lockState === 'locked' ? (
                      <><Lock className="h-3.5 w-3.5" /> 锁定</>
                    ) : (
                      <><Unlock className="h-3.5 w-3.5" /> 可编辑</>
                    )}
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* 左侧: 英文原文 */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">英文原文</label>
                    <textarea
                      value={activeLine.text}
                      onChange={(e) => onFieldChange('text', e.target.value)}
                      disabled={activeLine.lockState === 'locked'}
                      className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 transition-all"
                      rows={4}
                      placeholder="Enter the original text..."
                    />
                  </div>

                  {/* 右侧: 中文翻译 */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">中文翻译</label>
                    <textarea
                      value={activeLine.translation}
                      onChange={(e) => onFieldChange('translation', e.target.value)}
                      disabled={activeLine.lockState === 'locked'}
                      className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 transition-all"
                      rows={4}
                      placeholder="输入或等待 AI 翻译..."
                    />
                  </div>
                </div>

                {/* AI 建议翻译 - 如果有 */}
                {pendingDiff[activeLine.id] && (
                  <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="mb-2 text-sm font-medium text-primary flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4" />
                          AI 建议翻译
                        </p>
                        <p className="text-base text-slate-800">{pendingDiff[activeLine.id]}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => acceptSuggestion(activeLine.id)}
                        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition"
                      >
                        采纳此翻译
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};
