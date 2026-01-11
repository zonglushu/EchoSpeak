/**
 * 测试 Translate Job API
 * 
 * 用法:
 * npx tsx scripts/test-translate-job.ts <pipeline-id>
 * 
 * 功能:
 * 1. 查找指定 pipeline 的 transcribe job
 * 2. 创建新的 translate job
 * 3. 调用 translate-job API
 * 4. 监控翻译进度
 * 5. 验证翻译结果
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Job {
  id: string;
  pipeline_id: string;
  stage: string;
  status: string;
  progress: number;
  source_language?: string;
  target_language?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface Pipeline {
  id: string;
  asset_id: string;
  status: string;
  progress: number;
}

async function testTranslateJob(pipelineId: string) {
  console.log('\n🧪 测试 Translate Job API');
  console.log('='.repeat(60));
  console.log(`📋 Pipeline ID: ${pipelineId}\n`);

  // 1. 获取 Pipeline 信息
  console.log('📌 步骤 1: 获取 Pipeline 信息...');
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .select('*')
    .eq('id', pipelineId)
    .single();

  if (pipelineError || !pipeline) {
    console.error('❌ 获取 Pipeline 失败:', pipelineError);
    return;
  }

  console.log('✅ Pipeline 找到:');
  console.log(`   Asset ID: ${pipeline.asset_id}`);
  console.log(`   Status: ${pipeline.status}`);
  console.log(`   Progress: ${pipeline.progress}%\n`);

  // 2. 查找已完成的 transcribe job
  console.log('📌 步骤 2: 查找已完成的 transcribe job...');
  const { data: transcribeJobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .eq('stage', 'transcribe')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (jobsError || !transcribeJobs || transcribeJobs.length === 0) {
    console.error('❌ 没有找到已完成的 transcribe job');
    console.log('💡 提示: 请先完成字幕提取\n');
    return;
  }

  const transcribeJob = transcribeJobs[0];
  console.log('✅ 找到 transcribe job:');
  console.log(`   Job ID: ${transcribeJob.id}`);
  console.log(`   Status: ${transcribeJob.status}`);
  console.log(`   Created: ${transcribeJob.created_at}\n`);

  // 3. 检查是否有字幕数据
  console.log('📌 步骤 3: 检查字幕数据...');
  const { data: transcripts, error: transcriptsError } = await supabase
    .from('transcripts')
    .select('id, sequence, text_en, text_cn')
    .eq('asset_id', pipeline.asset_id)
    .order('sequence', { ascending: true });

  if (transcriptsError || !transcripts || transcripts.length === 0) {
    console.error('❌ 没有找到字幕数据');
    return;
  }

  console.log(`✅ 找到 ${transcripts.length} 条字幕`);
  console.log('   示例字幕:');
  transcripts.slice(0, 3).forEach((t, idx) => {
    console.log(`   [${idx + 1}] EN: ${t.text_en?.substring(0, 50)}...`);
    console.log(`       CN: ${t.text_cn?.substring(0, 50)}...`);
  });
  console.log();

  // 4. 创建 translate job
  console.log('📌 步骤 4: 创建 translate job...');
  const { data: translateJob, error: createJobError } = await supabase
    .from('jobs')
    .insert({
      pipeline_id: pipelineId,
      stage: 'translate',
      status: 'pending',
      progress: 0,
      source_language: 'en',
      target_language: 'zh-CN',
    })
    .select()
    .single();

  if (createJobError || !translateJob) {
    console.error('❌ 创建 translate job 失败:', createJobError);
    return;
  }

  console.log('✅ Translate job 创建成功:');
  console.log(`   Job ID: ${translateJob.id}`);
  console.log(`   Source: en → Target: zh-CN\n`);

  // 5. 调用 translate-job API
  console.log('📌 步骤 5: 调用 translate-job API...');
  console.log('⏳ 开始翻译（这可能需要几分钟）...\n');

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const startTime = Date.now();

  try {
    const response = await fetch(`${apiUrl}/api/ai/translate-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId: translateJob.id,
        assetId: pipeline.asset_id,
        sourceLanguage: 'en',
        targetLanguage: 'zh-CN',
      }),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error('❌ API 调用失败:', result);
      console.log(`   状态码: ${response.status}`);
      console.log(`   错误: ${result.error}`);
      if (result.details) {
        console.log(`   详情: ${result.details}`);
      }
      return;
    }

    console.log('✅ 翻译完成!');
    console.log('='.repeat(60));
    console.log('📊 统计信息:');
    console.log(`   翻译数量: ${result.translatedCount} 条`);
    console.log(`   总耗时: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   API 耗时: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`   平均延迟: ${result.avgLatency}ms/批次`);
    console.log(`   翻译成本: $${result.cost.toFixed(4)}`);
    console.log(`   提供商: ${result.provider || 'google-translate'}`);
    console.log();

    // 6. 验证翻译结果
    console.log('📌 步骤 6: 验证翻译结果...');
    const { data: updatedTranscripts, error: verifyError } = await supabase
      .from('transcripts')
      .select('id, sequence, text_en, text_cn, translations')
      .eq('asset_id', pipeline.asset_id)
      .order('sequence', { ascending: true })
      .limit(5);

    if (verifyError || !updatedTranscripts) {
      console.error('❌ 验证失败:', verifyError);
      return;
    }

    console.log('✅ 翻译结果验证:');
    console.log('   前 5 条字幕:\n');

    updatedTranscripts.forEach((t, idx) => {
      console.log(`   [${idx + 1}] EN: ${t.text_en?.substring(0, 60)}...`);
      console.log(`       CN (旧): ${t.text_cn?.substring(0, 60)}...`);
      
      if (t.translations && t.translations['zh-CN']) {
        console.log(`       CN (新): ${t.translations['zh-CN'].substring(0, 60)}...`);
      } else {
        console.log(`       CN (新): [未找到翻译]`);
      }
      console.log();
    });

    // 7. 检查 Job 状态
    console.log('📌 步骤 7: 检查 Job 最终状态...');
    const { data: finalJob, error: finalJobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', translateJob.id)
      .single();

    if (finalJobError || !finalJob) {
      console.error('❌ 获取 Job 状态失败:', finalJobError);
      return;
    }

    console.log('✅ Job 最终状态:');
    console.log(`   Status: ${finalJob.status}`);
    console.log(`   Progress: ${finalJob.progress}%`);
    console.log(`   Started: ${finalJob.started_at}`);
    console.log(`   Completed: ${finalJob.completed_at}`);
    if (finalJob.error) {
      console.log(`   Error: ${finalJob.error}`);
    }
    console.log();

    // 8. 检查 Pipeline 进度
    console.log('📌 步骤 8: 检查 Pipeline 进度更新...');
    const { data: finalPipeline, error: finalPipelineError } = await supabase
      .from('pipelines')
      .select('progress, status')
      .eq('id', pipelineId)
      .single();

    if (finalPipelineError || !finalPipeline) {
      console.error('❌ 获取 Pipeline 状态失败:', finalPipelineError);
      return;
    }

    console.log('✅ Pipeline 进度已更新:');
    console.log(`   Progress: ${pipeline.progress}% → ${finalPipeline.progress}%`);
    console.log(`   Status: ${finalPipeline.status}`);
    console.log();

    console.log('🎉 测试完成!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    if (error instanceof Error) {
      console.log(`   错误类型: ${error.name}`);
      console.log(`   错误信息: ${error.message}`);
      console.log(`   堆栈跟踪: ${error.stack}`);
    }
  }
}

// 主函数
async function main() {
  const pipelineId = process.argv[2];

  if (!pipelineId) {
    console.error('❌ 用法: npx tsx scripts/test-translate-job.ts <pipeline-id>');
    console.log('\n示例:');
    console.log('  npx tsx scripts/test-translate-job.ts dd2935fc-8731-457c-b69a-e8e0fd99dcbe');
    process.exit(1);
  }

  await testTranslateJob(pipelineId);
}

main().catch(console.error);
