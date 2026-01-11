import { NextRequest, NextResponse } from 'next/server';
import {
  extractYouTubeId,
  fetchYouTubeMetadata,
  fetchYouTubeSubtitles,
  applyBasicAnnotation,
} from '@echospeak/services';
import {
  findContentByYoutubeId,
  createContent,
  updateAccessStats,
  updateContent,
} from '@/utils/database/contentLibrary';
import {
  getOrCreateUserQuota,
  checkUserQuota as checkDbUserQuota,
  consumeQuota as consumeDbQuota,
} from '@/utils/database/userQuota';
import {
  createProcessingTask,
} from '@/utils/database/processingQueue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeUrl, userId = 'default-user', tier = 'basic' } = body;

    // 1. Validate YouTube URL
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // 2. Check user quota
    const quotaCheck = await checkDbUserQuota(userId, tier);

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          quota: quotaCheck,
          message: `Daily limit reached. Resets at ${quotaCheck.resetsAt.toLocaleString()}`,
        },
        { status: 429 }
      );
    }

    // 3. Check if content already exists in cache
    const cachedContent = await findContentByYoutubeId(youtubeId);
    if (cachedContent) {
      // Update access stats
      await updateAccessStats(youtubeId);

      return NextResponse.json({
        success: true,
        status: 'cached',
        data: {
          youtubeId,
          metadata: {
            title: cachedContent.title,
            thumbnailUrl: cachedContent.thumbnail_url,
            duration: cachedContent.duration,
          },
          subtitles: cachedContent.raw_subtitles,
          basicAnnotations: cachedContent.basic_annotations,
          processingCost: 0,
          quotaRemaining: quotaCheck.remaining,
        },
      });
    }

    // 4. Extract YouTube metadata and subtitles
    const [metadata, subtitles] = await Promise.all([
      fetchYouTubeMetadata(youtubeId, process.env.YOUTUBE_API_KEY),
      fetchYouTubeSubtitles(youtubeId, 'en'),
    ]);

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to fetch YouTube metadata' },
        { status: 404 }
      );
    }

    // 5. Create content entry in database
    const newContent = await createContent({
      youtube_id: youtubeId,
      raw_subtitles: subtitles,
      language_code: 'en',
      extracted_at: new Date().toISOString(),
      title: metadata.title,
      thumbnail_url: metadata.thumbnailUrl,
      duration: metadata.duration,
      view_count: 0,
      unique_viewers: 0,
      last_accessed_at: new Date().toISOString(),
      access_count: 0,
      difficulty_level: 'intermediate',
      topic_tags: [],
      is_featured: false,
      moderation_status: 'pending',
      processing_cost_usd: 0,
      cache_tier: 'cold',
    });

    if (!newContent) {
      return NextResponse.json(
        { error: 'Failed to create content entry' },
        { status: 500 }
      );
    }

    // 6. Consume quota
    await consumeDbQuota(userId, tier);

    // 7. Layer 2: Basic annotation (if tier is 'basic' or 'full')
    let basicAnnotations = null;
    let processingStatus: 'ready' | 'processing' = 'ready';

    if (tier === 'basic' || tier === 'full') {
      basicAnnotations = subtitles.map(line => {
        const result = applyBasicAnnotation(line.text);
        return {
          ...line,
          text: result.annotatedLine.text,
        };
      });

      // Update content with basic annotations
      await updateContent(newContent.id, {
        basic_annotations: basicAnnotations,
        basic_processed_at: new Date().toISOString(),
        processing_cost_usd: 0.01,
      });
    }

    // 8. Layer 3: Full prosody (if tier is 'full')
    if (tier === 'full') {
      // Add to processing queue
      await createProcessingTask(youtubeId, userId, 'full', 1);
      processingStatus = 'processing';
    }

    // 9. Return response
    return NextResponse.json({
      success: true,
      status: processingStatus,
      data: {
        contentId: newContent.id,
        youtubeId,
        metadata: {
          title: metadata.title,
          thumbnailUrl: metadata.thumbnailUrl,
          duration: metadata.duration,
        },
        subtitles,
        basicAnnotations,
        processingCost: 0.01,
        quotaRemaining: quotaCheck.remaining - 1,
      },
    });
  } catch (error) {
    console.error('YouTube processing error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
