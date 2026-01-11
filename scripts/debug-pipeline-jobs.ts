/**
 * 诊断脚本：检查 Pipeline 的所有 Jobs
 * 
 * 运行: npx tsx scripts/debug-pipeline-jobs.ts <pipelineId>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPipelineJobs(pipelineId: string) {
  console.log('='.repeat(70));
  console.log('🔍 Pipeline Jobs 诊断工具');
  console.log('='.repeat(70));
  console.log(`Pipeline ID: ${pipelineId}`);
  console.log('');

  // 1. 获取 Pipeline 信息
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .select(`
      *,
      asset:media_assets(id, title, source_url, status)
    `)
    .eq('id', pipelineId)
    .single();

  if (pipelineError || !pipeline) {
    console.error('❌ Pipeline 不存在:', pipelineError?.message);
    return;
  }

  console.log('📋 Pipeline 信息:');
  const asset = Array.isArray(pipeline.asset) ? pipeline.asset[0] : pipeline.asset;
  const isYouTube = asset?.source_url?.includes('youtube.com') || asset?.source_url?.includes('youtu.be');
  console.log(`   视频标题: ${asset?.title || '未知'}`);
  console.log(`   视频类型: ${isYouTube ? 'YouTube' : '本地视频'}`);
  console.log(`   Pipeline 状态: ${pipeline.status}`);
  console.log(`   当前阶段: ${pipeline.current_stage || '无'}`);
  console.log(`   整体进度: ${pipeline.progress}%`);
  console.log('');

  // 2. 获取所有 Jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('created_at', { ascending: true });

  if (jobsError) {
    console.error('❌ 获取 Jobs 失败:', jobsError.message);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('⚠️  没有找到任何 Jobs');
    return;
  }

  console.log(`📊 找到 ${jobs.length} 个 Jobs:`);
  console.log('');

  // 3. 按阶段分组
  const stages = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
  const jobsByStage = new Map<string, typeof jobs>();

  jobs.forEach((job) => {
    const existing = jobsByStage.get(job.stage) || [];
    jobsByStage.set(job.stage, [...existing, job]);
  });

  // 4. 显示每个阶段
  stages.forEach((stage) => {
    const stageJobs = jobsByStage.get(stage) || [];
    const labels: Record<string, string> = {
      upload: '📤 上传视频',
      transcribe: '📝 提取字幕',
      translate: '🌐 翻译字幕',
      notation: '🎵 生成发音谱',
      publish: '✅ 发布内容',
    };

    console.log(`${labels[stage]}:`);

    if (stageJobs.length === 0) {
      console.log(`   ⚪ 未开始 (0 个任务)`);
    } else {
      console.log(`   共 ${stageJobs.length} 个批次:`);
      stageJobs.forEach((job, index) => {
        const statusEmoji: Record<string, string> = {
          pending: '⏸️',
          queued: '⏰',
          running: '🔄',
          completed: '✅',
          failed: '❌',
          retrying: '🔁',
          canceled: '🚫',
        };

        console.log(`      批次 #${index + 1}:`);
        console.log(`         Job ID: ${job.id}`);
        console.log(`         状态: ${statusEmoji[job.status] || '❓'} ${job.status}`);
        console.log(`         进度: ${job.progress}%`);
        console.log(`         创建时间: ${new Date(job.created_at).toLocaleString('zh-CN')}`);
        if (job.started_at) {
          console.log(`         开始时间: ${new Date(job.started_at).toLocaleString('zh-CN')}`);
        }
        if (job.completed_at) {
          console.log(`         完成时间: ${new Date(job.completed_at).toLocaleString('zh-CN')}`);
        }
        if (job.error_message) {
          console.log(`         错误: ${job.error_message}`);
        }
        console.log('');
      });
    }
    console.log('');
  });

  // 5. 统计摘要
  console.log('='.repeat(70));
  console.log('📈 统计摘要:');
  console.log('='.repeat(70));

  const statusCount = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} 个`);
  });

  console.log('');
  console.log(`✅ 已完成: ${jobs.filter((j) => j.status === 'completed').length} 个`);
  console.log(`🔄 执行中: ${jobs.filter((j) => j.status === 'running').length} 个`);
  console.log(`⏰ 队列中: ${jobs.filter((j) => j.status === 'queued').length} 个`);
  console.log(`❌ 失败: ${jobs.filter((j) => j.status === 'failed').length} 个`);
  console.log('');

  // 6. 阶段覆盖情况
  console.log('📋 阶段覆盖情况:');
  stages.forEach((stage) => {
    const hasJobs = jobsByStage.has(stage) && jobsByStage.get(stage)!.length > 0;
    console.log(`   ${hasJobs ? '✅' : '⚪'} ${stage}`);
  });
  console.log('');
  console.log('='.repeat(70));
}

// 运行脚本
const pipelineId = process.argv[2];

if (!pipelineId) {
  console.error('❌ 请提供 Pipeline ID');
  console.log('');
  console.log('用法: npx tsx scripts/debug-pipeline-jobs.ts <pipelineId>');
  console.log('');
  console.log('示例: npx tsx scripts/debug-pipeline-jobs.ts 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

debugPipelineJobs(pipelineId)
  .then(() => {
    console.log('✅ 诊断完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 诊断失败:', error);
    process.exit(1);
  });
