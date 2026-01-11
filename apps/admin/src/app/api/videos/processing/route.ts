/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

/**
 * GET /api/videos/processing
 * 获取所有视频的处理状态（以 asset 为中心，聚合显示）
 * 
 * 查询参数：
 * - status: 筛选 pipeline 状态 (running, completed, failed, canceled)
 * - limit: 返回数量限制
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);

    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建查询：获取每个 asset 的最新 pipeline
    let pipelinesQuery = supabase
      .from('pipelines')
      .select(`
        id,
        asset_id,
        status,
        current_stage,
        progress,
        created_at,
        started_at,
        completed_at,
        failed_at,
        metadata,
        asset:media_assets!inner (
          id,
          title,
          cover_url,
          status,
          created_at,
          created_by
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 应用状态筛选
    if (statusFilter) {
      pipelinesQuery = pipelinesQuery.eq('status', statusFilter);
    }

    const { data: pipelines, error } = await pipelinesQuery;

    if (error) {
      console.error('Error fetching processing videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch processing videos', details: error.message },
        { status: 500 }
      );
    }

    // 对于每个 asset，只保留最新的 pipeline
    const assetMap = new Map();
    
    for (const pipeline of pipelines || []) {
      const assetId = pipeline.asset_id;
      const existingPipeline = assetMap.get(assetId);
      
      // 如果没有记录，或者当前 pipeline 更新
      if (!existingPipeline || 
          new Date(pipeline.created_at) > new Date(existingPipeline.created_at)) {
        assetMap.set(assetId, pipeline);
      }
    }

    // 对于每个 pipeline，获取其 stages 信息
    const pipelineIds = Array.from(assetMap.values()).map((p) => p.id);
    
    const { data: allStages } = await supabase
      .from('pipeline_stages')
      .select('pipeline_id, stage, status, progress, current_execution_id')
      .in('pipeline_id', pipelineIds);

    // 获取所有 execution 的更新时间
    const executionIds = (allStages || [])
      .map((s: any) => s.current_execution_id)
      .filter((id: string | null) => id !== null);
    
    const { data: allExecutions } = await supabase
      .from('stage_executions')
      .select('id, started_at, completed_at, failed_at')
      .in('id', executionIds);

    // 构建 execution 时间映射
    const executionTimeMap = new Map<string, any>();
    for (const exec of allExecutions || []) {
      executionTimeMap.set(exec.id, exec);
    }

    // 构建 stages 映射
    const stagesMap = new Map<string, any[]>();
    for (const stage of allStages || []) {
      if (!stagesMap.has(stage.pipeline_id)) {
        stagesMap.set(stage.pipeline_id, []);
      }
      stagesMap.get(stage.pipeline_id)!.push(stage);
    }

    // 转换为数组并格式化
    const processingVideos = Array.from(assetMap.values()).map((pipeline) => {
      const asset = Array.isArray(pipeline.asset) ? pipeline.asset[0] : pipeline.asset;
      
      const stages = stagesMap.get(pipeline.id) || [];
      const jobs = stages.sort((a: any, b: any) => {
        const stageOrder = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
        return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
      });

      // 计算当前状态的友好文本
      let statusText = '处理中';
      let statusIcon = '⏳';
      let currentStageDisplay = pipeline.current_stage;
      
      if (pipeline.status === 'completed') {
        statusText = '已完成';
        statusIcon = '✅';
        currentStageDisplay = null; // 已完成不显示当前阶段
      } else if (pipeline.status === 'failed') {
        statusText = '失败';
        statusIcon = '❌';
      } else if (pipeline.status === 'canceled') {
        statusText = '已取消';
        statusIcon = '⏸️';
      } else if (pipeline.current_stage) {
        // 检查当前阶段是否已完成
        const currentStageJob = jobs.find((j: any) => j.stage === pipeline.current_stage);
        
        if (currentStageJob?.status === 'completed') {
          // 当前阶段已完成，显示待下一步处理
          const stageOrder = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
          const currentIndex = stageOrder.indexOf(pipeline.current_stage);
          const nextStage = stageOrder[currentIndex + 1];
          
          if (nextStage) {
            const nextStageNames = {
              transcribe: '待转写处理',
              translate: '待翻译处理',
              notation: '待生成发音谱',
              publish: '待发布',
            };
            statusText = nextStageNames[nextStage as keyof typeof nextStageNames] || '待处理';
            statusIcon = '⏸️';
            currentStageDisplay = nextStage; // 显示下一个阶段
          } else {
            statusText = '已完成';
            statusIcon = '✅';
            currentStageDisplay = null;
          }
        } else {
          // 当前阶段正在进行中
          const stageNames = {
            upload: '上传中',
            transcribe: '转写中',
            translate: '翻译中',
            notation: '生成发音谱',
            publish: '发布中',
          };
          statusText = stageNames[pipeline.current_stage as keyof typeof stageNames] || statusText;
        }
      }

      // 获取最近更新时间（从 stage_executions 获取最新的时间）
      let lastUpdated = pipeline.created_at;
      
      // 从所有 stages 的 executions 中找到最新的时间
      for (const job of jobs) {
        if (job.current_execution_id) {
          const execution = executionTimeMap.get(job.current_execution_id);
          if (execution) {
            const execTime = execution.completed_at || execution.failed_at || execution.started_at;
            if (execTime && new Date(execTime) > new Date(lastUpdated)) {
              lastUpdated = execTime;
            }
          }
        }
      }
      
      // 如果没有 execution 时间，使用 pipeline 的时间
      if (lastUpdated === pipeline.created_at) {
        lastUpdated = pipeline.completed_at || 
                     pipeline.failed_at || 
                     pipeline.started_at || 
                     pipeline.created_at;
      }

      // 计算实际进度（基于加权平均）
      const stageWeights: Record<string, number> = {
        'upload': 0.1,      // 上传占 10%
        'transcribe': 0.2,  // 转写占 20%
        'translate': 0.2,   // 翻译占 20%
        'notation': 0.4,    // 发音谱占 40%（最耗时）
        'publish': 0.1,     // 发布占 10%
      };

      let calculatedProgress = 0;
      const stageOrder = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
      
      stageOrder.forEach((stage) => {
        const stageJob = jobs.find((j: any) => j.stage === stage);
        const weight = stageWeights[stage] || 0;
        
        if (stageJob) {
          const jobProgress = stageJob.status === 'completed' ? 100 : stageJob.progress || 0;
          calculatedProgress += jobProgress * weight;
        }
      });

      return {
        asset: {
          id: asset.id,
          title: asset.title,
          coverUrl: asset.cover_url,
          status: asset.status,
          createdAt: asset.created_at,
        },
        pipeline: {
          id: pipeline.id,
          status: pipeline.status,
          currentStage: currentStageDisplay, // 使用计算后的阶段显示
          progress: Math.round(calculatedProgress), // 使用计算的进度
          statusText,
          statusIcon,
          createdAt: pipeline.created_at,
          startedAt: pipeline.started_at,
          completedAt: pipeline.completed_at,
          failedAt: pipeline.failed_at,
          lastUpdated,
        },
        jobs: jobs.map((job: any) => ({
          id: job.id,
          stage: job.stage,
          status: job.status,
          progress: job.progress,
          createdAt: job.created_at,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          errorMessage: job.error_message,
        })),
      };
    });

    // 按最近更新时间排序
    processingVideos.sort((a, b) => {
      const timeA = new Date(a.pipeline.lastUpdated).getTime();
      const timeB = new Date(b.pipeline.lastUpdated).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      videos: processingVideos,
      total: processingVideos.length,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/videos/processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
