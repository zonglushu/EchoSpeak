import { NextRequest, NextResponse } from 'next/server';
import {
  listContent,
  findContentByYoutubeId,
  updateAccessStats,
  getContentStats,
} from '@/utils/database/contentLibrary';

// GET /api/content - List or search content
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      languageCode: searchParams.get('languageCode') || undefined,
      difficultyLevel: searchParams.get('difficultyLevel') || undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      moderationStatus: (searchParams.get('moderationStatus') || undefined) as any,
      cacheTier: (searchParams.get('cacheTier') || undefined) as any,
      topicTags: searchParams.get('topicTags')?.split(',') || undefined,
      minViewCount: searchParams.get('minViewCount')
        ? parseInt(searchParams.get('minViewCount')!)
        : undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : 0,
    };

    // Fetch from database
    const { data, count } = await listContent(filters);

    return NextResponse.json({
      success: true,
      data: {
        contents: data,
        total: count,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    console.error('Content list error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/content/stats - Get content statistics
export async function GET_STATS(request: NextRequest) {
  try {
    const stats = await getContentStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Content stats error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
