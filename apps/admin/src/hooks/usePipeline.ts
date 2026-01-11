import { useEffect, useState, useCallback } from 'react';

export interface Pipeline {
  id: string;
  asset_id: string;
  status: 'created' | 'running' | 'completed' | 'failed' | 'canceled';
  current_stage: 'upload' | 'transcribe' | 'translate' | 'notation' | 'publish' | null;
  progress: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface Job {
  id: string;
  pipeline_id: string;
  asset_id: string;
  stage: 'upload' | 'transcribe' | 'translate' | 'notation' | 'publish';
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'canceled';
  progress: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  metadata?: {
    current_step?: string;
    step_label?: string;
    steps_completed?: number;
    total_steps?: number;
    subtitle_count?: number;
    translated_count?: number;
    steps?: Array<{
      id: string;
      label: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
    }>;
    [key: string]: unknown;
  };
}

export interface PipelineEvent {
  type: 'connected' | 'pipeline:update' | 'job:update' | 'job:progress' | 'job:completed' | 'job:failed' | 'job:started' | 'job:created' | 'heartbeat' | 'error';
  timestamp: string;
  data: {
    pipelineId?: string;
    jobId?: string;
    stage?: string;
    status?: string;
    currentStage?: string;
    progress?: number;
    error?: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    started_at?: string | null;
    completed_at?: string | null;
    failed_at?: string | null;
  };
}

/**
 * Hook to manage real-time pipeline updates via SSE
 */
export function usePipelineEvents(pipelineId: string | null | undefined) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial pipeline data
  const fetchPipeline = useCallback(async () => {
    if (!pipelineId) return;

    try {
      const response = await fetch(`/api/pipelines/${pipelineId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline');
      }
      const data = await response.json();
      setPipeline(data.pipeline);
      setJobs(data.pipeline.jobs || []);
    } catch (err) {
      console.error('Error fetching pipeline:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [pipelineId]);

  useEffect(() => {
    if (!pipelineId) return;

    // Fetch initial data
    fetchPipeline();

    // Connect to SSE
    const eventSource = new EventSource(`/api/pipelines/${pipelineId}/events`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      setError('Connection error');
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      try {
        const message: PipelineEvent = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            setIsConnected(true);
            break;

          case 'pipeline:update':
            setPipeline((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                status: message.data.status as Pipeline['status'] || prev.status,
                current_stage: message.data.currentStage as Pipeline['current_stage'] || prev.current_stage,
                progress: message.data.progress ?? prev.progress,
              };
            });
            break;

          case 'job:created':
          case 'job:update':
          case 'job:progress':
          case 'job:completed':
          case 'job:failed':
          case 'job:started':
            setJobs((prevJobs) => {
              const jobId = message.data.jobId;
              if (!jobId) return prevJobs;

              const existingIndex = prevJobs.findIndex((j) => j.id === jobId);
              
              if (existingIndex >= 0) {
                // Update existing job
                const updatedJobs = [...prevJobs];
                const existingJob = updatedJobs[existingIndex];
                updatedJobs[existingIndex] = {
                  ...existingJob,
                  status: message.data.status as Job['status'] || existingJob.status,
                  progress: message.data.progress ?? existingJob.progress,
                  error_message: message.data.errorMessage || existingJob.error_message,
                  // 更新时间字段
                  started_at: message.data.started_at !== undefined ? message.data.started_at : existingJob.started_at,
                  completed_at: message.data.completed_at !== undefined ? message.data.completed_at : existingJob.completed_at,
                  failed_at: message.data.failed_at !== undefined ? message.data.failed_at : existingJob.failed_at,
                  // 更新 metadata，保留旧的 metadata 并合并新的
                  metadata: message.data.metadata 
                    ? { ...existingJob.metadata, ...(message.data.metadata as Record<string, unknown>) }
                    : existingJob.metadata,
                };
                return updatedJobs;
              } else if (message.type === 'job:created') {
                // Add new job
                return [
                  ...prevJobs,
                  {
                    id: jobId,
                    pipeline_id: pipelineId,
                    asset_id: '',
                    stage: message.data.stage as Job['stage'],
                    status: message.data.status as Job['status'],
                    progress: message.data.progress || 0,
                    created_at: message.timestamp,
                    started_at: null,
                    completed_at: null,
                    failed_at: null,
                    error_message: null,
                    metadata: message.data.metadata as Job['metadata'],
                  },
                ];
              }
              return prevJobs;
            });
            break;

          case 'heartbeat':
            // Keep connection alive
            break;

          case 'error':
            setError(message.data.error || 'Unknown error');
            break;
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [pipelineId, fetchPipeline]);

  return {
    pipeline,
    jobs,
    isConnected,
    error,
    refetch: fetchPipeline,
  };
}

/**
 * Hook to fetch jobs for a pipeline with optional filters
 */
export function usePipelineJobs(
  pipelineId: string | null | undefined,
  filters?: { stage?: string; status?: string }
) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!pipelineId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.stage) params.append('stage', filters.stage);
      if (filters?.status) params.append('status', filters.status);

      const url = `/api/pipelines/${pipelineId}/jobs?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [pipelineId, filters?.stage, filters?.status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  };
}
