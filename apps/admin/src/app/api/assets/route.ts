import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('media_assets')
    .select('id, title, description, source_url, cover_url, status, created_at, tag_list')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('获取视频列表失败', error);
    return NextResponse.json({ error: '获取视频列表失败' }, { status: 500 });
  }

  return NextResponse.json({ assets: data ?? [] });
}
