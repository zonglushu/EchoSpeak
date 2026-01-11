import { createClient } from '@/lib/supabase/server';

/**
 * 获取每日成本统计数据
 */
export async function getDailyCostStats() {
  const supabase = await createClient();

  try {
    // 从 ai_usage 表获取今日统计数据
    const today = new Date().toISOString().split('T')[0];

    const { data: todayData, error } = await supabase
      .from('ai_usage')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    if (error) throw error;

    // 计算统计数据
    const stats = {
      date: today,
      totalCalls: todayData?.length || 0,
      totalTokens: todayData?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0,
      totalCostUsd: todayData?.reduce((sum, item) => sum + (item.cost_usd || 0), 0) || 0,
      basicCalls: todayData?.filter(item => item.service === 'basic').length || 0,
      fullCalls: todayData?.filter(item => item.service === 'full').length || 0,
      rulesBasedCalls: todayData?.filter(item => item.service === 'rules').length || 0,
      uniqueUsers: new Set(todayData?.map(item => item.user_id) || []).size,
      avgCostPerUser: 0,
      cacheHitRate: 0.72, // 这个需要从缓存表计算
      moneySavedByCache: 0,
    };

    // 计算平均每用户成本
    if (stats.uniqueUsers > 0) {
      stats.avgCostPerUser = stats.totalCostUsd / stats.uniqueUsers;
    }

    // 计算缓存节省的金额（假设）
    const cacheHits = todayData?.filter(item => item.cached === true).length || 0;
    const cacheMisses = stats.totalCalls - cacheHits;
    stats.cacheHitRate = stats.totalCalls > 0 ? cacheHits / stats.totalCalls : 0;
    stats.moneySavedByCache = cacheHits * 0.05; // 假设每次缓存节省 $0.05

    return stats;
  } catch (error) {
    console.error('Error fetching daily cost stats:', error);
    // 返回默认值
    return {
      date: new Date().toISOString().split('T')[0],
      totalCalls: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      basicCalls: 0,
      fullCalls: 0,
      rulesBasedCalls: 0,
      uniqueUsers: 0,
      avgCostPerUser: 0,
      cacheHitRate: 0,
      moneySavedByCache: 0,
    };
  }
}

/**
 * 获取过去 7 天的成本趋势
 */
export async function getCostTrend() {
  const supabase = await createClient();

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('ai_usage')
      .select('created_at, cost_usd')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 按日期分组统计
    const dailyStats: Record<string, number> = {};
    (data || []).forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dailyStats[date] = (dailyStats[date] || 0) + (item.cost_usd || 0);
    });

    // 转换为数组格式
    return Object.entries(dailyStats).map(([date, cost]) => ({ date, cost }));
  } catch (error) {
    console.error('Error fetching cost trend:', error);
    return [];
  }
}

/**
 * 获取用户成本排行榜
 */
export async function getUserCostLeaderboard() {
  const supabase = await createClient();

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('ai_usage')
      .select('user_id, cost_usd')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    // 按用户统计总成本
    const userCosts: Record<string, number> = {};
    (data || []).forEach(item => {
      const userId = item.user_id || 'unknown';
      userCosts[userId] = (userCosts[userId] || 0) + (item.cost_usd || 0);
    });

    // 排序并取前 10 名
    return Object.entries(userCosts)
      .map(([userId, totalCost]) => ({ userId, totalCost }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);
  } catch (error) {
    console.error('Error fetching user leaderboard:', error);
    return [];
  }
}
