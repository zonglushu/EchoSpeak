/**
 * 使用 youtube-caption-extractor 包获取 YouTube 字幕
 * 这是经过验证的可靠方案，支持 Node.js 和 Edge runtime
 */

import { getSubtitles } from 'youtube-caption-extractor';

export async function fetchYouTubeCaptions(videoId: string): Promise<string> {
  try {
    console.warn('[YouTube Scraper] 开始获取字幕...');

    // 尝试多种语言获取字幕，优先级：英文 > 中文 > 自动生成
    const languagesToTry = ['en', 'zh', 'zh-CN', 'zh-TW', 'auto'];
    let subtitles = null;
    let usedLang = '';

    for (const lang of languagesToTry) {
      try {
        console.warn(`[YouTube Scraper] 尝试获取 ${lang} 字幕...`);
        subtitles = await getSubtitles({
          videoID: videoId,
          lang: lang,
        });
        
        if (subtitles && subtitles.length > 0) {
          usedLang = lang;
          console.warn(`[YouTube Scraper] ✓ 成功获取 ${lang} 字幕，共 ${subtitles.length} 条`);
          break;
        }
      } catch {
        console.warn(`[YouTube Scraper] ${lang} 字幕不可用`);
        continue;
      }
    }

    if (!subtitles || subtitles.length === 0) {
      throw new Error('没有找到字幕内容，该视频可能没有上传字幕或字幕不可用');
    }

    console.warn(`[YouTube Scraper] ✓ 使用 ${usedLang} 语言，获取到 ${subtitles.length} 条字幕`);

    // 将字幕数据转换为 VTT 格式
    let vttContent = 'WEBVTT\n\n';

    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      const start = formatVTTTime(parseFloat(sub.start));
      const end = formatVTTTime(parseFloat(sub.start) + parseFloat(sub.dur));

      vttContent += `${i + 1}\n${start} --> ${end}\n${sub.text}\n\n`;
    }

    console.warn(`[YouTube Scraper] ✓ VTT 内容生成完成，长度: ${vttContent.length}`);
    console.warn(`[YouTube Scraper] VTT 预览: ${vttContent.substring(0, 200)}...`);

    return vttContent;
  } catch (error) {
    console.error('[YouTube Scraper] 错误:', error);
    throw error;
  }
}

// 将秒数转换为 VTT 时间格式 (HH:MM:SS.mmm)
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, width: number = 2) => n.toString().padStart(width, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`;
}


