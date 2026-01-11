import { createClient } from '@/lib/supabase/server';

/**
 * 获取内容审核统计数据
 * Revalidate: 每1分钟刷新一次
 */
export async function getModerationStats() {
  const supabase = await createClient();

  try {
    // 获取所有内容
    const { data: allContent, error } = await supabase
      .from('content_library')
      .select('moderation_status, created_at, moderated_at');

    if (error) throw error;

    // 统计数据
    const stats = {
      total: allContent?.length || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      pendingToday: 0,
      avgProcessingTime: 0,
    };

    if (!allContent || allContent.length === 0) {
      return stats;
    }

    // 计算各状态数量
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processingTimes: number[] = [];

    for (const content of allContent) {
      // 状态统计
      if (content.moderation_status === 'pending') {
        stats.pending++;
        // 今日新增
        const createdAt = new Date(content.created_at);
        if (createdAt >= today) {
          stats.pendingToday++;
        }
      } else if (content.moderation_status === 'approved') {
        stats.approved++;
        // 计算处理时间
        if (content.moderated_at) {
          const diff = new Date(content.moderated_at).getTime() - new Date(content.created_at).getTime();
          processingTimes.push(diff / (1000 * 60)); // 转换为分钟
        }
      } else if (content.moderation_status === 'rejected') {
        stats.rejected++;
        // 计算处理时间
        if (content.moderated_at) {
          const diff = new Date(content.moderated_at).getTime() - new Date(content.created_at).getTime();
          processingTimes.push(diff / (1000 * 60)); // 转换为分钟
        }
      }
    }

    // 计算平均处理时间
    if (processingTimes.length > 0) {
      stats.avgProcessingTime =
        processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    // 返回默认值
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      pendingToday: 0,
      avgProcessingTime: 0,
    };
  }
}

/**
 * 获取内容列表
 * Revalidate: 每30秒刷新一次
 */
export async function getContentList(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('content_library')
      .select('*')
      .order('created_at', { ascending: false });

    // 应用筛选
    if (filter !== 'all') {
      query = query.eq('moderation_status', filter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching content list:', error);
    return [];
  }
}

/**
 * 获取单条内容的详细信息
 * Revalidate: 不缓存，实时获取
 */
export async function getContentDetail(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching content detail:', error);
    return null;
  }
}
