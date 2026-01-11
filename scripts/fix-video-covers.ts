/**
 * 修复脚本：为现有视频补充封面 URL
 * 
 * 运行方式：
 * npx tsx scripts/fix-video-covers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../apps/admin/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * 从 YouTube URL 提取视频 ID
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    // 标准 URL: youtube.com/watch?v=VIDEO_ID
    if (pathname === '/watch') {
      return parsed.searchParams.get('v');
    }

    // 短链接: youtu.be/VIDEO_ID
    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      return pathname.slice(1);
    }

    // 嵌入链接: youtube.com/embed/VIDEO_ID
    if (pathname.startsWith('/embed/')) {
      return pathname.slice(7);
    }

    // Shorts: youtube.com/shorts/VIDEO_ID
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
 * 获取 YouTube 缩略图 URL
 */
function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

async function fixVideoCovers() {
  console.log('🔍 开始检查视频封面...\n');

  // 1. 查找所有没有 cover_url 的视频
  const { data: assets, error } = await supabase
    .from('media_assets')
    .select('id, title, source_url, cover_url, tag_list')
    .or('cover_url.is.null,cover_url.eq.');

  if (error) {
    console.error('❌ 查询失败:', error);
    return;
  }

  if (!assets || assets.length === 0) {
    console.log('✅ 所有视频都已有封面 URL！');
    return;
  }

  console.log(`📊 找到 ${assets.length} 个没有封面的视频\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const asset of assets) {
    console.log(`📹 处理: ${asset.title}`);
    console.log(`   ID: ${asset.id}`);
    console.log(`   Source: ${asset.source_url || 'N/A'}`);

    let coverUrl: string | null = null;

    // 检查是否是 YouTube 视频
    const isYouTube =
      asset.tag_list?.includes('youtube') ||
      (asset.source_url && asset.source_url.includes('youtube')) ||
      (asset.source_url && asset.source_url.includes('youtu.be'));

    if (isYouTube && asset.source_url) {
      const videoId = extractYouTubeVideoId(asset.source_url);
      if (videoId) {
        coverUrl = getYouTubeThumbnailUrl(videoId);
        console.log(`   ✅ YouTube 视频，生成封面: ${coverUrl}`);
      } else {
        console.log('   ⚠️  无法提取 YouTube 视频 ID');
        skippedCount++;
        continue;
      }
    } else {
      console.log('   ⚠️  本地视频，需要手动生成封面');
      skippedCount++;
      continue;
    }

    // 更新数据库
    if (coverUrl) {
      const { error: updateError } = await supabase
        .from('media_assets')
        .update({ cover_url: coverUrl })
        .eq('id', asset.id);

      if (updateError) {
        console.log(`   ❌ 更新失败: ${updateError.message}`);
      } else {
        console.log(`   ✅ 封面 URL 已更新`);
        fixedCount++;
      }
    }

    console.log('');
  }

  console.log('📊 修复完成！');
  console.log(`   ✅ 修复: ${fixedCount} 个`);
  console.log(`   ⚠️  跳过: ${skippedCount} 个 (需要手动处理)`);
}

// 运行脚本
fixVideoCovers()
  .then(() => {
    console.log('\n🎉 脚本执行完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  });
