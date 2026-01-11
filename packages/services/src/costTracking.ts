/**
 * Cost Tracking Service
 *
 * Tracks AI processing costs for budget management and optimization.
 * Aggregates daily statistics and monitors cache effectiveness.
 */

/**
 * Daily cost statistics
 */
export interface DailyCostStats {
  date: string; // ISO date string (YYYY-MM-DD)
  totalCalls: number;
  totalTokens: number;
  totalCostUsd: number;

  // Tier breakdown
  basicCalls: number;
  fullCalls: number;
  rulesBasedCalls: number;

  // User statistics
  uniqueUsers: number;
  avgCostPerUser: number;

  // Cache effectiveness
  cacheHitRate: number; // 0.80 = 80%
  moneySavedByCache: number;
}

/**
 * Cost tracking entry for a single processing job
 */
export interface CostEntry {
  id: string;
  userId: string;
  youtubeId: string;
  tier: 'basic' | 'full' | 'rules-based';
  costUsd: number;
  tokensUsed: number;
  fromCache: boolean;
  timestamp: Date;
}

/**
 * Budget alert threshold
 */
export interface BudgetAlert {
  threshold: number; // Percentage (0-100)
  alertSent: boolean;
  timestamp?: Date;
}

/**
 * Daily budget configuration
 */
export interface BudgetConfig {
  dailyBudgetLimit: number; // USD
  alertThreshold: number; // Percentage
  maxCallsPerDay: number;
  alertSent?: boolean;
}

/**
 * Default budget configuration
 */
export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  dailyBudgetLimit: 50, // $50 per day
  alertThreshold: 80, // Alert at 80%
  maxCallsPerDay: 1000,
};

/**
 * Aggregate daily cost statistics from cost entries
 */
export function aggregateDailyStats(entries: CostEntry[]): DailyCostStats {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.timestamp.toISOString().split('T')[0] === today);

  const uniqueUsers = new Set(todayEntries.map(e => e.userId)).size;
  const cacheHits = todayEntries.filter(e => e.fromCache).length;
  const cacheHitRate = todayEntries.length > 0 ? cacheHits / todayEntries.length : 0;

  // Estimate money saved by cache
  // Assume cached content would have cost the same as original processing
  const moneySavedByCache = todayEntries
    .filter(e => e.fromCache)
    .reduce((sum, e) => {
      // Estimate original cost based on tier
      const estimatedCost = e.tier === 'full' ? 0.07 : 0.01;
      return sum + estimatedCost;
    }, 0);

  return {
    date: today,
    totalCalls: todayEntries.length,
    totalTokens: todayEntries.reduce((sum, e) => sum + e.tokensUsed, 0),
    totalCostUsd: todayEntries.reduce((sum, e) => sum + e.costUsd, 0),
    basicCalls: todayEntries.filter(e => e.tier === 'basic').length,
    fullCalls: todayEntries.filter(e => e.tier === 'full').length,
    rulesBasedCalls: todayEntries.filter(e => e.tier === 'rules-based').length,
    uniqueUsers,
    avgCostPerUser: uniqueUsers > 0 ? todayEntries.reduce((sum, e) => sum + e.costUsd, 0) / uniqueUsers : 0,
    cacheHitRate,
    moneySavedByCache,
  };
}

/**
 * Check if budget alert should be sent
 */
export function shouldSendBudgetAlert(
  stats: DailyCostStats,
  config: BudgetConfig
): boolean {
  if (config.alertSent) {
    return false;
  }

  const budgetUsagePercentage = (stats.totalCostUsd / config.dailyBudgetLimit) * 100;

  return budgetUsagePercentage >= config.alertThreshold;
}

/**
 * Check if daily budget limit is exceeded
 */
export function isBudgetExceeded(
  stats: DailyCostStats,
  config: BudgetConfig
): boolean {
  return stats.totalCostUsd >= config.dailyBudgetLimit;
}

/**
 * Check if call limit is exceeded
 */
export function isCallLimitExceeded(
  stats: DailyCostStats,
  config: BudgetConfig
): boolean {
  return stats.totalCalls >= config.maxCallsPerDay;
}

/**
 * Calculate cost per tier
 */
export function calculateCostByTier(entries: CostEntry[]): {
  basic: number;
  full: number;
  rulesBased: number;
} {
  return {
    basic: entries.filter(e => e.tier === 'basic').reduce((sum, e) => sum + e.costUsd, 0),
    full: entries.filter(e => e.tier === 'full').reduce((sum, e) => sum + e.costUsd, 0),
    rulesBased: entries.filter(e => e.tier === 'rules-based').reduce((sum, e) => sum + e.costUsd, 0),
  };
}

/**
 * Calculate average cost per call
 */
export function calculateAvgCostPerCall(entries: CostEntry[]): number {
  if (entries.length === 0) return 0;
  const totalCost = entries.reduce((sum, e) => sum + e.costUsd, 0);
  return totalCost / entries.length;
}

/**
 * Get top users by cost
 */
export function getTopUsersByCost(entries: CostEntry[], limit: number = 10): Array<{
  userId: string;
  totalCost: number;
  totalCalls: number;
}> {
  const userCosts = new Map<string, { totalCost: number; totalCalls: number }>();

  for (const entry of entries) {
    const existing = userCosts.get(entry.userId) || { totalCost: 0, totalCalls: 0 };
    userCosts.set(entry.userId, {
      totalCost: existing.totalCost + entry.costUsd,
      totalCalls: existing.totalCalls + 1,
    });
  }

  return Array.from(userCosts.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, limit);
}

/**
 * Calculate cost trend over last N days
 */
export function calculateCostTrend(entries: CostEntry[], days: number = 7): Array<{
  date: string;
  totalCost: number;
  totalCalls: number;
}> {
  const trend = new Map<string, { totalCost: number; totalCalls: number }>();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentEntries = entries.filter(e => e.timestamp >= cutoffDate);

  for (const entry of recentEntries) {
    const date = entry.timestamp.toISOString().split('T')[0];
    const existing = trend.get(date) || { totalCost: 0, totalCalls: 0 };
    trend.set(date, {
      totalCost: existing.totalCost + entry.costUsd,
      totalCalls: existing.totalCalls + 1,
    });
  }

  return Array.from(trend.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Estimate monthly cost based on daily average
 */
export function estimateMonthlyCost(stats: DailyCostStats): number {
  return stats.totalCostUsd * 30;
}

/**
 * Get cost efficiency metrics
 */
export function getCostEfficiencyMetrics(entries: CostEntry[]): {
  avgCostPerCall: number;
  cacheHitRate: number;
  moneySavedByCache: number;
  percentCached: number;
} {
  const cacheHits = entries.filter(e => e.fromCache).length;
  const totalCalls = entries.length;
  const moneySavedByCache = entries
    .filter(e => e.fromCache)
    .reduce((sum, e) => {
      const estimatedCost = e.tier === 'full' ? 0.07 : 0.01;
      return sum + estimatedCost;
    }, 0);

  return {
    avgCostPerCall: calculateAvgCostPerCall(entries),
    cacheHitRate: totalCalls > 0 ? cacheHits / totalCalls : 0,
    moneySavedByCache,
    percentCached: totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0,
  };
}

/**
 * Create a cost entry
 */
export function createCostEntry(
  userId: string,
  youtubeId: string,
  tier: 'basic' | 'full' | 'rules-based',
  costUsd: number,
  tokensUsed: number,
  fromCache: boolean
): CostEntry {
  return {
    id: crypto.randomUUID(),
    userId,
    youtubeId,
    tier,
    costUsd,
    tokensUsed,
    fromCache,
    timestamp: new Date(),
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
}
