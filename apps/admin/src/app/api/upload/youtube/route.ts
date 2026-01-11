import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

const DEFAULT_USER_ID = process.env.SUPABASE_DEFAULT_USER_ID;

/**
 * 从 YouTube oEmbed API 获取视频标题
 */
async function getYouTubeVideoTitle(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
}

/**
 * 验证 YouTube URL
 */
function isValidYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // 支持 youtube.com 和 youtu.be
    const allowedHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'www.youtu.be',
    ];

    if (!allowedHosts.includes(hostname)) {
      return false;
    }

    // 检查是否包含视频ID
    const videoId = extractYouTubeVideoId(url);
    return !!videoId;
  } catch {
    return false;
  }
}

/**
 * 从 YouTube URL 中提取视频 ID
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    // 标准 YouTube URL: youtube.com/watch?v=VIDEO_ID
    if (pathname === '/watch') {
      return parsed.searchParams.get('v');
    }

    // 短链接: youtu.be/VIDEO_ID
    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      return pathname.slice(1);
    }

    // 嵌入链接: youtube.com/embed/VIDEO_ID
    // 短嵌入链接: youtu.be/VIDEO_ID
    if (pathname.startsWith('/embed/')) {
      return pathname.slice(7);
    }

    // 短链接: youtu.be/VIDEO_ID
    const shortsMatch = pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)$/);
    if (shortsMatch) {
      return shortsMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 获取 YouTube 视频缩略图 URL
 */
function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * 获取 YouTube 视频嵌入 URL
 */
function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = getSupabaseServiceClient();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: '请求体缺失' }, { status: 400 });
  }

  const youtubeUrl = payload.youtubeUrl;
  const title = payload.title;
  const description = payload.description ?? null;
  const createdBy = payload.createdBy ?? DEFAULT_USER_ID;

  if (!youtubeUrl) {
    return NextResponse.json({ error: '缺少 YouTube URL' }, { status: 400 });
  }

  if (!isValidYouTubeUrl(youtubeUrl)) {
    return NextResponse.json(
      { error: '无效的 YouTube URL，请输入有效的 YouTube 视频链接' },
      { status: 400 }
    );
  }

  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    return NextResponse.json(
      { error: '无法从 URL 中提取视频 ID，请检查链接格式' },
      { status: 400 }
    );
  }

  try {
    // 获取 YouTube 视频标题
    const videoTitle = await getYouTubeVideoTitle(videoId);

    // 创建媒体资源记录
    const assetId = crypto.randomUUID();

    const { data: asset, error: assetError } = await supabase
      .from('media_assets')
      .insert({
        id: assetId,
        title: title ?? videoTitle ?? `YouTube 视频 (${videoId})`,
        description,
        // 直接存储 YouTube URL
        source_url: youtubeUrl,
        // 存储缩略图 URL（可选）
        cover_url: getYouTubeThumbnailUrl(videoId),
        status: 'processing', // 等待后续处理（字幕提取、转写等）
        created_by: createdBy,
        tag_list: ['youtube'], // 标记为 YouTube 视频
      })
      .select()
      .single();

    if (assetError || !asset) {
      console.error('写入 media_assets 失败', assetError);
      return NextResponse.json({ error: '创建媒体记录失败' }, { status: 500 });
    }

    // Create pipeline for the asset
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .insert({
        asset_id: assetId,
        status: 'running',
        current_stage: 'upload',
        progress: 10,
        started_at: new Date().toISOString(),
        metadata: {
          source: 'youtube',
          youtubeUrl,
          videoId,
        },
      })
      .select()
      .single();

    if (pipelineError || !pipeline) {
      console.error('创建 pipeline 失败', pipelineError);
      return NextResponse.json({ error: '创建处理流水线失败' }, { status: 500 });
    }

    // Create upload job (YouTube import is essentially an upload)
    const finalTitle = asset.title;
    const { data: uploadJob, error: uploadJobError } = await supabase
      .from('jobs')
      .insert({
        pipeline_id: pipeline.id,
        asset_id: assetId,
        stage: 'upload',
        status: 'completed', // YouTube import completes immediately
        progress: 100,
        input_data: {
          filename: finalTitle,
          youtubeUrl,
          videoId,
          thumbnail: getYouTubeThumbnailUrl(videoId),
          embedUrl: getYouTubeEmbedUrl(videoId),
        },
        output_data: {
          youtubeUrl,
          videoId,
          thumbnail: getYouTubeThumbnailUrl(videoId),
          embedUrl: getYouTubeEmbedUrl(videoId),
        },
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (uploadJobError || !uploadJob?.id) {
      console.error('写入 upload job 失败', uploadJobError);
      return NextResponse.json({ error: '创建导入任务失败' }, { status: 500 });
    }

    // Create pending jobs for subsequent stages
    const subsequentStages = ['transcribe', 'translate', 'notation'];
    const pendingJobs = subsequentStages.map((stage) => ({
      pipeline_id: pipeline.id,
      asset_id: assetId,
      stage,
      status: stage === 'transcribe' ? 'queued' : 'pending', // First next stage is queued
      progress: 0,
      retry_count: 0,
      max_retries: 3,
      input_data: {},
    }));

    const { error: pendingJobsError } = await supabase
      .from('jobs')
      .insert(pendingJobs);

    if (pendingJobsError) {
      console.error('创建后续任务失败', pendingJobsError);
      // Don't fail the request, jobs can be created manually later
    }

    // Update pipeline to move to next stage
    await supabase
      .from('pipelines')
      .update({
        current_stage: 'transcribe',
        progress: 25, // Upload complete, 1/4 stages done
      })
      .eq('id', pipeline.id);

    return NextResponse.json({
      assetId: asset.id,
      pipelineId: pipeline.id,
      youtubeUrl,
      videoId,
      thumbnail: getYouTubeThumbnailUrl(videoId),
      embedUrl: getYouTubeEmbedUrl(videoId),
      jobId: uploadJob.id,
      title: asset.title,
      message: 'YouTube 视频导入成功',
    });
  } catch (error) {
    console.error('YouTube 导入失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'YouTube 导入失败' },
      { status: 500 }
    );
  }
}
