import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

/**
 * GET /api/pipelines/:pipelineId/jobs
 * Get jobs for a pipeline with optional stage and status filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { pipelineId } = await params;
    const { searchParams } = new URL(request.url);

    // Optional filters
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('created_at', { ascending: true });

    // Apply stage filter (THIS SOLVES THE MAIN PROBLEM)
    if (stage) {
      const validStages = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
      if (!validStages.includes(stage)) {
        return NextResponse.json(
          { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
          { status: 400 }
        );
      }
      query = query.eq('stage', stage);
    }

    // Apply status filter
    if (status) {
      const validStatuses = ['pending', 'queued', 'running', 'completed', 'failed', 'retrying', 'canceled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Unexpected error in GET /api/pipelines/:pipelineId/jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipelines/:pipelineId/jobs
 * Create a new job in the pipeline (for adding additional stages)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  try {
    const supabase = getSupabaseServiceClient();
    const { pipelineId } = await params;
    const body = await request.json();

    const { stage, inputData } = body;

    if (!stage) {
      return NextResponse.json(
        { error: 'stage is required' },
        { status: 400 }
      );
    }

    // Validate stage
    const validStages = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Get pipeline to get asset_id
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('asset_id')
      .eq('id', pipelineId)
      .single();

    if (pipelineError || !pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        pipeline_id: pipelineId,
        asset_id: pipeline.asset_id,
        stage,
        status: 'queued',
        progress: 0,
        retry_count: 0,
        max_retries: 3,
        input_data: inputData || {},
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('Error creating job:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job', details: jobError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/pipelines/:pipelineId/jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
