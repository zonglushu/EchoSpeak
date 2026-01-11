import { NextRequest, NextResponse } from 'next/server';
import { moderateContent, batchModerate } from '@echospeak/services';

// POST /api/moderation/ai - Analyze content with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, strictMode = true } = body;

    // Validate input
    if (!content || (!content.text && !content.title)) {
      return NextResponse.json(
        { error: 'Missing required field: content.text or content.title' },
        { status: 400 }
      );
    }

    // Run AI moderation
    const result = await moderateContent(content, {
      apiKey: process.env.GEMINI_API_KEY,
      strictMode,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI moderation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/moderation/ai/batch - Batch analyze multiple content items
export async function BATCH_POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contents, strictMode = true } = body;

    // Validate input
    if (!Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json(
        { error: 'contents must be a non-empty array' },
        { status: 400 }
      );
    }

    // Run batch moderation
    const results = await batchModerate(contents, {
      apiKey: process.env.GEMINI_API_KEY,
      strictMode,
      onProgress: (progress) => {
        console.log(`Batch moderation progress: ${progress}%`);
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
      },
    });
  } catch (error) {
    console.error('Batch AI moderation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
