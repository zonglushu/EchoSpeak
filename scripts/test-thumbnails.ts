/**
 * 测试不同来源的缩略图 URL
 * 
 * 运行: npx tsx scripts/test-thumbnails.ts
 */

// 测试 URL
const testUrls = [
  {
    type: 'YouTube maxres',
    url: 'https://img.youtube.com/vi/Pz68t3RGeqI/maxresdefault.jpg',
    expected: 'accessible',
  },
  {
    type: 'YouTube hq',
    url: 'https://img.youtube.com/vi/Pz68t3RGeqI/hqdefault.jpg',
    expected: 'accessible',
  },
  {
    type: 'YouTube mq',
    url: 'https://img.youtube.com/vi/Pz68t3RGeqI/mqdefault.jpg',
    expected: 'accessible',
  },
  {
    type: 'YouTube default',
    url: 'https://img.youtube.com/vi/Pz68t3RGeqI/default.jpg',
    expected: 'accessible',
  },
  {
    type: 'Supabase (需要替换)',
    url: 'https://qpdmmzfravgswrezxsci.supabase.co/storage/v1/object/public/media-covers/test.jpg',
    expected: 'depends on file',
  },
];

async function testThumbnail(url: string, type: string) {
  try {
    console.log(`\n🧪 测试: ${type}`);
    console.log(`   URL: ${url}`);

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (response.ok) {
      console.log(`   ✅ 可访问`);
      console.log(`      状态码: ${response.status}`);
      console.log(`      内容类型: ${contentType}`);
      console.log(`      文件大小: ${contentLength ? `${Math.round(parseInt(contentLength) / 1024)}KB` : '未知'}`);
      return true;
    } else {
      console.log(`   ❌ 不可访问`);
      console.log(`      状态码: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 请求失败`);
    console.log(`      错误: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🎬 缩略图 URL 测试工具');
  console.log('='.repeat(70));

  const results = [];

  for (const test of testUrls) {
    const result = await testThumbnail(test.url, test.type);
    results.push({
      type: test.type,
      success: result,
      expected: test.expected,
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(70));

  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.type} - 预期: ${result.expected}`);
  });

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log('\n' + '-'.repeat(70));
  console.log(`成功: ${successCount}/${totalCount}`);
  console.log('='.repeat(70));

  // 提取 YouTube Video ID 的示例
  console.log('\n💡 提示：提取 YouTube Video ID');
  console.log('-'.repeat(70));

  const youtubeUrls = [
    'https://www.youtube.com/watch?v=Pz68t3RGeqI',
    'https://youtu.be/Pz68t3RGeqI',
    'https://www.youtube.com/embed/Pz68t3RGeqI',
  ];

  console.log('从以下 URL 提取 Video ID:');
  youtubeUrls.forEach((url) => {
    const videoId = extractYouTubeVideoId(url);
    console.log(`  ${url}`);
    console.log(`  → Video ID: ${videoId}`);
    if (videoId) {
      console.log(`  → 缩略图: https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    }
    console.log('');
  });
}

function extractYouTubeVideoId(url: string): string | null {
  // 支持多种 YouTube URL 格式
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/,
    /youtube\.com\/v\/([^&?/\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// 运行测试
main().catch(console.error);
