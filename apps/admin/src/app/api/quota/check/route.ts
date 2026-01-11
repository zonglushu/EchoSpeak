import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUserQuota,
  checkUserQuota,
} from '@/utils/database/userQuota';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default-user';
    const tier = searchParams.get('tier') as 'free' | 'pro' | 'premium' || 'free';

    // Get or create user quota from database
    const quota = await getOrCreateUserQuota(userId, tier);

    // Calculate remaining
    const basicRemaining = quota.daily_basic_limit === -1
      ? -1
      : Math.max(0, quota.daily_basic_limit - quota.basic_used_today);
    const fullRemaining = quota.daily_full_limit === -1
      ? -1
      : Math.max(0, quota.daily_full_limit - quota.full_used_today);

    return NextResponse.json({
      success: true,
      data: {
        userId: quota.user_id,
        tier: quota.tier,
        limits: {
          basic: quota.daily_basic_limit,
          full: quota.daily_full_limit,
        },
        usage: {
          basicUsed: quota.basic_used_today,
          fullUsed: quota.full_used_today,
          totalBasicUsed: quota.total_basic_used,
          totalFullUsed: quota.total_full_used,
        },
        remaining: {
          basic: basicRemaining,
          full: fullRemaining,
        },
        usagePercentage: {
          basic: quota.daily_basic_limit === -1 ? 0 : (quota.basic_used_today / quota.daily_basic_limit) * 100,
          full: quota.daily_full_limit === -1 ? 0 : (quota.full_used_today / quota.daily_full_limit) * 100,
        },
        resetsAt: quota.resets_at,
        timeUntilReset: getTimeUntilReset(new Date(quota.resets_at)),
        canRequest: {
          basic: basicRemaining > 0 || quota.daily_basic_limit === -1,
          full: fullRemaining > 0 || quota.daily_full_limit === -1,
        },
      },
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function getTimeUntilReset(resetsAt: Date): string {
  const now = new Date();
  const diff = resetsAt.getTime() - now.getTime();

  if (diff <= 0) return 'now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
