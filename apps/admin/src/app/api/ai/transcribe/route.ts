
import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';
import { getRouter } from '@/lib/ai/router';
import SrtParser from 'srt-parser-2';
import { franc } from 'franc';

// @ts-ignore - webvtt-parser 没有 TypeScript 类型定义
import { WebVTTParser } from 'webvtt-parser';

// @ts-ignore - mp4box 没有 TypeScript 类型定义
const MP4Box = require('mp4box');

// YouTube 字幕获取
import { fetchYouTubeCaptions } from '@/lib/youtube-scraper';

// 辅助函数：更新执行状态（使用新的 stage_executions 表）
async function updateExecutionStatus(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  executionId: string,
  updates: {
    status?: string;
    progress?: number;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }
) {
  // 使用新的 update_stage_execution 函数
  const { error } = await supabase.rpc('update_stage_execution', {
    p_execution_id: executionId,
    p_status: updates.status,
    p_progress: updates.progress,
    p_error_message: updates.error_message,
    p_metadata: updates.metadata,
  });

  if (error) {
    console.error('[updateExecutionStatus] 更新失败:', error);
  }
}

/**
 * 自动转写 API
 * 分层策略：
 * 1. 检测是否是YouTube视频 → 使用YouTube字幕API
 * 2. 非YouTube视频：提取内嵌字幕（mp4box.js）
 * 3. 解析并检测语言（srt-parser-2 + franc）
 * 4. 单语则翻译（多提供商路由器）
 * 5. 无字幕则 AI 转写（多提供商路由器）
 */

/**
 * 检测是否是 YouTube URL 并提取 video ID
 */
function detectYouTubeVideo(sourceUrl: string): { isYouTube: boolean; videoId?: string } {
  try {
    if (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
      return { isYouTube: false };
    }

    const url = new URL(sourceUrl);
    const hostname = url.hostname.toLowerCase();

    const allowedHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'www.youtu.be',
    ];

    if (!allowedHosts.includes(hostname)) {
      return { isYouTube: false };
    }

    // 提取 video ID
    const pathname = url.pathname;
    let videoId: string | null = null;

    // 标准 YouTube URL: youtube.com/watch?v=VIDEO_ID
    if (pathname === '/watch') {
      videoId = url.searchParams.get('v');
    }
    // 短链接: youtu.be/VIDEO_ID
    else if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      videoId = pathname.slice(1);
    }
    // 嵌入链接: youtube.com/embed/VIDEO_ID
    else if (pathname.startsWith('/embed/')) {
      videoId = pathname.slice(7);
    }
    // 短视频: youtube.com/shorts/VIDEO_ID
    else {
      const shortsMatch = pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)$/);
      if (shortsMatch) {
        videoId = shortsMatch[1];
      }
    }

    return videoId ? { isYouTube: true, videoId } : { isYouTube: false };
  } catch {
    return { isYouTube: false };
  }
}

// 字幕接口
interface SubtitleLine {
  id: string;
  start: number; // milliseconds
  end: number;
  text: string;
}

interface BilingualSubtitle {
  id: string;
  start: number;
  end: number;
  text_en?: string;
  text_cn?: string;
  needsTranslation: boolean;
}

// 提取视频内嵌字幕
async function extractEmbeddedSubtitles(videoBuffer: Buffer): Promise<string | null> {
  return new Promise((resolve) => {
    const mp4boxfile = MP4Box.createFile();
    let subtitleData = '';
    let hasSubtitles = false;

    mp4boxfile.onReady = (info: any) => {
      console.log('[Transcribe] MP4 信息:', {
        tracks: info.tracks?.map((t: any) => ({
          id: t.id,
          type: t.type,
          codec: t.codec,
        })),
      });

      // 查找字幕轨道
      const textTrack = info.tracks?.find(
        (track: any) => track.type === 'text' || track.codec === 'wvtt' || track.codec === 'stpp'
      );

      if (!textTrack) {
        console.log('[Transcribe] 未找到字幕轨道');
        resolve(null);
        return;
      }

      console.log('[Transcribe] 找到字幕轨道:', textTrack);
      hasSubtitles = true;

      // 提取字幕样本
      mp4boxfile.setExtractionOptions(textTrack.id, null, { nbSamples: 1000 });

      mp4boxfile.onSamples = (id: number, user: any, samples: any[]) => {
        samples.forEach((sample) => {
          if (sample.data) {
            const text = new TextDecoder().decode(sample.data);
            subtitleData += text;
          }
        });
      };

      mp4boxfile.start();
    };

    mp4boxfile.onError = (error: any) => {
      console.error('[Transcribe] MP4Box 解析错误:', error);
      resolve(null);
    };

    try {
      // 读取 buffer
      const arrayBuffer = videoBuffer.buffer.slice(
        videoBuffer.byteOffset,
        videoBuffer.byteOffset + videoBuffer.byteLength
      ) as any;
      arrayBuffer.fileStart = 0;
      mp4boxfile.appendBuffer(arrayBuffer);
      mp4boxfile.flush();

      // 等待异步操作完成
      setTimeout(() => {
        if (hasSubtitles) {
          console.log('[Transcribe] 提取到字幕，长度:', subtitleData.length);
          resolve(subtitleData || null);
        } else {
          resolve(null);
        }
      }, 1000);
    } catch (error) {
      console.error('[Transcribe] MP4Box 处理失败:', error);
      resolve(null);
    }
  });
}

// 解析 SRT 字幕
function parseSRT(content: string): SubtitleLine[] {
  const parser = new SrtParser();
  const parsed = parser.fromSrt(content);

  return parsed.map((item: any, index: number) => ({
    id: `sub-${index}`,
    start: parseTimeToMs(item.startTime),
    end: parseTimeToMs(item.endTime),
    text: item.text,
  }));
}

// 解析 WebVTT 字幕
function parseVTT(content: string): SubtitleLine[] {
  try {
    const parser = new WebVTTParser();
    const tree = parser.parse(content, 'metadata');

    return tree.cues.map((cue: any, index: number) => ({
      id: `sub-${index}`,
      start: Math.round(cue.startTime * 1000),
      end: Math.round(cue.endTime * 1000),
      text: cue.text,
    }));
  } catch (error) {
    console.error('[Transcribe] VTT 解析失败:', error);
    return [];
  }
}

// 时间字符串转毫秒
function parseTimeToMs(time: string): number {
  const [hours, minutes, seconds] = time.split(':');
  const [secs, ms] = seconds.split(',');
  return (
    parseInt(hours) * 3600000 +
    parseInt(minutes) * 60000 +
    parseInt(secs) * 1000 +
    parseInt(ms)
  );
}

// 语言检测和对齐
async function detectAndAlignLanguages(
  subtitles: SubtitleLine[]
): Promise<BilingualSubtitle[]> {
  // 取更多样本以提高准确率（前 20 条）
  const sampleSize = Math.min(20, subtitles.length);
  const sampleText = subtitles.slice(0, sampleSize).map((s) => s.text).join(' ');
  
  // 使用 franc 进行初步检测
  const detectedLang = franc(sampleText, { minLength: 10 });

  console.log('[Transcribe] franc 检测结果:', detectedLang);

  // 改进的语言判定逻辑：
  // 1. 中文相关语言码：cmn(普通话), yue(粤语), wuu(吴语), zh(中文)
  const chineseLanguages = ['cmn', 'yue', 'wuu', 'zh', 'zho'];
  const isChinese = chineseLanguages.includes(detectedLang);
  
  // 2. 英语相关语言码：eng(英语), sco(苏格兰语), 以及其他拉丁语系
  //    由于 franc 经常误判，我们用反向逻辑：不是中文就当英文
  const isEnglish = !isChinese;

  // 3. 辅助判断：检查是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(sampleText);
  const finalIsChinese = hasChinese || isChinese;
  const finalIsEnglish = !finalIsChinese;

  console.log('[Transcribe] 语言判定结果:', {
    francResult: detectedLang,
    hasChinese,
    finalLanguage: finalIsChinese ? '中文' : '英文'
  });

  return subtitles.map((sub) => ({
    id: sub.id,
    start: sub.start,
    end: sub.end,
    text_en: finalIsEnglish ? sub.text : undefined,
    text_cn: finalIsChinese ? sub.text : undefined,
    needsTranslation: true, // 单语需要翻译
  }));
}

export async function POST(request: Request) {
  try {
    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json({ error: '缺少 assetId' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // 1. 判断传入的是 assetId 还是 jobId
    let actualAssetId = assetId;
    let jobId: string | null = null;

    // 尝试作为 jobId 查询（从 stage_executions 表）
    const { data: jobById } = await supabase
      .from('stage_executions')
      .select('asset_id, id')
      .eq('id', assetId)
      .single();

    if (jobById?.asset_id) {
      // 传入的是 jobId
      actualAssetId = jobById.asset_id;
      jobId = jobById.id;
    } else {
      // 传入的是 assetId，需要创建新的 transcribe job
      actualAssetId = assetId;

      // 检查是否已经有进行中的 transcribe job
      const { data: existingJob } = await supabase
        .from('stage_executions')
        .select('id')
        .eq('asset_id', actualAssetId)
        .eq('stage', 'transcribe')
        .in('status', ['queued', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingJob?.id) {
        // 已有进行中的 job，继续使用
        jobId = existingJob.id;
      } else {
        // Get or create pipeline for this asset
        let pipelineId: string;
        const { data: existingPipeline } = await supabase
          .from('pipelines')
          .select('id')
          .eq('asset_id', actualAssetId)
          .single();

        if (existingPipeline) {
          pipelineId = existingPipeline.id;
        } else {
          const { data: newPipeline, error: pipelineError } = await supabase
            .from('pipelines')
            .insert({
              asset_id: actualAssetId,
              status: 'running',
              current_stage: 'transcribe',
              progress: 25,
            })
            .select('id')
            .single();

          if (pipelineError || !newPipeline?.id) {
            console.error('创建 pipeline 失败', pipelineError);
            return NextResponse.json({ error: '创建处理流水线失败' }, { status: 500 });
          }
          pipelineId = newPipeline.id;
        }

        // 使用新的 stage_executions 表创建执行记录
        const { data: executionId, error: executionError } = await supabase
          .rpc('create_stage_execution', {
            p_pipeline_id: pipelineId,
            p_asset_id: actualAssetId,
            p_stage: 'transcribe',
            p_status: 'queued',
            p_progress: 0,
          });

        if (executionError || !executionId) {
          console.error('创建转写任务失败', executionError);
          return NextResponse.json({ error: '创建转写任务失败' }, { status: 500 });
        }

        jobId = executionId;
        console.warn('[Transcribe] 创建新的转写任务:', jobId);
      }
    }

    // 2. 获取视频信息
    const { data: asset, error: assetError } = await supabase
      .from('media_assets')
      .select('source_url, title')
      .eq('id', actualAssetId)
      .single();

    if (assetError || !asset?.source_url) {
      return NextResponse.json({ error: '视频不存在' }, { status: 404 });
    }

    console.warn('[Transcribe] 原始 source_url:', asset.source_url);

    // 定义转写的所有步骤
    const steps = [
      { id: 'detecting_source', label: '检测视频来源', status: 'pending' },
      { id: 'downloading', label: '下载视频', status: 'pending' },
      { id: 'extracting', label: '提取字幕', status: 'pending' },
      { id: 'ai_transcribe', label: 'AI转写', status: 'pending' },
      { id: 'analyzing', label: '分析语言', status: 'pending' },
      { id: 'saving', label: '保存数据库', status: 'pending' },
    ] as Array<{ id: string; label: string; status: 'pending' | 'running' | 'completed' | 'failed' }>;

    // 3. 检测是否是 YouTube 视频
    const youtubeCheck = detectYouTubeVideo(asset.source_url);
    let transcripts: BilingualSubtitle[] = [];
    let usedMethod = 'unknown';

    // 更新任务状态：开始检测视频源
    steps[0].status = 'running';
    await updateExecutionStatus(supabase, jobId!, {
      status: 'running',
      progress: 10,
      metadata: {
        current_step: 'detecting_source',
        step_label: '检测视频来源',
        steps_completed: 1,
        total_steps: steps.length,
        steps: steps as unknown as Record<string, unknown>,
      },
    });

    if (youtubeCheck.isYouTube && youtubeCheck.videoId) {
      // ==================== YouTube 字幕处理流程 ====================
      console.warn('[Transcribe] 检测到 YouTube 视频:', youtubeCheck.videoId);

      try {
        // 使用 YouTube 字幕 API 获取字幕
        console.warn('[Transcribe] 正在从 YouTube 获取字幕...');

        // 更新状态：提取字幕中
        steps[0].status = 'completed';
        steps[1].status = 'completed'; // 跳过下载步骤（YouTube不需要下载）
        steps[2].status = 'running'; // extracting
        await updateExecutionStatus(supabase, jobId!, {
          progress: 40,
          metadata: {
            current_step: 'extracting',
            step_label: '从 YouTube 提取字幕',
            steps_completed: 2,
            total_steps: steps.length,
            video_id: youtubeCheck.videoId,
            steps: steps,
          },
        });

        const vttContent = await fetchYouTubeCaptions(youtubeCheck.videoId);

        if (!vttContent || vttContent.length === 0) {
          return NextResponse.json({ error: '无法获取 YouTube 字幕，该视频可能没有字幕' }, { status: 404 });
        }

        console.warn('[Transcribe] YouTube 字幕获取成功，长度:', vttContent.length);

        // 解析 VTT 字幕
        const parsed = parseVTT(vttContent);
        console.warn('[Transcribe] 解析出', parsed.length, '条字幕');

        if (parsed.length === 0) {
          return NextResponse.json({ error: 'YouTube 字幕解析失败' }, { status: 500 });
        }

        // 语言检测和对齐
        console.warn('[Transcribe] 检测字幕语言...');

        // 更新状态：分析语言中
        steps[2].status = 'completed';
        steps[3].status = 'completed'; // 跳过AI转写步骤（YouTube已有字幕）
        steps[4].status = 'running'; // analyzing
        await updateExecutionStatus(supabase, jobId!, {
          progress: 70,
          metadata: {
            current_step: 'analyzing',
            step_label: `分析语言 (${parsed.length} 条字幕)`,
            steps_completed: 4,
            total_steps: steps.length,
            subtitle_count: parsed.length,
            steps: steps,
          },
        });

        transcripts = await detectAndAlignLanguages(parsed);

        // 检测是否需要翻译（单语字幕）
        const needsTranslation = transcripts.some((t) => t.needsTranslation);
        
        if (needsTranslation) {
          const hasEnglish = transcripts.some((t) => t.text_en);
          const sourceLanguage = hasEnglish ? 'en' : 'zh';
          console.warn(`[Transcribe] 检测到单语字幕 (${sourceLanguage})，将在后续 translate job 中处理翻译`);
        } else {
          console.warn('[Transcribe] 检测到双语字幕，无需翻译');
        }

        usedMethod = 'youtube';
      } catch (error) {
        console.error('[Transcribe] YouTube 字幕获取失败:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'YouTube 字幕获取失败' },
          { status: 500 }
        );
      }
    } else {
      // ==================== 本地视频文件处理流程 ====================
      console.warn('[Transcribe] 检测到本地视频文件');

      // 4. 解析视频 URL
      let videoUrl: string;

      // 更新状态：下载视频中
      steps[0].status = 'completed';
      steps[1].status = 'running'; // downloading
      await updateExecutionStatus(supabase, jobId!, {
        progress: 20,
        metadata: {
          current_step: 'downloading',
          step_label: '下载视频文件',
          steps_completed: 2,
          total_steps: steps.length,
          steps: steps,
        },
      });

      if (asset.source_url.startsWith('http://') || asset.source_url.startsWith('https://')) {
        videoUrl = asset.source_url;
      } else {
        // 是 Storage 路径，需要生成 signed URL
        const storagePath = asset.source_url;
        const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'media-uploads';

        const { data: urlData, error: urlError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(storagePath, 3600);

        if (urlError || !urlData?.signedUrl) {
          // 尝试使用公共 URL
          const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
          try {
            const testRes = await fetch(publicUrl, { method: 'HEAD' });
            if (testRes.ok) {
              videoUrl = publicUrl;
            } else {
              return NextResponse.json({ error: '无法访问视频文件' }, { status: 500 });
            }
          } catch {
            return NextResponse.json({ error: '无法访问视频文件' }, { status: 500 });
          }
        } else {
          videoUrl = urlData.signedUrl;
        }
      }

      // 5. 下载视频文件
      console.warn('[Transcribe] 开始下载视频...');
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        return NextResponse.json({ error: `视频下载失败: ${videoResponse.status}` }, { status: 500 });
      }

      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      console.warn('[Transcribe] 视频下载成功，大小:', videoBuffer.length, '字节');

      // 6. 分层策略处理字幕

      // 步骤 1: 尝试提取内嵌字幕
      console.warn('[Transcribe] 步骤 1: 尝试提取内嵌字幕...');

      // 更新状态：提取字幕中
      steps[1].status = 'completed';
      steps[2].status = 'running'; // extracting
      await updateExecutionStatus(supabase, jobId!, {
        progress: 40,
        metadata: {
          current_step: 'extracting',
          step_label: '提取内嵌字幕',
          steps_completed: 3,
          total_steps: steps.length,
          steps: steps,
        },
      });

      const subtitleContent = await extractEmbeddedSubtitles(videoBuffer);

      if (subtitleContent && subtitleContent.trim().length > 10) {
        // 步骤 2: 解析字幕
        console.warn('[Transcribe] 步骤 2: 解析字幕内容...');
        usedMethod = 'extract';

        const parsed = subtitleContent.includes('WEBVTT')
          ? parseVTT(subtitleContent)
          : parseSRT(subtitleContent);

        console.warn('[Transcribe] 解析出', parsed.length, '条字幕');

        if (parsed.length === 0) {
          return NextResponse.json({ error: '字幕解析失败' }, { status: 500 });
        }

        // 步骤 3: 语言检测和对齐
        console.warn('[Transcribe] 步骤 3: 检测语言...');

        // 更新状态：分析语言中
        steps[2].status = 'completed';
        steps[4].status = 'running'; // analyzing
        await updateExecutionStatus(supabase, jobId!, {
          progress: 70,
          metadata: {
            current_step: 'analyzing',
            step_label: `分析语言 (${parsed.length} 条字幕)`,
            steps_completed: 4,
            total_steps: steps.length,
            subtitle_count: parsed.length,
            steps: steps,
          },
        });

        transcripts = await detectAndAlignLanguages(parsed);

        // 步骤 4: 检测是否需要翻译
        const needsTranslation = transcripts.some((t) => t.needsTranslation);
        
        if (needsTranslation) {
          const hasEnglish = transcripts.some((t) => t.text_en);
          const sourceLanguage = hasEnglish ? 'en' : 'zh';
          console.warn(`[Transcribe] 步骤 4: 检测到单语字幕 (${sourceLanguage})，将在后续 translate job 中处理翻译`);
        } else {
          console.warn('[Transcribe] 步骤 4: 检测到双语字幕，无需翻译');
        }
      } else {
        // 步骤 5: 无字幕，使用 AI 转写
        console.warn('[Transcribe] 步骤 5: 未找到内嵌字幕，使用 AI 转写...');
        usedMethod = 'transcribe';

        // 更新状态：AI 转写中
        steps[2].status = 'completed';
        steps[3].status = 'running'; // ai_transcribe
        await updateExecutionStatus(supabase, jobId!, {
          progress: 60,
          metadata: {
            current_step: 'recognizing',
            step_label: '使用 AI 识别字幕',
            steps_completed: 4,
            total_steps: steps.length,
            steps: steps,
          },
        });

        const router = getRouter();
        const base64Video = videoBuffer.toString('base64');

        try {
          // 使用新的多提供商路由器（默认智谱 GLM-4.6V）
          const result = await router.execute(
            'transcribe',
            { data: base64Video, mimeType: 'video/mp4' },
            {} // 不指定 provider，使用默认的智谱 GLM
          );

          const transcribeData = result.data as Array<{
            id: string;
            startTime: number;
            endTime: number;
            text: string;
            translation: string;
          }>;

          // 转换为 BilingualSubtitle 格式
          transcripts = transcribeData.map((item) => ({
            id: item.id,
            start: item.startTime,
            end: item.endTime,
            text_en: item.text,
            text_cn: item.translation,
            needsTranslation: false,
          }));

          console.warn(`[Transcribe] AI 转写完成 (provider: ${result.provider}, latency: ${result.latency}ms, 生成 ${transcripts.length} 条字幕)`);

          // 更新状态：AI 转写完成，显示识别到的字幕数量
          await updateExecutionStatus(supabase, jobId!, {
            progress: 80,
            metadata: {
              current_step: 'generating',
              step_label: `生成完成 (${transcripts.length} 条字幕)`,
              steps_completed: 5,
              total_steps: steps.length,
              subtitle_count: transcripts.length,
              provider: result.provider,
            },
          });
        } catch (error) {
          console.error('[Transcribe] AI 转写失败:', error);
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'AI 转写失败' },
            { status: 500 }
          );
        }
      }
    }

    // 6. 保存到数据库
    console.warn('[Transcribe] 步骤 6: 保存到数据库...');

    // 更新状态：保存到数据库中
    steps[4].status = 'completed';
    steps[5].status = 'running'; // saving
    await updateExecutionStatus(supabase, jobId!, {
      progress: 95,
      metadata: {
        current_step: 'saving',
        step_label: `保存 ${transcripts.length} 条字幕到数据库`,
        steps_completed: 6,
        total_steps: steps.length,
        subtitle_count: transcripts.length,
        steps: steps,
      },
    });

    const { error: insertError } = await supabase
      .from('transcripts')
      .insert(
        transcripts.map((t, idx) => ({
          asset_id: actualAssetId,
          sequence: idx,
          start_time_ms: Math.round(t.start),
          end_time_ms: Math.round(t.end),
          text_en: t.text_en || null,
          text_cn: t.text_cn || null,
          notation: null,
          lock_state: 'unlocked',
          status: 'pending',
        }))
      );

    if (insertError) {
      console.error('保存字幕失败', insertError);
      return NextResponse.json({ error: '保存字幕失败' }, { status: 500 });
    }

    // 7. 更新 media_assets 状态
    await supabase.from('media_assets').update({ status: 'processing' }).eq('id', actualAssetId);

    // 8. 更新 transcribe job 为完成状态
    steps[5].status = 'completed';
    await updateExecutionStatus(supabase, jobId!, {
      status: 'completed',
      progress: 100,
      metadata: {
        current_step: 'completed',
        step_label: '转写完成',
        steps_completed: steps.length,
        total_steps: steps.length,
        subtitle_count: transcripts.length,
        method: usedMethod,
        steps: steps,
      },
    });

    // 9. 自动创建并触发 translate job（如果需要翻译）
    const needsTranslation = transcripts.some((t) => t.needsTranslation);
    
    if (needsTranslation) {
      const hasEnglish = transcripts.some((t) => t.text_en);
      const hasChinese = transcripts.some((t) => t.text_cn);
      
      // 确定源语言和目标语言
      const sourceLanguage = hasEnglish && !hasChinese ? 'en' : 
                            hasChinese && !hasEnglish ? 'zh' : 
                            'bilingual';
      
      if (sourceLanguage !== 'bilingual') {
        // 只有单语字幕才需要翻译
        const targetLanguage = sourceLanguage === 'en' ? 'zh' : 'en';
        
        console.warn('[Transcribe] 自动创建 translate job...');
        
        // 获取 pipeline_id
        const { data: currentExecution } = await supabase
          .from('stage_executions')
          .select('pipeline_id')
          .eq('id', jobId!)
          .single();
        
        if (currentExecution?.pipeline_id) {
          // 使用新的函数创建 translate execution
          const { data: translateJobId, error: createJobError } = await supabase
            .rpc('create_stage_execution', {
              p_pipeline_id: currentExecution.pipeline_id,
              p_asset_id: actualAssetId,
              p_stage: 'translate',
              p_status: 'pending',
              p_progress: 0,
              p_source_language: sourceLanguage,
              p_target_language: targetLanguage,
              p_metadata: {
                auto_created: true,
                created_by: 'transcribe_api',
              },
            });
          
          if (createJobError || !translateJobId) {
            console.error('[Transcribe] 创建 translate job 失败:', createJobError);
          } else {
            console.warn(`[Transcribe] ✅ 已创建 translate job: ${translateJobId} (${sourceLanguage} → ${targetLanguage})`);
            
            // 直接调用翻译逻辑（不通过 HTTP），避免自调用问题
            console.warn('[Transcribe] 🚀 自动触发翻译任务...');
            
            // 异步执行翻译任务，不阻塞转录响应
            (async () => {
              try {
                // 动态导入翻译服务
                const { executeTranslation } = await import('@/lib/translate-service');
                
                const result = await executeTranslation(
                  translateJobId,
                  actualAssetId,
                  sourceLanguage,
                  targetLanguage
                );
                
                if (result.success) {
                  console.warn('[Transcribe] ✅ 翻译任务已完成', {
                    translatedCount: result.translatedCount,
                    duration: `${result.duration}ms`,
                  });
                } else {
                  console.error('[Transcribe] 翻译任务失败:', result.error);
                }
              } catch (error) {
                console.error('[Transcribe] 触发翻译任务异常:', error);
              }
            })();
          }
        } else {
          console.error('[Transcribe] 无法获取 pipeline_id，跳过创建 translate job');
        }
      } else {
        console.warn('[Transcribe] 检测到双语字幕，无需创建 translate job');
      }
    } else {
      console.warn('[Transcribe] 无需翻译，跳过创建 translate job');
    }

    console.warn('[Transcribe] 完成！生成', transcripts.length, '条字幕，使用方法:', usedMethod);

    // 获取 pipeline_id 以便前端追踪整个流程
    const { data: executionData } = await supabase
      .from('stage_executions')
      .select('pipeline_id')
      .eq('id', jobId!)
      .single();

    return NextResponse.json({
      success: true,
      jobId: jobId, // 返回 jobId 以便前端可以跟踪状态
      pipelineId: executionData?.pipeline_id, // 返回 pipelineId 以便追踪整个流程
      transcripts: transcripts.map((t) => ({
        id: t.id,
        startTime: t.start,
        endTime: t.end,
        text: t.text_en || t.text_cn || '',
        translation: t.text_cn || t.text_en || '',
        lockState: 'unlocked',
        status: 'pending',
      })),
    });
  } catch (error) {
    console.error('[Transcribe] 转写失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '转写失败' },
      { status: 500 }
    );
  }
}
