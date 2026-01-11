/**
 * 获取最近的 Pipelines
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../apps/admin/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listRecentPipelines() {
  const { data: pipelines, error } = await supabase
    .from('pipelines')
    .select(`
      id,
      status,
      current_stage,
      progress,
      created_at,
      asset:media_assets(title, source_url)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 获取 Pipelines 失败:', error.message);
    return;
  }

  console.log('📋 最近的 10 个 Pipelines:');
  console.log('');

  pipelines?.forEach((p, i) => {
    const asset = Array.isArray(p.asset) ? p.asset[0] : p.asset;
    const isYouTube = asset?.source_url?.includes('youtube.com') || asset?.source_url?.includes('youtu.be');
    console.log(`${i + 1}. Pipeline ID: ${p.id}`);
    console.log(`   视频标题: ${asset?.title || '未知'}`);
    console.log(`   视频类型: ${isYouTube ? 'YouTube' : '本地视频'}`);
    console.log(`   状态: ${p.status}`);
    console.log(`   当前阶段: ${p.current_stage || '无'}`);
    console.log(`   进度: ${p.progress}%`);
    console.log(`   创建时间: ${new Date(p.created_at).toLocaleString('zh-CN')}`);
    console.log('');
  });

  if (pipelines && pipelines.length > 0) {
    console.log('💡 使用第一个 Pipeline 进行诊断...');
    console.log('');
    return pipelines[0].id;
  }
}

listRecentPipelines()
  .then((firstId) => {
    if (firstId) {
      console.log(`运行诊断命令:`);
      console.log(`npx tsx scripts/debug-pipeline-jobs.ts ${firstId}`);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
