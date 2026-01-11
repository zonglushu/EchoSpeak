import { NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai/router';

interface SentencePayload {
  id: string;
  text: string;
}

const fallbackNotation = (text: string) => {
  const emphasis = text.replace(/([A-Z][a-z]+)/g, '**$1**');
  return `${emphasis} | ↗ keep the energy ↘`;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sentences: SentencePayload[] = Array.isArray(body?.sentences) ? body.sentences : [];
  const assetId = body?.assetId; // 获取 assetId 用于更新状态

  if (!sentences.length) {
    return NextResponse.json({ error: '缺少句子' }, { status: 400 });
  }

  const started = Date.now();
  const router = getRouter();

  // 如果提供了 assetId，更新任务状态
  if (assetId) {
    const { getSupabaseServiceClient } = await import('@/utils/supabaseServer');
    const supabase = getSupabaseServiceClient();

    // 更新状态：加载句子中
    await supabase.from('jobs').update({
      stage_status: 'loading_sentences',
    }).eq('id', assetId);

    // 更新状态：生成韵律中
    await supabase.from('jobs').update({
      stage_status: 'generating_notation',
    }).eq('id', assetId);
  }

  const results = await Promise.all(
    sentences.map(async (sentence) => {
      try {
        // 使用新的多提供商路由器
        const result = await router.execute(
          'prosody',
          sentence.text,
          {} // 不指定 provider，使用默认的智谱 GLM
        );

        return { id: sentence.id, notation: result.data as string };
      } catch (error) {
        console.warn('AI 打谱失败，返回 fallback', error);
        return { id: sentence.id, notation: fallbackNotation(sentence.text) };
      }
    })
  );

  return NextResponse.json({
    results,
    durationMs: Date.now() - started,
    provider: '智谱 GLM（默认）', // 提示用户使用的提供商
  });
}
