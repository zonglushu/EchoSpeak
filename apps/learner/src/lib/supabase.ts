import { createClient } from '@supabase/supabase-js';

// 从环境变量读取配置
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * 配额信息类型
 */
export interface QuotaInfo {
  tier: string;
  daily_basic_limit: number;
  daily_full_limit: number;
  basic_used_today: number;
  full_used_today: number;
  total_basic_used: number;
  total_full_used: number;
  basic_remaining: number;
  full_remaining: number;
  resets_at: string;
}

/**
 * 获取当前用户配额信息
 */
export async function getUserQuota(): Promise<QuotaInfo | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: quota, error } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !quota) {
      // 返回默认 free 配额
      return {
        tier: 'free',
        daily_basic_limit: 3,
        daily_full_limit: 1,
        basic_used_today: 0,
        full_used_today: 0,
        total_basic_used: 0,
        total_full_used: 0,
        basic_remaining: 3,
        full_remaining: 1,
        resets_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const basic_remaining = quota.tier === 'premium'
      ? -1
      : quota.daily_basic_limit - quota.basic_used_today;

    const full_remaining = quota.tier === 'premium'
      ? -1
      : quota.daily_full_limit - quota.full_used_today;

    return {
      tier: quota.tier,
      daily_basic_limit: quota.daily_basic_limit,
      daily_full_limit: quota.daily_full_limit,
      basic_used_today: quota.basic_used_today,
      full_used_today: quota.full_used_today,
      total_basic_used: quota.total_basic_used,
      total_full_used: quota.total_full_used,
      basic_remaining,
      full_remaining,
      resets_at: quota.resets_at,
    };
  } catch (error) {
    console.error('Failed to fetch quota:', error);
    return null;
  }
}

/**
 * 检查用户是否有足够配额
 */
export async function checkUserQuota(tier: 'basic' | 'full'): Promise<{ allowed: boolean; remaining?: number; reason?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, reason: 'not_authenticated' };
    }

    const { data, error } = await supabase.rpc('check_user_quota', {
      p_user_id: user.id,
      p_tier: tier,
    });

    if (error || !data) {
      return { allowed: false, reason: 'check_failed' };
    }

    if (!data.allowed) {
      return { allowed: false, reason: data.reason, remaining: 0 };
    }

    return { allowed: true, remaining: data.remaining };
  } catch (error) {
    console.error('Failed to check quota:', error);
    return { allowed: false, reason: 'check_failed' };
  }
}

/**
 * 扣减用户配额
 */
export async function consumeQuota(tier: 'basic' | 'full'): Promise<{ success: boolean; basic_remaining?: number; full_remaining?: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false };
    }

    const { data, error } = await supabase.rpc('consume_quota', {
      p_user_id: user.id,
      p_tier: tier,
    });

    if (error || !data?.success) {
      return { success: false };
    }

    return { success: true, basic_remaining: data.basic_remaining, full_remaining: data.full_remaining };
  } catch (error) {
    console.error('Failed to consume quota:', error);
    return { success: false };
  }
}
