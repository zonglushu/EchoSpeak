import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'media-uploads';
const DEFAULT_USER_ID = process.env.SUPABASE_DEFAULT_USER_ID;
const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SIGNED_URL_TTL_MS = 2 * 60 * 60 * 1000; // Supabase signed upload URL 默认 2 小时

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `asset-${Date.now()}`;

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = getSupabaseServiceClient();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  if (!SUPABASE_PROJECT_URL) {
    return NextResponse.json({ error: '缺少 NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: '请求体缺失' }, { status: 400 });
  }

  const filename = String(payload.filename ?? 'unknown-file');
  const size = Number(payload.size ?? 0);
  const mimeType = String(payload.type ?? 'video/mp4');
  const createdByInput = payload.createdBy ?? DEFAULT_USER_ID;

  if (!createdByInput) {
    return NextResponse.json({ error: '缺少 createdBy 或 SUPABASE_DEFAULT_USER_ID' }, { status: 400 });
  }

  const createdBy = String(createdByInput);

  const assetId: string = payload.assetId ?? crypto.randomUUID();
  const objectKey = `${assetId}/${sanitizeFilename(filename)}`;

  const { data: signed, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(objectKey, { upsert: true });

  if (signedError || !signed) {
    console.error('生成 Supabase Signed URL 失败', signedError);
    return NextResponse.json({ error: '获取上传签名失败' }, { status: 500 });
  }

  const normalizeUploadUrl = (input?: string | null) => {
    if (!input) return null;
    try {
      const absolute = new URL(input);
      return absolute.toString();
    } catch {
      const base = new URL(SUPABASE_PROJECT_URL);
      const trimmed = input.startsWith('/') ? input : `/${input}`;
      const path = trimmed.startsWith('/storage/') ? trimmed : `/storage/v1${trimmed}`;
      return `${base.origin}${path}`;
    }
  };

  const uploadUrl = normalizeUploadUrl((signed as { signedUrl?: string; url?: string }).signedUrl ?? (signed as { url?: string }).url);

  if (!uploadUrl) {
    console.error('createSignedUploadUrl 未返回 signedUrl/url');
    return NextResponse.json({ error: 'Supabase Signed URL 缺失' }, { status: 500 });
  }

  const { error: assetError } = await supabase.from('media_assets').insert({
    id: assetId,
    title: payload.title ?? filename,
    description: payload.description ?? null,
    duration_seconds:
      typeof payload.durationSeconds === 'number'
        ? payload.durationSeconds
        : payload.durationSeconds
        ? Number(payload.durationSeconds)
        : null,
    status: 'processing',
    source_url: signed.path,
    tag_list: payload.tagList ?? payload.tags ?? [],
    created_by: createdBy,
  });

  if (assetError) {
    console.error('写入 media_assets 失败', assetError);
    return NextResponse.json({ error: '创建媒体记录失败' }, { status: 500 });
  }

  // Create pipeline for this asset
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .insert({
      asset_id: assetId,
      status: 'running',
      current_stage: 'upload',
      progress: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (pipelineError || !pipeline?.id) {
    console.error('创建 pipeline 失败', pipelineError);
    return NextResponse.json({ error: '创建处理流水线失败' }, { status: 500 });
  }

  // Create upload job
  const { data: jobRow, error: jobError } = await supabase
    .from('jobs')
    .insert({
      pipeline_id: pipeline.id,
      asset_id: assetId,
      stage: 'upload',
      status: 'queued',
      progress: 0,
      input_data: {
        filename,
        size,
        mimeType,
      },
    })
    .select('id')
    .single();

  if (jobError || !jobRow?.id) {
    console.error('写入 jobs 失败', jobError);
    return NextResponse.json({ error: '创建上传任务失败' }, { status: 500 });
  }

  return NextResponse.json({
    assetId,
    objectPath: signed.path,
    uploadUrl,
    token: signed.token,
    bucket: STORAGE_BUCKET,
    expiresAt: new Date(Date.now() + SIGNED_URL_TTL_MS).toISOString(),
    size,
    filename,
    jobId: jobRow.id,
  });
}
