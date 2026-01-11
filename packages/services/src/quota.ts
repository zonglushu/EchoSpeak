/**
 * User Quota Management System
 *
 * Manages daily processing limits for users to control AI costs.
 * This implements the tiered quota system:
 * - Free: 3 basic + 1 full per day
 * - Pro: 20 basic + 5 full per day
 * - Premium: Unlimited
 */

/**
 * User tier types
 */
export type UserTier = 'free' | 'pro' | 'premium';

/**
 * Processing tier types
 */
export type ProcessingTier = 'basic' | 'full';

/**
 * User quota information
 */
export interface UserQuota {
  userId: string;
  tier: UserTier;
  dailyBasicLimit: number;
  dailyFullLimit: number;
  basicUsedToday: number;
  fullUsedToday: number;
  totalBasicUsed: number;
  totalFullUsed: number;
  resetsAt: Date;
}

/**
 * Quota check result
 */
export interface QuotaCheckResult {
  allowed: boolean;
  tier: ProcessingTier;
  remaining: number;
  resetsAt: Date;
  reason?: 'quota_exceeded' | 'daily_limit_reached' | 'ok';
}

/**
 * Tier configuration
 */
const TIER_CONFIGS: Record<UserTier, { basic: number; full: number }> = {
  free: { basic: 3, full: 1 },
  pro: { basic: 20, full: 5 },
  premium: { basic: -1, full: -1 }, // -1 means unlimited
};

/**
 * Default quota limits per tier
 */
export function getTierLimits(tier: UserTier): { basic: number; full: number } {
  return TIER_CONFIGS[tier] || TIER_CONFIGS.free;
}

/**
 * Check if user has quota for a specific processing tier
 */
export function checkUserQuota(
  quota: UserQuota,
  tier: ProcessingTier
): QuotaCheckResult {
  const limits = getTierLimits(quota.tier);

  // Premium users have unlimited access
  if (quota.tier === 'premium') {
    return {
      allowed: true,
      tier,
      remaining: -1, // Unlimited
      resetsAt: quota.resetsAt,
      reason: 'ok',
    };
  }

  // Check if quota needs to be reset
  const now = new Date();
  if (now >= quota.resetsAt) {
    // Quota should be reset, but we don't do it here
    // The caller should call resetDailyQuota first
    return {
      allowed: true,
      tier,
      remaining: tier === 'basic' ? limits.basic : limits.full,
      resetsAt: quota.resetsAt,
      reason: 'ok',
    };
  }

  // Check basic tier quota
  if (tier === 'basic') {
    const remaining = limits.basic - quota.basicUsedToday;
    return {
      allowed: remaining > 0,
      tier,
      remaining: Math.max(0, remaining),
      resetsAt: quota.resetsAt,
      reason: remaining > 0 ? 'ok' : 'daily_limit_reached',
    };
  }

  // Check full tier quota
  if (tier === 'full') {
    const remaining = limits.full - quota.fullUsedToday;
    return {
      allowed: remaining > 0,
      tier,
      remaining: Math.max(0, remaining),
      resetsAt: quota.resetsAt,
      reason: remaining > 0 ? 'ok' : 'daily_limit_reached',
    };
  }

  return {
    allowed: false,
    tier,
    remaining: 0,
    resetsAt: quota.resetsAt,
    reason: 'quota_exceeded',
  };
}

/**
 * Calculate reset time (next day at midnight)
 */
export function calculateResetTime(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Create a default quota for a new user
 */
export function createDefaultQuota(userId: string, tier: UserTier = 'free'): UserQuota {
  const limits = getTierLimits(tier);
  return {
    userId,
    tier,
    dailyBasicLimit: limits.basic,
    dailyFullLimit: limits.full,
    basicUsedToday: 0,
    fullUsedToday: 0,
    totalBasicUsed: 0,
    totalFullUsed: 0,
    resetsAt: calculateResetTime(),
  };
}

/**
 * Consume quota for a processing tier
 */
export function consumeQuota(quota: UserQuota, tier: ProcessingTier): UserQuota {
  const updated = { ...quota };

  if (tier === 'basic') {
    updated.basicUsedToday += 1;
    updated.totalBasicUsed += 1;
  } else if (tier === 'full') {
    updated.fullUsedToday += 1;
    updated.totalFullUsed += 1;
  }

  return updated;
}

/**
 * Reset daily quota usage
 */
export function resetDailyQuota(quota: UserQuota): UserQuota {
  return {
    ...quota,
    basicUsedToday: 0,
    fullUsedToday: 0,
    resetsAt: calculateResetTime(),
  };
}

/**
 * Check if quota needs to be reset
 */
export function shouldResetQuota(quota: UserQuota): boolean {
  return new Date() >= quota.resetsAt;
}

/**
 * Get quota usage percentage
 */
export function getQuotaUsagePercentage(quota: UserQuota, tier: ProcessingTier): number {
  const limits = getTierLimits(quota.tier);

  if (limits[tier] === -1) {
    return 0; // Unlimited
  }

  const used = tier === 'basic' ? quota.basicUsedToday : quota.fullUsedToday;
  return Math.min(100, (used / limits[tier]) * 100);
}

/**
 * Calculate time until quota resets
 */
export function getTimeUntilReset(resetsAt: Date): string {
  const now = new Date();
  const diff = resetsAt.getTime() - now.getTime();

  if (diff <= 0) {
    return 'now';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Upgrade user tier
 */
export function upgradeTier(quota: UserQuota, newTier: UserTier): UserQuota {
  const newLimits = getTierLimits(newTier);

  return {
    ...quota,
    tier: newTier,
    dailyBasicLimit: newLimits.basic,
    dailyFullLimit: newLimits.full,
  };
}

/**
 * Get available quota for all tiers
 */
export function getAllAvailableQuotas(quota: UserQuota): {
  basic: QuotaCheckResult;
  full: QuotaCheckResult;
} {
  return {
    basic: checkUserQuota(quota, 'basic'),
    full: checkUserQuota(quota, 'full'),
  };
}
