'use client';

import { useState } from 'react';
import { usePipelineEvents } from '@/hooks/usePipeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  XCircle, 
  Upload, 
  FileText, 
  Languages, 
  Music, 
  Rocket,
  ChevronDown,
  ChevronRight 
} from 'lucide-react';

interface PipelineProgressProps {
  pipelineId: string;
  assetTitle?: string;
}

const STAGE_CONFIG = {
  upload: {
    label: '上传视频',
    icon: Upload,
    color: 'text-blue-500',
  },
  transcribe: {
    label: '提取字幕',
    icon: FileText,
    color: 'text-purple-500',
  },
  translate: {
    label: '翻译字幕',
    icon: Languages,
    color: 'text-green-500',
  },
  notation: {
    label: '生成发音谱',
    icon: Music,
    color: 'text-orange-500',
  },
  publish: {
    label: '发布内容',
    icon: Rocket,
    color: 'text-pink-500',
  },
} as const;

const STATUS_CONFIG = {
  created: {
    label: '已创建',
    icon: Clock,
    color: 'text-gray-400',
    badgeVariant: 'secondary' as const,
  },
  pending: {
    label: '等待中',
    icon: Clock,
    color: 'text-gray-400',
    badgeVariant: 'secondary' as const,
  },
  queued: {
    label: '队列中',
    icon: Clock,
    color: 'text-blue-400',
    badgeVariant: 'secondary' as const,
  },
  running: {
    label: '执行中',
    icon: Loader2,
    color: 'text-blue-500',
    badgeVariant: 'default' as const,
    animate: true,
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    color: 'text-green-500',
    badgeVariant: 'default' as const,
  },
  failed: {
    label: '失败',
    icon: XCircle,
    color: 'text-red-500',
    badgeVariant: 'destructive' as const,
  },
  retrying: {
    label: '重试中',
    icon: Loader2,
    color: 'text-yellow-500',
    badgeVariant: 'default' as const,
    animate: true,
  },
  canceled: {
    label: '已取消',
    icon: XCircle,
    color: 'text-gray-500',
    badgeVariant: 'secondary' as const,
  },
} as const;

// Simple Progress component
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className || ''}`}>
      <div
        className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function PipelineProgress({ pipelineId, assetTitle }: PipelineProgressProps) {
  const { pipeline, jobs, isConnected, error } = usePipelineEvents(pipelineId);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [triggeringJobs, setTriggeringJobs] = useState<Set<string>>(new Set());

  // 定义完整的阶段流程（按顺序）
  const STAGE_ORDER = ['upload', 'transcribe', 'translate', 'notation', 'publish'] as const;

  // 触发翻译任务
  const triggerTranslateJob = async (jobId: string) => {
    setTriggeringJobs(prev => new Set(prev).add(jobId));
    try {
      const response = await fetch('/api/jobs/trigger-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '触发翻译失败');
      }

      // 成功触发，等待实时更新刷新状态
    } catch (err) {
      console.error('触发翻译失败:', err);
      alert(`触发翻译失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setTriggeringJobs(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  // 按阶段分组 jobs - 只显示每个阶段的最新 job
  const groupJobsByStage = () => {
    const grouped = new Map<string, typeof jobs>();
    
    jobs.forEach((job) => {
      const existing = grouped.get(job.stage);
      
      if (!existing) {
        // 第一个该阶段的 job
        grouped.set(job.stage, [job]);
      } else {
        // 比较创建时间，只保留最新的 job
        const latestExisting = existing[0];
        const jobTime = new Date(job.created_at).getTime();
        const existingTime = new Date(latestExisting.created_at).getTime();
        
        if (jobTime > existingTime) {
          // 当前 job 更新，替换
          grouped.set(job.stage, [job]);
        }
      }
    });
    
    return grouped;
  };

  // 获取阶段状态（包括未开始的阶段）
  const getStageStatus = (stage: string, stageJobs: typeof jobs | undefined) => {
    // 如果没有对应的 jobs，说明阶段未开始
    if (!stageJobs || stageJobs.length === 0) {
      return 'pending';
    }

    const hasRunning = stageJobs.some((j) => j.status === 'running');
    const hasFailed = stageJobs.some((j) => j.status === 'failed');
    const allCompleted = stageJobs.every((j) => j.status === 'completed');
    const hasQueued = stageJobs.some((j) => j.status === 'queued');

    if (hasRunning) return 'running';
    if (hasFailed) return 'failed';
    if (allCompleted) return 'completed';
    if (hasQueued) return 'queued';
    return stageJobs[0]?.status || 'pending';
  };

  // 计算阶段的平均进度
  const getStageAverageProgress = (stageJobs: typeof jobs | undefined) => {
    if (!stageJobs || stageJobs.length === 0) return 0;
    const total = stageJobs.reduce((sum, job) => sum + job.progress, 0);
    return Math.round(total / stageJobs.length);
  };

  // 计算整体进度（基于所有阶段）
  const calculateOverallProgress = () => {
    const jobsByStage = groupJobsByStage();
    const stageWeights: Record<string, number> = {
      'upload': 0.1,      // 上传占 10%
      'transcribe': 0.2,  // 转写占 20%
      'translate': 0.2,   // 翻译占 20%
      'notation': 0.4,    // 发音谱占 40%（最耗时）
      'publish': 0.1,     // 发布占 10%
    };

    let weightedProgress = 0;

    STAGE_ORDER.forEach((stage) => {
      const stageJobs = jobsByStage.get(stage);
      const weight = stageWeights[stage] || 0;
      const status = getStageStatus(stage, stageJobs);
      const progress = status === 'completed' ? 100 : getStageAverageProgress(stageJobs);

      weightedProgress += progress * weight;
    });

    return Math.round(weightedProgress);
  };

  // 获取阶段的状态描述（细节）
  const getStageStatusDetail = (stage: string, stageJobs: typeof jobs | undefined) => {
    if (!stageJobs || stageJobs.length === 0) return null;
    
    const job = stageJobs[0];
    
    // 根据不同的 stage 和 progress 返回不同的细节描述
    if (stage === 'upload') {
      if (job.status === 'running') {
        if (job.progress < 30) return '正在验证文件...';
        if (job.progress < 70) return '正在上传文件...';
        return '正在保存元数据...';
      }
      if (job.status === 'completed') return '上传完成';
    }
    
    if (stage === 'transcribe') {
      if (job.status === 'queued') return '等待开始转写...';
      if (job.status === 'running') {
        if (job.progress < 10) return '正在检测视频来源...';
        if (job.progress < 25) return '正在下载视频内容...';
        if (job.progress < 50) return '正在提取音频轨道...';
        if (job.progress < 75) return '正在识别语音内容...';
        if (job.progress < 95) return '正在生成字幕文本...';
        return '正在保存字幕到数据库...';
      }
      if (job.status === 'completed') return '字幕提取完成';
    }
    
    if (stage === 'translate') {
      if (job.status === 'pending') return '等待翻译任务...';
      if (job.status === 'queued') return '翻译任务已排队...';
      if (job.status === 'running') {
        if (job.progress < 20) return '正在准备翻译引擎...';
        if (job.progress < 40) return '正在加载字幕数据...';
        if (job.progress < 80) return '正在翻译字幕内容...';
        if (job.progress < 95) return '正在优化翻译质量...';
        return '正在保存翻译结果...';
      }
      if (job.status === 'completed') return '翻译完成';
    }
    
    if (stage === 'notation') {
      if (job.status === 'pending') return '等待生成发音谱...';
      if (job.status === 'running') {
        if (job.progress < 30) return '正在分析音频特征...';
        if (job.progress < 70) return '正在生成发音数据...';
        return '正在保存发音谱...';
      }
      if (job.status === 'completed') return '发音谱生成完成';
    }
    
    if (stage === 'publish') {
      if (job.status === 'running') {
        if (job.progress < 50) return '正在准备发布资源...';
        return '正在发布内容...';
      }
      if (job.status === 'completed') return '发布完成';
    }
    
    return null;
  };

  // 获取阶段的所有步骤列表（用于详细展示）
  // 如果 job 有 metadata，使用真实步骤；否则使用默认步骤
  const getStageSteps = (stage: string, job?: typeof jobs[0]) => {
    // 如果有 metadata 并且包含步骤信息，使用真实数据
    if (job?.metadata?.step_label) {
      const { steps_completed = 0, total_steps = 1, step_label = '' } = job.metadata;
      
      // 返回当前步骤作为单个步骤（显示真实的步骤标签）
      return [
        {
          progress: job.progress,
          label: step_label,
          completed: steps_completed,
          total: total_steps,
        },
      ];
    }

    // 默认步骤列表（向后兼容，当没有 metadata 时使用）
    if (stage === 'upload') {
      return [
        { progress: 0, label: '验证文件' },
        { progress: 30, label: '上传文件' },
        { progress: 70, label: '保存元数据' },
        { progress: 100, label: '完成' },
      ];
    }
    
    if (stage === 'transcribe') {
      return [
        { progress: 0, label: '检测视频来源' },
        { progress: 10, label: '下载视频内容' },
        { progress: 25, label: '提取音频轨道' },
        { progress: 50, label: '识别语音内容' },
        { progress: 75, label: '生成字幕文本' },
        { progress: 95, label: '保存到数据库' },
        { progress: 100, label: '完成' },
      ];
    }
    
    if (stage === 'translate') {
      return [
        { progress: 0, label: '准备翻译引擎' },
        { progress: 20, label: '加载字幕数据' },
        { progress: 40, label: '翻译字幕内容' },
        { progress: 80, label: '优化翻译质量' },
        { progress: 95, label: '保存翻译结果' },
        { progress: 100, label: '完成' },
      ];
    }
    
    if (stage === 'notation') {
      return [
        { progress: 0, label: '分析音频特征' },
        { progress: 30, label: '生成发音数据' },
        { progress: 70, label: '保存发音谱' },
        { progress: 100, label: '完成' },
      ];
    }
    
    if (stage === 'publish') {
      return [
        { progress: 0, label: '准备发布资源' },
        { progress: 50, label: '发布内容' },
        { progress: 100, label: '完成' },
      ];
    }
    
    return [];
  };

  // 切换阶段展开/折叠
  const toggleStage = (stage: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">加载失败</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!pipeline) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">加载中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-6">
        <div className="space-y-3">
          {/* 视频标题 */}
          <div>
            <CardTitle className="text-2xl">{assetTitle || '未命名视频'}</CardTitle>
            <CardDescription className="mt-1">视频处理流水线</CardDescription>
          </div>
          
          {/* 处理状态 */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">处理状态:</span>
              <Badge variant={STATUS_CONFIG[pipeline.status]?.badgeVariant}>
                {STATUS_CONFIG[pipeline.status]?.label || pipeline.status}
              </Badge>
              {isConnected && (
                <span className="inline-flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-1" />
                  <span className="text-xs text-green-600">实时更新</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">整体进度</span>
            <span className="text-muted-foreground">{calculateOverallProgress()}%</span>
          </div>
          <Progress value={calculateOverallProgress()} className="h-2" />
        </div>

        {/* Stage Cards - 显示所有阶段 */}
        <div className="space-y-3">
          {STAGE_ORDER.map((stage) => {
            const stageConfig = STAGE_CONFIG[stage];
            const jobsByStage = groupJobsByStage();
            const stageJobs = jobsByStage.get(stage);
            const aggregatedStatus = getStageStatus(stage, stageJobs);
            const statusConfig = STATUS_CONFIG[aggregatedStatus];
            const StageIcon = stageConfig.icon;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedStages.has(stage);
            const hasManyJobs = stageJobs && stageJobs.length > 1;
            const averageProgress = getStageAverageProgress(stageJobs);
            
            // 判断是否可以展开查看详情（有 jobs 数据就可以展开）
            const hasDetails = stageJobs && stageJobs.length > 0;

            // 根据状态确定背景色
            const getBackgroundClass = () => {
              if (aggregatedStatus === 'completed') return 'bg-green-50 border-green-300';
              if (aggregatedStatus === 'running') return 'bg-blue-50 border-blue-300';
              if (aggregatedStatus === 'failed') return 'bg-red-50 border-red-300';
              return 'bg-gray-50 border-gray-200'; // pending/queued
            };

            return (
              <div key={stage}>
                {/* 阶段汇总卡片 */}
                <div
                  className={`
                    flex items-center justify-between p-4 rounded-lg border
                    ${getBackgroundClass()}
                    ${hasDetails ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                  `}
                  onClick={() => hasDetails && toggleStage(stage)}
                >
                    <div className="flex items-center space-x-3 flex-1">
                      {/* 展开/折叠图标 */}
                      {hasDetails && (
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      )}
                      
                      <StageIcon className={`h-5 w-5 ${stageConfig.color} flex-shrink-0`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{stageConfig.label}</h4>
                          <Badge variant={statusConfig.badgeVariant} className="text-xs">
                            {statusConfig.label}
                          </Badge>
                          {hasManyJobs && (
                            <span className="text-xs text-gray-500">
                              ({stageJobs.length} 个批次)
                            </span>
                          )}
                        </div>
                        
                        {/* 进度条和细节 */}
                        {(aggregatedStatus === 'running' || aggregatedStatus === 'queued' || aggregatedStatus === 'pending') && (
                          <div className="mt-2 space-y-1">
                            {aggregatedStatus === 'running' && (
                              <Progress value={averageProgress} className="h-1" />
                            )}
                            <div className="flex items-center justify-between">
                              {aggregatedStatus === 'running' && (
                                <p className="text-xs text-muted-foreground">{averageProgress}%</p>
                              )}
                              {getStageStatusDetail(stage, stageJobs) && (
                                <p className={`text-xs ${
                                  aggregatedStatus === 'running' ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                  {getStageStatusDetail(stage, stageJobs)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* 完成状态的描述 */}
                        {aggregatedStatus === 'completed' && getStageStatusDetail(stage, stageJobs) && (
                          <p className="mt-1 text-xs text-green-600">
                            {getStageStatusDetail(stage, stageJobs)}
                          </p>
                        )}
                        
                        {/* 错误信息 */}
                        {aggregatedStatus === 'failed' && stageJobs && stageJobs.some((j) => j.error_message) && (
                          <p className="mt-1 text-xs text-red-600 truncate">
                            {stageJobs.find((j) => j.error_message)?.error_message}
                          </p>
                        )}
                        
                        {/* 时间信息 */}
                        {stageJobs && stageJobs.length > 0 && (() => {
                          const job = stageJobs[0]; // 使用第一个 job 的时间信息
                          return (
                            <div className="mt-2 text-xs text-gray-500 space-x-3">
                              {job.started_at && (
                                <span>开始: {new Date(job.started_at).toLocaleString('zh-CN', { 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</span>
                              )}
                              {job.completed_at && (
                                <span>完成: {new Date(job.completed_at).toLocaleString('zh-CN', { 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</span>
                              )}
                              {job.failed_at && (
                                <span>失败: {new Date(job.failed_at).toLocaleString('zh-CN', { 
                                  month: '2-digit', 
                                  day: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* 立即翻译按钮 - 针对 pending 的 translate 阶段 */}
                    {stage === 'translate' && aggregatedStatus === 'pending' && stageJobs && stageJobs.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 mr-2"
                        onClick={(e) => {
                          e.stopPropagation(); // 防止触发展开/折叠
                          // 触发第一个 pending job
                          const firstPendingJob = stageJobs.find(j => j.status === 'pending');
                          if (firstPendingJob) {
                            triggerTranslateJob(firstPendingJob.id);
                          }
                        }}
                        disabled={triggeringJobs.has(stageJobs.find(j => j.status === 'pending')?.id || '')}
                      >
                        {triggeringJobs.has(stageJobs.find(j => j.status === 'pending')?.id || '') ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            触发中...
                          </>
                        ) : (
                          '立即翻译'
                        )}
                      </Button>
                    )}
                    
                    <StatusIcon
                      className={`h-5 w-5 ${statusConfig.color} flex-shrink-0 ${
                        'animate' in statusConfig && statusConfig.animate ? 'animate-spin' : ''
                      }`}
                    />
                  </div>

                  {/* 展开的详细信息 */}
                  {hasDetails && isExpanded && stageJobs && (
                    <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                      {/* 处理步骤卡片 */}
                      {(() => {
                        const job = stageJobs[0];
                        
                        // 如果有真实的 metadata.steps 数组，显示步骤卡片
                        if (job?.metadata?.steps && Array.isArray(job.metadata.steps)) {
                          const stepsArray = job.metadata.steps as Array<{
                            id: string;
                            label: string;
                            status: 'pending' | 'running' | 'completed' | 'failed';
                          }>;
                          
                          return (
                            <div className="p-3 rounded-lg border bg-white border-gray-200">
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-sm font-medium">处理步骤</span>
                                <Badge variant="outline" className="text-xs">
                                  {stepsArray.filter(s => s.status === 'completed').length} / {stepsArray.length}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1.5">
                                {stepsArray.map((step) => {
                                  const isCompleted = step.status === 'completed';
                                  const isRunning = step.status === 'running';
                                  const isFailed = step.status === 'failed';
                                  
                                  return (
                                    <div key={step.id} className="flex items-center gap-2 text-xs">
                                      {isCompleted ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                      ) : isRunning ? (
                                        <Loader2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 animate-spin" />
                                      ) : isFailed ? (
                                        <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                      ) : (
                                        <Clock className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                                      )}
                                      <span className={`
                                        ${isCompleted ? 'text-green-700' : 
                                          isRunning ? 'text-blue-700 font-medium' : 
                                          isFailed ? 'text-red-700' :
                                          'text-gray-400'}
                                      `}>
                                        {step.label}
                                      </span>
                                      {isRunning && job.progress > 0 && (
                                        <span className="text-blue-600 text-xs ml-auto">
                                          {job.progress}%
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* 额外信息 */}
                              {(job.metadata.subtitle_count !== undefined || job.metadata.translated_count !== undefined) && (
                                <div className="flex items-center gap-2 text-xs text-gray-600 mt-3 pt-3 border-t">
                                  {job.metadata.subtitle_count !== undefined && (
                                    <span>字幕数: {job.metadata.subtitle_count as number}</span>
                                  )}
                                  {job.metadata.translated_count !== undefined && (
                                    <span className="text-gray-500">
                                      • 已翻译: {job.metadata.translated_count as number}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        // 使用默认步骤列表（向后兼容）- 也显示为卡片
                        const steps = getStageSteps(stage, job);
                        return (
                          <div className="p-3 rounded-lg border bg-white border-gray-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="text-sm font-medium">处理步骤</span>
                            </div>
                            
                            <div className="space-y-1.5">
                              {steps.map((step, idx) => {
                                const isCompleted = job.status === 'completed' || job.progress >= step.progress;
                                const isCurrent = job.status === 'running' && 
                                  job.progress >= step.progress && 
                                  (idx === steps.length - 1 || job.progress < steps[idx + 1].progress);
                                
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                    ) : isCurrent ? (
                                      <Loader2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 animate-spin" />
                                    ) : (
                                      <Clock className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                                    )}
                                    <span className={`
                                      ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700 font-medium' : 'text-gray-400'}
                                    `}>
                                      {step.label}
                                    </span>
                                    {isCurrent && job.progress > step.progress && (
                                      <span className="text-blue-600 text-xs ml-auto">
                                        {job.progress}%
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
