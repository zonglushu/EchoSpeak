import { createClient } from '@/lib/supabase/server';

/**
 * 获取用户配额数据
 */
export async function getUserQuota(userId: string = 'default-user') {
  const supabase = await createClient();

  try {
    // 从 user_quotas 表获取配额数据
    const { data, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // 如果没有数据，返回默认配额
      return {
        userId,
        tier: 'free',
        limits: {
          basic: 100,
          full: 10,
        },
        usage: {
          basicUsed: 0,
          fullUsed: 0,
          totalBasicUsed: 0,
          totalFullUsed: 0,
        },
        remaining: {
          basic: 100,
          full: 10,
        },
        usagePercentage: {
          basic: 0,
          full: 0,
        },
        resetsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        timeUntilReset: '30天',
        canRequest: {
          basic: true,
          full: true,
        },
      };
    }

    // 计算剩余配额和使用百分比
    const remainingBasic = Math.max(0, data.basic_limit - data.basic_used);
    const remainingFull = Math.max(0, data.full_limit - data.full_used);

    return {
      userId: data.user_id,
      tier: data.tier,
      limits: {
        basic: data.basic_limit,
        full: data.full_limit,
      },
      usage: {
        basicUsed: data.basic_used,
        fullUsed: data.full_used,
        totalBasicUsed: data.total_basic_used || 0,
        totalFullUsed: data.total_full_used || 0,
      },
      remaining: {
        basic: remainingBasic,
        full: remainingFull,
      },
      usagePercentage: {
        basic: data.basic_limit > 0 ? (data.basic_used / data.basic_limit) * 100 : 0,
        full: data.full_limit > 0 ? (data.full_used / data.full_limit) * 100 : 0,
      },
      resetsAt: data.resets_at,
      timeUntilReset: calculateTimeUntilReset(data.resets_at),
      canRequest: {
        basic: remainingBasic > 0,
        full: remainingFull > 0,
      },
    };
  } catch (error) {
    console.error('Error fetching user quota:', error);
    return null;
  }
}

/**
 * 获取所有用户配额概览
 */
export async function getAllQuotasOverview() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('user_quotas')
      .select('*')
      .order('total_basic_used', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching quotas overview:', error);
    return [];
  }
}

function calculateTimeUntilReset(resetsAt: string): string {
  const now = Date.now();
  const reset = new Date(resetsAt).getTime();
  const diff = reset - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}天${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时`;
  } else {
    return '即将重置';
  }
}
