/**
 * Processing Queue Database Operations
 *
 * Handles all database operations for the processing_queue table.
 */

import { getSupabaseServiceClient } from '../supabaseServer';

export interface ProcessingQueueRow {
  id: string;
  youtube_id: string;
  requested_by: string;
  tier: 'basic' | 'full';
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion_at?: string;
}

/**
 * Create processing task
 */
export async function createProcessingTask(
  youtubeId: string,
  requestedBy: string,
  tier: 'basic' | 'full',
  priority: number = 1
): Promise<ProcessingQueueRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('processing_queue')
    .insert({
      youtube_id: youtubeId,
      requested_by: requestedBy,
      tier,
      priority,
      status: 'pending',
      progress: 0,
      retry_count: 0,
      max_retries: 3,
      estimated_completion_at: estimateCompletionTime(tier),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating processing task:', error);
    return null;
  }

  return data;
}

/**
 * Get next pending task (with highest priority)
 */
export async function getNextPendingTask(): Promise<ProcessingQueueRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.error('Error getting next pending task:', error);
    return null;
  }

  return data;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'processing' | 'completed' | 'failed',
  updates?: Partial<Pick<ProcessingQueueRow, 'progress' | 'error_message' | 'completed_at'>>
): Promise<ProcessingQueueRow | null> {
  const supabase = getSupabaseServiceClient();

  const updateData: any = {
    status,
  };

  if (status === 'processing' && !updates) {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = updates?.completed_at || new Date().toISOString();
  }

  if (updates?.progress !== undefined) {
    updateData.progress = updates.progress;
  }

  if (updates?.error_message !== undefined) {
    updateData.error_message = updates.error_message;
  }

  const { data, error } = await supabase
    .from('processing_queue')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task status:', error);
    return null;
  }

  return data;
}

/**
 * Increment task progress
 */
export async function updateTaskProgress(taskId: string, progress: number): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from('processing_queue')
    .update({ progress })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task progress:', error);
  }
}

/**
 * Mark task as failed and increment retry count
 */
export async function markTaskFailed(taskId: string, errorMessage: string): Promise<ProcessingQueueRow | null> {
  const supabase = getSupabaseServiceClient();

  // First update status and error_message
  const { data: updateData, error: updateError } = await supabase
    .from('processing_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('Error marking task failed:', updateError);
    return null;
  }

  // Then increment retry count using RPC function
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('increment_retry_count', { p_task_id: taskId });

  if (rpcError) {
    console.error('Error incrementing retry count:', rpcError);
    // Return updateData even if RPC fails
    return updateData;
  }

  return rpcData;
}

/**
 * Get task by ID
 */
export async function getTask(taskId: string): Promise<ProcessingQueueRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error getting task:', error);
    return null;
  }

  return data;
}

/**
 * Get tasks by YouTube ID
 */
export async function getTasksByYoutubeId(youtubeId: string): Promise<ProcessingQueueRow[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('youtube_id', youtubeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting tasks by YouTube ID:', error);
    return [];
  }

  return data || [];
}

/**
 * Get tasks by user
 */
export async function getTasksByUser(userId: string, limit: number = 20): Promise<ProcessingQueueRow[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('processing_queue')
    .select('*')
    .eq('requested_by', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting tasks by user:', error);
    return [];
  }

  return data || [];
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('processing_queue')
    .select('status');

  if (error || !data) {
    console.error('Error getting queue stats:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
  }

  return {
    total: data.length,
    pending: data.filter(row => row.status === 'pending').length,
    processing: data.filter(row => row.status === 'processing').length,
    completed: data.filter(row => row.status === 'completed').length,
    failed: data.filter(row => row.status === 'failed').length,
  };
}

/**
 * Estimate completion time
 */
function estimateCompletionTime(tier: 'basic' | 'full'): string {
  const now = new Date();
  const avgProcessingTime = tier === 'basic' ? 60000 : 300000; // 1min or 5min
  return new Date(now.getTime() + avgProcessingTime).toISOString();
}
