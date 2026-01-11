import { NextRequest } from 'next/server';
import { getSupabaseServiceClient } from '@/utils/supabaseServer';

/**
 * GET /api/pipelines/:pipelineId/events
 * Server-Sent Events (SSE) endpoint for real-time pipeline and job updates
 * Uses Supabase Realtime to listen for database changes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pipelineId: string }> }
) {
  const { pipelineId } = await params;

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const supabase = getSupabaseServiceClient();

      // Helper function to send SSE message
      const sendEvent = (event: {
        type: string;
        timestamp: string;
        data: Record<string, unknown>;
      }) => {
        const message = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Send initial connection message
        sendEvent({
          type: 'connected',
          timestamp: new Date().toISOString(),
          data: { pipelineId },
        });

        // Subscribe to pipeline changes
        const pipelineChannel = supabase
          .channel(`pipeline:${pipelineId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pipelines',
              filter: `id=eq.${pipelineId}`,
            },
            (payload) => {
              const pipeline = payload.new as Record<string, unknown>;
              sendEvent({
                type: 'pipeline:update',
                timestamp: new Date().toISOString(),
                data: {
                  pipelineId,
                  status: pipeline.status,
                  currentStage: pipeline.current_stage,
                  progress: pipeline.progress,
                },
              });
            }
          )
          .subscribe();

        // Subscribe to pipeline_stages changes for this pipeline
        const stagesChannel = supabase
          .channel(`pipeline_stages:${pipelineId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'pipeline_stages',
              filter: `pipeline_id=eq.${pipelineId}`,
            },
            (payload) => {
              const stage = payload.new as Record<string, unknown>;
              const oldStage = payload.old as Record<string, unknown>;
              
              // Determine event type based on status change
              let eventType = 'job:update';
              if (stage.status === 'completed') {
                eventType = 'job:completed';
              } else if (stage.status === 'failed') {
                eventType = 'job:failed';
              } else if (stage.status === 'running') {
                eventType = 'job:started';
              } else if (oldStage?.progress !== stage.progress) {
                eventType = 'job:progress';
              }

              sendEvent({
                type: eventType,
                timestamp: new Date().toISOString(),
                data: {
                  pipelineId,
                  jobId: stage.current_execution_id,
                  stage: stage.stage,
                  status: stage.status,
                  progress: stage.progress,
                  metadata: stage.metadata,
                },
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'pipeline_stages',
              filter: `pipeline_id=eq.${pipelineId}`,
            },
            (payload) => {
              const newStage = payload.new as Record<string, unknown>;
              sendEvent({
                type: 'job:created',
                timestamp: new Date().toISOString(),
                data: {
                  pipelineId,
                  jobId: newStage.current_execution_id,
                  stage: newStage.stage,
                  status: newStage.status,
                },
              });
            }
          )
          .subscribe();

        // Subscribe to stage_executions changes to get real-time metadata updates
        const executionsChannel = supabase
          .channel(`stage_executions:${pipelineId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'stage_executions',
            },
            async (payload) => {
              const execution = payload.new as Record<string, unknown>;
              
              // Check if this execution belongs to our pipeline
              // We need to query stage_executions to get the stage, then check the pipeline_id
              const { data: stageData } = await supabase
                .from('pipeline_stages')
                .select('stage, pipeline_id')
                .eq('current_execution_id', execution.id)
                .single();
              
              if (stageData?.pipeline_id === pipelineId) {
                sendEvent({
                  type: 'job:progress',
                  timestamp: new Date().toISOString(),
                  data: {
                    pipelineId,
                    jobId: execution.id,
                    stage: stageData.stage,
                    status: execution.status,
                    progress: execution.progress,
                    metadata: execution.metadata,
                    started_at: execution.started_at,
                    completed_at: execution.completed_at,
                    failed_at: execution.failed_at,
                  },
                });
              }
            }
          )
          .subscribe();

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          pipelineChannel.unsubscribe();
          stagesChannel.unsubscribe();
          executionsChannel.unsubscribe();
          controller.close();
        });

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            sendEvent({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
              data: { pipelineId },
            });
          } catch {
            // Client disconnected, clear interval
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Cleanup on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
        });
      } catch (error) {
        console.error('Error in SSE stream:', error);
        sendEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          data: {
            pipelineId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
