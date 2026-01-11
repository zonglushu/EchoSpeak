import { NextResponse } from 'next/server';
import type { UploadJob } from '@echospeak/types';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

const DEFAULT_LANGUAGE: UploadJob['language'] = '仅英文';

const SUPABASE_JOB_STATUS_TO_UPLOAD_STATUS: Record<string, UploadJob['status']> = {
  queued: 'queued',
  running: 'processing',
  completed: 'completed',  // Changed from 'success'
  failed: 'error',
  canceled: 'error',
  pending: 'queued',  // Added for new status
  retrying: 'processing',  // Added for new status
};

// 新的数据转换类型（从 pipeline_stages 表）
type PipelineStageRow = {
  id: string;
  pipeline_id: string;
  asset_id: string;
  stage: string;
  status: string;
  progress: number | string | null;
  current_execution_id: string | null;
  created_at: string;
  updated_at: string;
  media_assets?: Array<{
    title?: string | null;
    tag_list?: string[] | null;
    status?: string | null;
  }> | null;
  stage_executions?: Array<{
    id: string;
    input_data?: Record<string, unknown> | null;
    output_data?: Record<string, unknown> | null;
    payload?: Record<string, unknown> | null;
  }> | null;
};

// 辅助函数
const clampProgress = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const inferLanguage = (payload?: Record<string, unknown> | null, tags?: string[] | null): UploadJob['language'] => {
  const tagSet = new Set((tags ?? []).map((tag) => tag?.toLowerCase() ?? ''));
  const hintedLanguage = typeof payload?.language === 'string' ? payload.language.toLowerCase() : undefined;

  if (hintedLanguage === 'bilingual' || tagSet.has('bilingual') || tagSet.has('双语')) {
    return '双语';
  }
  if (hintedLanguage === 'chinese' || hintedLanguage === 'zh' || tagSet.has('zh') || tagSet.has('中文')) {
    return '仅中文';
  }
  return DEFAULT_LANGUAGE;
};

const mapStatus = (jobStage: string, status: string): UploadJob['status'] => {
  if (status === 'running' && jobStage === 'upload') {
    return 'uploading';
  }
  return SUPABASE_JOB_STATUS_TO_UPLOAD_STATUS[status] ?? 'processing';
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 20;
  const assetId = searchParams.get('assetId');
  const pipelineId = searchParams.get('pipelineId');
  const statusFilter = searchParams.get('status');
  const stageFilter = searchParams.get('stage') || searchParams.get('type');

  const supabase = getSupabaseServiceClient();

  // 使用新的 pipeline_stages 表
  let query = supabase
    .from('pipeline_stages')
    .select(
      `
      id,
      pipeline_id,
      asset_id,
      stage,
      status,
      progress,
      current_execution_id,
      created_at,
      updated_at,
      media_assets:asset_id (title, tag_list, status)
      `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  if (pipelineId) {
    query = query.eq('pipeline_id', pipelineId);
  }

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  if (stageFilter) {
    query = query.eq('stage', stageFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取任务失败', error);
    return NextResponse.json({ error: '获取任务失败' }, { status: 500 });
  }

  // 如果有 current_execution_id，批量查询 stage_executions
  const executionIds = (data ?? [])
    .map((row: PipelineStageRow) => row.current_execution_id)
    .filter(Boolean);

  const executionsMap = new Map<string, {
    id: string;
    input_data?: Record<string, unknown> | null;
    output_data?: Record<string, unknown> | null;
    payload?: Record<string, unknown> | null;
  }>();
  
  if (executionIds.length > 0) {
    const { data: executions } = await supabase
      .from('stage_executions')
      .select('id, input_data, output_data, payload')
      .in('id', executionIds);
    
    if (executions) {
      executions.forEach((exec) => {
        executionsMap.set(exec.id, exec);
      });
    }
  }

  // 将 pipeline_stages 数据转换为兼容的格式
  const jobs: UploadJob[] = (data ?? []).map((row: PipelineStageRow) => {
    const execution = row.current_execution_id 
      ? executionsMap.get(row.current_execution_id)
      : null;
    const inputData = execution?.input_data ?? execution?.payload ?? {};
    const mediaAsset = Array.isArray(row.media_assets) && row.media_assets.length > 0
      ? row.media_assets[0]
      : null;
    const filename = typeof inputData.filename === 'string'
      ? inputData.filename
      : mediaAsset?.title ?? '未命名素材';
    const size = typeof inputData.size === 'number' ? inputData.size : 0;
    const progressValue = typeof row.progress === 'string' ? Number(row.progress) : Number(row.progress ?? 0);

    const stage = row.stage as UploadJob['stage'];
    const status = mapStatus(row.stage, row.status);

    return {
      id: row.id,
      filename,
      size,
      createdAt: row.created_at,
      status,
      stageStatus: row.status as UploadJob['stageStatus'],
      stage,
      progress: clampProgress(progressValue),
      language: inferLanguage(inputData, mediaAsset?.tag_list ?? null),
      payload: execution?.payload ?? inputData, // 添加 payload 字段以支持进度消息
    };
  });

  return NextResponse.json({ jobs });
}
