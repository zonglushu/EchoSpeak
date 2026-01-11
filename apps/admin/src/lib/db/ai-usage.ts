import { createClient } from '@supabase/supabase-js';
import type { UsageLog } from '../ai/providers/base';

// 获取 Supabase 客户端
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found, usage logging disabled');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
};

/**
 * 记录 AI 使用日志
 */
export async function logAIUsage(log: UsageLog): Promise<void> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn('Supabase client not available, skipping usage log');
    return;
  }

  try {
    await supabase.from('ai_usage_logs').insert({
      provider: log.provider,
      task: log.task,
      model: log.model,
      latency: log.latency,
      tokens: log.tokens,
      status: log.status,
      error: log.error,
      cost: log.cost,
      timestamp: log.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 获取 AI 使用统计
 */
export async function getAIUsageSummary(options?: {
  provider?: string;
  task?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<Array<{
  provider: string;
  task: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_latency: number;
  total_tokens: number;
  total_cost: number;
}>> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  let query = supabase
    .from('ai_usage_logs')
    .select('provider, task, status, latency, tokens, cost, created_at');

  if (options?.provider) {
    query = query.eq('provider', options.provider);
  }

  if (options?.task) {
    query = query.eq('task', options.task);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // 手动聚合数据
  const summary = new Map<string, any>();

  for (const row of data || []) {
    const key = `${row.provider}-${row.task}`;

    if (!summary.has(key)) {
      summary.set(key, {
        provider: row.provider,
        task: row.task,
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        total_latency: 0,
        total_tokens: 0,
        total_cost: 0,
      });
    }

    const item = summary.get(key);
    item.total_requests += 1;

    if (row.status === 'success') {
      item.successful_requests += 1;
    } else {
      item.failed_requests += 1;
    }

    item.total_latency += row.latency;
    item.total_tokens += row.tokens || 0;
    item.total_cost += row.cost || 0;
  }

  // 计算平均值
  return Array.from(summary.values()).map((item) => ({
    ...item,
    avg_latency: item.total_requests > 0 ? item.total_latency / item.total_requests : 0,
    total_cost: Number(item.total_cost.toFixed(6)),
  }));
}

/**
 * 获取最近的错误日志
 */
export async function getRecentErrors(limit: number = 10): Promise<
  Array<{
    id: string;
    provider: string;
    task: string;
    error: string;
    created_at: string;
  }>
> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('id, provider, task, error, created_at')
    .eq('status', 'error')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}
