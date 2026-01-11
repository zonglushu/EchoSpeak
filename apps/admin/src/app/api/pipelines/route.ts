import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

interface Job {
  id: string;
  stage: string;
  status: string;
  progress: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * GET /api/pipelines
 * Query pipelines with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const assetId = searchParams.get('assetId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';

    let query = supabase
      .from('pipelines')
      .select(`
        *,
        asset:media_assets(id, title, status),
        jobs(id, stage, status, progress, created_at, started_at, completed_at)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Apply filters
    if (assetId) {
      query = query.eq('asset_id', assetId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: pipelines, error } = await query;

    if (error) {
      console.error('Error fetching pipelines:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pipelines', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ pipelines });
  } catch (error) {
    console.error('Unexpected error in GET /api/pipelines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pipelines
 * Create a new pipeline with jobs for a media asset
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();
    const body = await request.json();

    const { assetId, stages, options } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId is required' },
        { status: 400 }
      );
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { error: 'stages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate stages
    const validStages = ['upload', 'transcribe', 'translate', 'notation', 'publish'];
    const invalidStages = stages.filter((s: string) => !validStages.includes(s));
    if (invalidStages.length > 0) {
      return NextResponse.json(
        { error: `Invalid stages: ${invalidStages.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if asset exists
    const { data: asset, error: assetError } = await supabase
      .from('media_assets')
      .select('id, title')
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Check if pipeline already exists for this asset
    const { data: existingPipeline } = await supabase
      .from('pipelines')
      .select('id, status')
      .eq('asset_id', assetId)
      .single();

    if (existingPipeline) {
      return NextResponse.json(
        { 
          error: 'Pipeline already exists for this asset',
          pipeline: existingPipeline 
        },
        { status: 409 }
      );
    }

    // Create pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .insert({
        asset_id: assetId,
        status: 'created',
        current_stage: null,
        progress: 0,
        metadata: options || {},
      })
      .select()
      .single();

    if (pipelineError || !pipeline) {
      console.error('Error creating pipeline:', pipelineError);
      return NextResponse.json(
        { error: 'Failed to create pipeline', details: pipelineError?.message },
        { status: 500 }
      );
    }

    // Create jobs for each stage
    const jobsToCreate = stages.map((stage: string, index: number) => ({
      pipeline_id: pipeline.id,
      asset_id: assetId,
      stage,
      status: index === 0 ? 'queued' : 'pending', // First job is queued, others are pending
      progress: 0,
      retry_count: 0,
      max_retries: 3,
      input_data: options || {},
    }));

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .insert(jobsToCreate)
      .select();

    if (jobsError || !jobs) {
      console.error('Error creating jobs:', jobsError);
      // Rollback: delete pipeline
      await supabase.from('pipelines').delete().eq('id', pipeline.id);
      return NextResponse.json(
        { error: 'Failed to create jobs', details: jobsError?.message },
        { status: 500 }
      );
    }

    // Update pipeline to running status and set current stage
    const { error: updateError } = await supabase
      .from('pipelines')
      .update({
        status: 'running',
        current_stage: stages[0],
        started_at: new Date().toISOString(),
      })
      .eq('id', pipeline.id);

    if (updateError) {
      console.error('Error updating pipeline status:', updateError);
    }

    return NextResponse.json(
      {
        pipeline: {
          ...pipeline,
          status: 'running',
          current_stage: stages[0],
        },
        jobs: jobs.map((job: Job) => ({
          id: job.id,
          stage: job.stage,
          status: job.status,
          progress: job.progress,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/pipelines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
