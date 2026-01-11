import { NextRequest, NextResponse } from 'next/server';

import { fetchYouTubeCaptions } from '@/lib/youtube-scraper';

// 配置 CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: '缺少 videoId 参数' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('[API] ==================== 开始获取 YouTube 字幕 ====================');
    console.log('[API] Video ID:', videoId);

    // 尝试获取字幕 - 直接不指定语言，让 YouTube 返回默认字幕
    let vttContent: string;
    try {
      console.log('[API] 尝试获取字幕（不指定语言）...');
      vttContent = await fetchYouTubeCaptions(videoId);
      console.log('[API] ✓ 成功获取 VTT 内容');
    } catch (scrapError: any) {
      console.error('[API] ✗ 抓取失败:', scrapError?.message || scrapError);

      // 返回详细的调试信息
      return NextResponse.json(
        {
          error: '无法获取字幕',
          videoId,
          debug: {
            message: scrapError?.message || '未知错误',
            stack: scrapError?.stack,
            hint: '请尝试其他视频，或该视频可能没有启用手动/自动字幕',
          },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!vttContent || vttContent.length === 0) {
      console.log('[API] ✗ VTT 内容为空');
      return NextResponse.json(
        { error: '字幕内容为空', videoId },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('[API] ✓ VTT 内容长度:', vttContent.length);

    // 解析 VTT 并返回 JSON 格式
    const lines = parseVTT(vttContent);

    if (lines.length === 0) {
      console.log('[API] ✗ 解析后没有有效字幕');
      return NextResponse.json(
        {
          error: '解析字幕失败',
          debug: {
            vttPreview: vttContent.substring(0, 500),
            hint: 'VTT 格式可能不支持或内容格式异常',
          },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`[API] ✓✓✓ 解析完成，共 ${lines.length} 条字幕`);
    console.log('[API] ==================== 获取字幕成功 ====================');

    return NextResponse.json(
      {
        success: true,
        lines,
        count: lines.length,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[API] ✗✗✗ 服务器错误:', error);
    return NextResponse.json(
      {
        error: '服务器错误',
        details: error?.message || '未知错误',
        stack: error?.stack,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// 解析 VTT 字幕格式
function parseVTT(vttContent: string) {
  const lines = vttContent.replace(/\r/g, '').split(/\n\s*\n/);
  const result: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const block = lines[i].trim();
    if (!block) continue;

    const parts = block.split('\n');
    const timeIndex = parts.findIndex((line) => line.includes('-->'));

    if (timeIndex === -1) continue;

    // 支持 VTT 的多种时间格式
    const timeMatch = parts[timeIndex].match(/(\d+:\d+:\d+[\.,]\d+)\s*-->\s*(\d+:\d+:\d+[\.,]\d+)/);
    if (!timeMatch) continue;

    const toSeconds = (s: string) => {
      const [h, m, sec] = s.split(':');
      const [ss, ms] = sec.replace(',', '.').split('.');
      return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(ss) + parseInt(ms) / 1000;
    };

    const text = parts.slice(timeIndex + 1).join(' ').replace(/<[^>]+>/g, '');

    if (text.trim()) {
      result.push({
        id: `vtt-${i}`,
        startTime: toSeconds(timeMatch[1]),
        endTime: toSeconds(timeMatch[2]),
        text: text.trim(),
        translation: 'AI 翻译中...',
      });
    }
  }

  return result;
}

