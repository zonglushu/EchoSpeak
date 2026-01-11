import { createClient } from '@/lib/supabase/server';

/**
 * 获取上传任务列表
 */
export async function getUploadJobs(limit: number = 50) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('upload_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching upload jobs:', error);
    return [];
  }
}

/**
 * 获取单个上传任务详情
 */
export async function getUploadJob(jobId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('upload_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching upload job:', error);
    return null;
  }
}

/**
 * 获取媒体资产列表
 */
export async function getMediaAssets(limit: number = 20) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching media assets:', error);
    return [];
  }
}
