import { NextRequest, NextResponse } from 'next/server';
import {
  updateContent,
  listContent,
} from '@/utils/database/contentLibrary';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, action, moderatorId, notes } = body;

    // Validate inputs
    if (!contentId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'feature', 'unfeature'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, reject, feature, or unfeature' },
        { status: 400 }
      );
    }

    // Determine updates based on action
    let updates: any = {
      moderated_by: moderatorId || 'admin-1',
      moderated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'approve':
        updates.moderation_status = 'approved';
        updates.moderation_notes = notes;
        break;

      case 'reject':
        updates.moderation_status = 'rejected';
        updates.moderation_notes = notes;
        break;

      case 'feature':
        updates.is_featured = true;
        break;

      case 'unfeature':
        updates.is_featured = false;
        break;
    }

    // Update content
    const updatedContent = await updateContent(contentId, updates);

    if (!updatedContent) {
      return NextResponse.json(
        { error: 'Content not found or update failed' },
        { status: 404 }
      );
    }

    // Log moderation action
    const supabase = getSupabaseServiceClient();
    await supabase.from('moderation_logs').insert({
      content_id: contentId,
      moderator_type: 'human',
      moderator_id: moderatorId || 'admin-1',
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged',
      notes: notes || `${action} action performed`,
    });

    return NextResponse.json({
      success: true,
      message: `Content ${action}d successfully`,
      data: {
        contentId,
        action,
        moderatedBy: moderatorId || 'admin-1',
        moderatedAt: updates.moderated_at,
      },
    });
  } catch (error) {
    console.error('Moderation review error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/moderation/review - Get pending content for review
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch pending content from database
    const { data, count } = await listContent({
      moderationStatus: 'pending',
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: {
        contents: data,
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Pending content error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
