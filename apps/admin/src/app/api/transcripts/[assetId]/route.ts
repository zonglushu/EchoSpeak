import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

type TranscriptRow = {
  id: string;
  sequence: number;
  start_time_ms: number;
  end_time_ms: number;
  text_en: string | null;
  text_cn: string | null;
  translations: Record<string, string> | null;
  notation: Record<string, unknown> | null;
  lock_state: string;
  status: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  const supabase = getSupabaseServiceClient();

  // 先判断传入的是 job_id 还是 asset_id
  let actualAssetId = assetId;
  const { data: job } = await supabase
    .from('jobs')
    .select('asset_id')
    .eq('id', assetId)
    .single();

  if (job?.asset_id) {
    // 传入的是 job_id，使用 job 中的 asset_id
    actualAssetId = job.asset_id;
  }

  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('asset_id', actualAssetId)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('获取字幕失败', error);
    return NextResponse.json({ error: '获取字幕失败' }, { status: 500 });
  }

  const transcripts = (data as TranscriptRow[] ?? []).map((row) => {
    // 优先使用 translations.zh，其次 text_cn，最后空字符串
    const translationText = row.translations?.zh || row.text_cn || '';
    
    return {
      id: row.id,
      startTime: row.start_time_ms,
      endTime: row.end_time_ms,
      text: row.text_en ?? '',
      translation: translationText,
      lockState: row.lock_state === 'locked' ? 'locked' : 'unlocked',
      status: row.status === 'ready' ? 'ready' : row.status === 'ai_generating' ? 'ai_generating' : row.status === 'error' ? 'error' : 'pending',
      notation: row.notation,
    };
  });

  return NextResponse.json({ transcripts });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;

  const supabase = getSupabaseServiceClient();

  // 先判断传入的是 job_id 还是 asset_id
  let actualAssetId = assetId;
  const { data: job } = await supabase
    .from('jobs')
    .select('asset_id')
    .eq('id', assetId)
    .single();

  if (job?.asset_id) {
    // 传入的是 job_id，使用 job 中的 asset_id
    actualAssetId = job.asset_id;
  }

  // 删除该视频的所有字幕
  const { error } = await supabase
    .from('transcripts')
    .delete()
    .eq('asset_id', actualAssetId);

  if (error) {
    console.error('删除字幕失败', error);
    return NextResponse.json({ error: '删除字幕失败' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: '字幕已清空',
    assetId: actualAssetId 
  });
}
