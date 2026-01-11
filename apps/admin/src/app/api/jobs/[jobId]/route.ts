import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

const ALLOWED_STATUS = new Set(['queued', 'running', 'success', 'failed', 'canceled']);

const STATUS_ALIASES: Record<string, 'queued' | 'running' | 'success' | 'failed' | 'canceled'> = {
  uploading: 'running',
  processing: 'running',
  completed: 'success',
  error: 'failed',
};

const normalizeStatus = (raw: string) => {
  const lowered = raw.trim().toLowerCase();
  return STATUS_ALIASES[lowered] ?? lowered;
};

type PatchPayload = {
  status?: string;
  progress?: number;
  error?: string | null;
};

const clampProgress = (value: number) => {
  if (!Number.isFinite(value)) return undefined;
  return Math.min(100, Math.max(0, value));
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  
  if (!jobId || !UUID_REGEX.test(jobId)) {
    return NextResponse.json({ error: 'jobId 非法', details: jobId ?? null }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as PatchPayload | null;
  if (!body) {
    return NextResponse.json({ error: '缺少更新数据' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.status) {
    const normalizedStatus = normalizeStatus(body.status);
    if (!ALLOWED_STATUS.has(normalizedStatus)) {
      return NextResponse.json({ error: '状态值非法' }, { status: 400 });
    }
    update.status = normalizedStatus;
  }

  if (typeof body.progress === 'number') {
    const value = clampProgress(body.progress);
    if (typeof value === 'number') {
      update.progress = value;
    }
  }

  if ('error' in body) {
    update.error = body.error ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '没有可更新字段' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('jobs')
    .update(update)
    .eq('id', jobId)
    .select('id, status, progress, error, updated_at')
    .maybeSingle();

  if (error) {
    console.error('更新任务失败', { jobId, update, error });
    return NextResponse.json(
      {
        error: '更新任务失败',
        details: error.message ?? null,
        code: (error as { code?: string }).code ?? null,
        hint: (error as { hint?: string }).hint ?? null,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: '未找到任务' }, { status: 404 });
  }

  return NextResponse.json({ job: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  if (!jobId || !UUID_REGEX.test(jobId)) {
    return NextResponse.json({ error: 'jobId 非法', details: jobId ?? null }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // 先检查任务是否存在
  const { data: existingJob } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('id', jobId)
    .maybeSingle();

  if (!existingJob) {
    return NextResponse.json({ error: '未找到任务' }, { status: 404 });
  }

  // 不允许删除正在运行的任务
  if (existingJob.status === 'running') {
    return NextResponse.json({ error: '无法删除正在运行的任务' }, { status: 400 });
  }

  // 删除任务
  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);

  if (deleteError) {
    console.error('删除任务失败', { jobId, error: deleteError });
    return NextResponse.json(
      {
        error: '删除任务失败',
        details: deleteError.message ?? null,
        code: (deleteError as { code?: string }).code ?? null,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: '任务已删除' });
}
