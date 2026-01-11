import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

const COVER_BUCKET = process.env.SUPABASE_COVER_BUCKET ?? 'media-covers';

/**
 * POST /api/assets/[id]/thumbnail
 * 上传视频缩略图并更新 media_assets 的 cover_url
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServiceClient();

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('thumbnail') as File;

    if (!file) {
      return NextResponse.json(
        { error: '缺少缩略图文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '文件必须是图片格式' },
        { status: 400 }
      );
    }

    // 上传到 Supabase Storage (专用的封面 bucket)
    const filename = `${id}/thumbnail.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(filename, file, {
        contentType: 'image/jpeg',
        upsert: true, // 覆盖已存在的文件
      });

    if (uploadError) {
      console.error('上传缩略图到 Storage 失败:', uploadError);
      return NextResponse.json(
        { error: '上传缩略图失败', details: uploadError.message },
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: publicUrlData } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(filename);

    const thumbnailUrl = publicUrlData.publicUrl;

    // 更新 media_assets 表的 cover_url
    const { error: updateError } = await supabase
      .from('media_assets')
      .update({ cover_url: thumbnailUrl })
      .eq('id', id);

    if (updateError) {
      console.error('更新 media_assets 的 cover_url 失败:', updateError);
      return NextResponse.json(
        { error: '更新资源记录失败', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thumbnailUrl,
      assetId: id,
    });
  } catch (error) {
    console.error('处理缩略图上传时出错:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
