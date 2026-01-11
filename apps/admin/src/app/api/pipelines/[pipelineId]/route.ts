import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

/**
 * GET /api/pipelines/:pipelineId
 * Get pipeline details with current stages (使用新的 pipeline_stages 表)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { pipelineId } = await params;

    // Fetch pipeline basic info
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select(`
        *,
        asset:media_assets(id, title, status, cover_url)
      `)
      .eq('id', pipelineId)
      .single();

    if (pipelineError) {
      console.error('Error fetching pipeline:', pipelineError);
      return NextResponse.json(
        { error: 'Pipeline not found', details: pipelineError.message },
        { status: 404 }
      );
    }

    // Fetch current stages using the new pipeline_stages table
    const { data: stages, error: stagesError } = await supabase
      .rpc('get_pipeline_current_stages', { p_pipeline_id: pipelineId });

    if (stagesError) {
      console.error('Error fetching pipeline stages:', stagesError);
      // Return pipeline without stages rather than failing
      return NextResponse.json({ 
        pipeline: { ...pipeline, jobs: [] } 
      });
    }

    // Transform stages to jobs format for backward compatibility
    const jobs = stages?.map((stage: {
      stage: string;
      status: string;
      progress: number;
      current_execution_id: string | null;
      created_at: string;
      source_language?: string | null;
      target_language?: string | null;
      metadata?: Record<string, unknown>;
    }) => ({
      id: stage.current_execution_id,
      stage: stage.stage,
      status: stage.status,
      progress: stage.progress,
      created_at: stage.created_at,
      source_language: stage.source_language,
      target_language: stage.target_language,
      metadata: stage.metadata,
      // Placeholder for time fields - will be fetched separately
      started_at: null,
      completed_at: null,
      failed_at: null,
    })) || [];

    // Fetch execution details for jobs that have execution IDs
    if (jobs.length > 0) {
      const executionIds = jobs
        .map((job: { id: string | null }) => job.id)
        .filter((id: string | null): id is string => id !== null);
      
      if (executionIds.length > 0) {
        const { data: executions, error: executionsError } = await supabase
          .from('stage_executions')
          .select('id, started_at, completed_at, failed_at')
          .in('id', executionIds);

        if (!executionsError && executions) {
          // Map execution time data to jobs
          jobs.forEach((job: { id: string | null; started_at: string | null; completed_at: string | null; failed_at: string | null }) => {
            const execution = executions.find(e => e.id === job.id);
            if (execution) {
              job.started_at = execution.started_at;
              job.completed_at = execution.completed_at;
              job.failed_at = execution.failed_at;
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      pipeline: { ...pipeline, jobs } 
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/pipelines/:pipelineId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pipelines/:pipelineId
 * Update pipeline status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { pipelineId } = await params;
    const body = await request.json();

    const { status, currentStage, progress } = body;

    // Validate status
    const validStatuses = ['created', 'running', 'completed', 'failed', 'canceled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, string | number | null> = {};
    if (status) updateData.status = status;
    if (currentStage !== undefined) updateData.current_stage = currentStage;
    if (progress !== undefined) updateData.progress = progress;

    // Add timestamps based on status
    if (status === 'running' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'failed' && !updateData.failed_at) {
      updateData.failed_at = new Date().toISOString();
    }

    const { data: pipeline, error } = await supabase
      .from('pipelines')
      .update(updateData)
      .eq('id', pipelineId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pipeline:', error);
      return NextResponse.json(
        { error: 'Failed to update pipeline', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pipeline });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/pipelines/:pipelineId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pipelines/:pipelineId
 * Cancel and delete pipeline
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { pipelineId } = await params;

    // Cancel all running jobs first
    await supabase
      .from('jobs')
      .update({ status: 'canceled' })
      .eq('pipeline_id', pipelineId)
      .in('status', ['queued', 'running', 'pending']);

    // Update pipeline status to canceled
    const { error } = await supabase
      .from('pipelines')
      .update({ status: 'canceled' })
      .eq('id', pipelineId);

    if (error) {
      console.error('Error canceling pipeline:', error);
      return NextResponse.json(
        { error: 'Failed to cancel pipeline', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/pipelines/:pipelineId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
