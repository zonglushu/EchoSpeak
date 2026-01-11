/**
 * User Quota Database Operations
 *
 * Handles all database operations for the user_quotas table.
 */

import { getSupabaseServiceClient } from '../supabaseServer';

export interface UserQuotaRow {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'premium';
  daily_basic_limit: number;
  daily_full_limit: number;
  resets_at: string;
  basic_used_today: number;
  full_used_today: number;
  total_basic_used: number;
  total_full_used: number;
  created_at: string;
  updated_at: string;
}

/**
 * Find user quota by user ID
 */
export async function findUserQuota(userId: string): Promise<UserQuotaRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found, return null
      return null;
    }
    console.error('Error finding user quota:', error);
    return null;
  }

  return data;
}

/**
 * Create or get user quota
 */
export async function getOrCreateUserQuota(
  userId: string,
  tier: 'free' | 'pro' | 'premium' = 'free'
): Promise<UserQuotaRow> {
  const existing = await findUserQuota(userId);

  if (existing) {
    // Check if quota needs reset
    if (new Date(existing.resets_at) < new Date()) {
      return await resetUserQuota(userId);
    }
    return existing;
  }

  // Create new quota
  const supabase = getSupabaseServiceClient();
  const limits = getTierLimits(tier);

  const { data, error } = await supabase
    .from('user_quotas')
    .insert({
      user_id: userId,
      tier,
      daily_basic_limit: limits.basic,
      daily_full_limit: limits.full,
      resets_at: calculateResetTime(),
      basic_used_today: 0,
      full_used_today: 0,
      total_basic_used: 0,
      total_full_used: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user quota:', error);
    throw error;
  }

  return data;
}

/**
 * Reset user quota (new day)
 */
export async function resetUserQuota(userId: string): Promise<UserQuotaRow> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('user_quotas')
    .update({
      basic_used_today: 0,
      full_used_today: 0,
      resets_at: calculateResetTime(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error resetting user quota:', error);
    throw error;
  }

  return data;
}

/**
 * Consume quota for a processing tier
 */
export async function consumeQuota(
  userId: string,
  tier: 'basic' | 'full'
): Promise<UserQuotaRow> {
  const supabase = getSupabaseServiceClient();

  // Use RPC function to increment quota usage atomically
  const { data, error } = await supabase
    .rpc('increment_quota_usage', {
      p_user_id: userId,
      p_tier: tier,
    });

  if (error) {
    console.error('Error consuming quota:', error);
    throw error;
  }

  return data;
}

/**
 * Check if user has quota available
 */
export async function checkUserQuota(
  userId: string,
  tier: 'basic' | 'full'
): Promise<{ allowed: boolean; remaining: number; resetsAt: Date }> {
  const quota = await getOrCreateUserQuota(userId);

  // Check if needs reset
  if (new Date(quota.resets_at) < new Date()) {
    const resetQuota = await resetUserQuota(userId);
    const limit = tier === 'basic' ? resetQuota.daily_basic_limit : resetQuota.daily_full_limit;
    return {
      allowed: true,
      remaining: limit,
      resetsAt: new Date(resetQuota.resets_at),
    };
  }

  const used = tier === 'basic' ? quota.basic_used_today : quota.full_used_today;
  const limit = tier === 'basic' ? quota.daily_basic_limit : quota.daily_full_limit;

  return {
    allowed: limit === -1 || used < limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    resetsAt: new Date(quota.resets_at),
  };
}

/**
 * Upgrade user tier
 */
export async function upgradeUserTier(
  userId: string,
  newTier: 'free' | 'pro' | 'premium'
): Promise<UserQuotaRow> {
  const supabase = getSupabaseServiceClient();
  const limits = getTierLimits(newTier);

  const { data, error } = await supabase
    .from('user_quotas')
    .update({
      tier: newTier,
      daily_basic_limit: limits.basic,
      daily_full_limit: limits.full,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error upgrading user tier:', error);
    throw error;
  }

  return data;
}

/**
 * Get tier limits
 */
function getTierLimits(tier: 'free' | 'pro' | 'premium') {
  const configs = {
    free: { basic: 3, full: 1 },
    pro: { basic: 20, full: 5 },
    premium: { basic: -1, full: -1 },
  };

  return configs[tier];
}

/**
 * Calculate reset time (next day at midnight)
 */
function calculateResetTime(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
