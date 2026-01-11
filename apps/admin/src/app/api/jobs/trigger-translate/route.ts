import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

/**
 * POST /api/jobs/trigger-translate
 * 
 * 触发待处理的翻译任务
 * 
 * 这个 API 可以：
 * 1. 手动触发特定的 translate job
 * 2. 批量触发所有待处理的 translate jobs
 * 3. 作为定时任务使用，自动处理队列
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, batchMode } = body;

    const supabase = getSupabaseServiceClient();

    if (jobId) {
      // 单个 job 触发
      return await triggerSingleJob(jobId, supabase);
    } else if (batchMode) {
      // 批量触发模式
      return await triggerBatchJobs(supabase);
    } else {
      return NextResponse.json(
        { error: '缺少参数: jobId 或 batchMode' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Trigger Translate] 错误:', error);
    return NextResponse.json(
      {
        error: '触发翻译任务失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 触发单个翻译 job
 */
async function triggerSingleJob(jobId: string, supabase: ReturnType<typeof getSupabaseServiceClient>) {
  // 1. 获取 job 信息
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, pipelines(asset_id)')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: '未找到 job' },
      { status: 404 }
    );
  }

  if (job.stage !== 'translate') {
    return NextResponse.json(
      { error: '该 job 不是翻译任务' },
      { status: 400 }
    );
  }

  if (job.status !== 'pending') {
    return NextResponse.json(
      { error: `Job 状态不是 pending (当前: ${job.status})` },
      { status: 400 }
    );
  }

  // 2. 调用 translate-job API
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${appUrl}/api/ai/translate-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: job.id,
        assetId: job.pipelines.asset_id,
        sourceLanguage: job.source_language || 'en',
        targetLanguage: job.target_language || 'zh',
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        jobId: job.id,
        result,
      });
    } else {
      return NextResponse.json(
        {
          error: '翻译任务执行失败',
          details: result,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: '调用翻译 API 失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 批量触发所有待处理的翻译 jobs
 */
async function triggerBatchJobs(supabase: ReturnType<typeof getSupabaseServiceClient>) {
  // 1. 获取所有待处理的 translate jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*, pipelines(asset_id)')
    .eq('stage', 'translate')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10); // 一次最多处理 10 个

  if (jobsError) {
    return NextResponse.json(
      { error: '获取待处理 jobs 失败', details: jobsError },
      { status: 500 }
    );
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({
      success: true,
      message: '没有待处理的翻译任务',
      count: 0,
    });
  }

  console.warn(`[Trigger Translate] 找到 ${jobs.length} 个待处理的翻译任务`);

  // 2. 逐个触发（避免并发过多）
  const results = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  for (const job of jobs) {
    try {
      console.warn(`[Trigger Translate] 触发 job: ${job.id}`);

      const response = await fetch(`${appUrl}/api/ai/translate-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          assetId: job.pipelines.asset_id,
          sourceLanguage: job.source_language || 'en',
          targetLanguage: job.target_language || 'zh',
        }),
      });

      const result = await response.json();

      results.push({
        jobId: job.id,
        success: response.ok,
        result: response.ok ? result : { error: result },
      });

      if (response.ok) {
        console.warn(`[Trigger Translate] ✅ Job ${job.id} 触发成功`);
      } else {
        console.error(`[Trigger Translate] ❌ Job ${job.id} 触发失败:`, result);
      }
    } catch (error) {
      console.error(`[Trigger Translate] ❌ Job ${job.id} 触发异常:`, error);
      results.push({
        jobId: job.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 3. 返回批量处理结果
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: true,
    message: `批量触发完成: ${successCount} 成功, ${failCount} 失败`,
    total: jobs.length,
    successCount,
    failCount,
    results,
  });
}

/**
 * GET /api/jobs/trigger-translate
 * 
 * 获取待处理的翻译任务数量
 */
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, created_at, source_language, target_language, pipelines(asset_id)')
      .eq('stage', 'translate')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: '获取待处理 jobs 失败', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: jobs?.length || 0,
      jobs: jobs || [],
    });
  } catch (error) {
    console.error('[Trigger Translate] 获取待处理 jobs 错误:', error);
    return NextResponse.json(
      {
        error: '获取失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
