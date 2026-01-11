import { NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai/router';
import type { TranscriptLine } from '@echospeak/types';

const fallbackTranslate = (raw: string): TranscriptLine[] => {
  const sentences = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return sentences.map((text, index) => ({
    id: `fallback-${index}`,
    text,
    translation: text.includes(' ') ? `【机译】${text}` : text,
    startTime: index * 4_000,
    endTime: index * 4_000 + 3_500,
  }));
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = body?.text as string | undefined;
  if (!text || !text.trim()) {
    return NextResponse.json({ error: '缺少文本内容' }, { status: 400 });
  }

  try {
    const router = getRouter();

    // 使用新的多提供商路由器
    const result = await router.execute(
      'bilingualize',
      text,
      {} // 不指定 provider，使用默认的智谱 GLM
    );

    return NextResponse.json({
      lines: result.data as TranscriptLine[],
      fallback: false,
      provider: result.provider, // 返回实际使用的提供商
      latency: result.latency,
      cost: result.cost,
    });
  } catch (error) {
    console.warn('调用 AI 失败，使用 fallback 翻译', error);
    return NextResponse.json({
      lines: fallbackTranslate(text),
      fallback: true,
      provider: 'fallback',
    });
  }
}
