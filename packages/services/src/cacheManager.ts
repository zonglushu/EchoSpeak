/**
 * Intelligent Cache Management Service
 *
 * Manages hot/warm/cold content tiers with automatic promotion/demotion.
 * Optimizes storage costs while maintaining performance.
 */

import type { ContentLibraryEntry } from './contentLibrary';

/**
 * Cache configuration
 */
export interface CacheConfig {
  // Hot tier thresholds
  hotMinViews: number;
  hotRecentDays: number;
  hotRecentViews: number;

  // Warm tier thresholds
  warmMaxDays: number;
  warmMinViews: number;

  // Cold tier thresholds
  coldEvictDays: number;
  coldEvictViews: number;

  // Featured content
  featuredNeverEvict: boolean;
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  hotMinViews: 500,
  hotRecentDays: 7,
  hotRecentViews: 50,
  warmMaxDays: 30,
  warmMinViews: 10,
  coldEvictDays: 30,
  coldEvictViews: 20,
  featuredNeverEvict: true,
};

/**
 * Cache management action
 */
export interface CacheAction {
  action: 'promote' | 'demote' | 'evict' | 'keep';
  from: string;
  to?: string;
  reason: string;
}

/**
 * Analyze content and determine cache tier
 */
export function analyzeCacheTier(
  content: Pick<ContentLibraryEntry,
    'isFeatured' | 'viewCount' | 'lastAccessedAt' | 'accessCount' | 'createdAt'
  >,
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): { tier: 'hot' | 'warm' | 'cold'; action: CacheAction } {
  const now = new Date();
  const daysSinceLastAccess = content.lastAccessedAt
    ? (now.getTime() - content.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  // Hot tier checks
  if (
    content.isFeatured ||
    content.viewCount >= config.hotMinViews ||
    (daysSinceLastAccess < config.hotRecentDays && content.accessCount >= config.hotRecentViews)
  ) {
    return {
      tier: 'hot',
      action: {
        action: 'keep',
        from: 'hot',
        reason: content.isFeatured
          ? 'Featured content'
          : `High traffic: ${content.viewCount} views, ${content.accessCount} accesses`,
      },
    };
  }

  // Warm tier checks
  if (
    daysSinceLastAccess < config.warmMaxDays &&
    content.accessCount >= config.warmMinViews
  ) {
    return {
      tier: 'warm',
      action: {
        action: 'keep',
        from: 'warm',
        reason: `Moderate traffic: ${content.accessCount} accesses in last ${Math.round(daysSinceLastAccess)} days`,
      },
    };
  }

  // Cold tier
  return {
    tier: 'cold',
    action: {
      action: 'keep',
      from: 'cold',
      reason: `Low traffic: ${content.viewCount} total views, last accessed ${Math.round(daysSinceLastAccess)} days ago`,
    },
  };
}

/**
 * Check if content should be evicted
 */
export function shouldEvict(
  content: Pick<ContentLibraryEntry,
    'isFeatured' | 'cacheTier' | 'lastAccessedAt' | 'viewCount' | 'createdAt'
  >,
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): { shouldEvict: boolean; reason: string } {
  // Never evict featured content
  if (content.isFeatured && config.featuredNeverEvict) {
    return {
      shouldEvict: false,
      reason: 'Featured content is never evicted',
    };
  }

  const now = new Date();
  const daysSinceLastAccess = content.lastAccessedAt
    ? (now.getTime() - content.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  const daysSinceCreated = content.createdAt
    ? (now.getTime() - content.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  // Must be at least 60 days old to consider eviction
  if (daysSinceCreated < 60) {
    return {
      shouldEvict: false,
      reason: `Content is only ${Math.round(daysSinceCreated)} days old (min 60 days)`,
    };
  }

  // Check eviction criteria
  if (
    content.cacheTier === 'cold' &&
    daysSinceLastAccess > config.coldEvictDays &&
    content.viewCount < config.coldEvictViews
  ) {
    return {
      shouldEvict: true,
      reason: `Cold content not accessed in ${Math.round(daysSinceLastAccess)} days with only ${content.viewCount} views`,
    };
  }

  return {
    shouldEvict: false,
    reason: 'Content does not meet eviction criteria',
  };
}

/**
 * Get content eligible for eviction
 */
export function getEvictionCandidates(
  contents: Pick<ContentLibraryEntry,
    'isFeatured' | 'cacheTier' | 'lastAccessedAt' | 'viewCount' | 'createdAt'
  >[],
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): Array<{ content: typeof contents[0]; reason: string }> {
  return contents
    .map(content => ({
      content,
      ...shouldEvict(content, config),
    }))
    .filter(({ shouldEvict }) => shouldEvict)
    .map(({ content, reason }) => ({ content, reason }));
}

/**
 * Calculate cache statistics
 */
export function getCacheStats(
  contents: Pick<ContentLibraryEntry, 'cacheTier' | 'viewCount' | 'processingCostUsd'>[]
): {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  hotPercent: number;
  warmPercent: number;
  coldPercent: number;
  totalViews: number;
  totalCost: number;
  estimatedSizeMB: number;
} {
  const total = contents.length;
  const hot = contents.filter(c => c.cacheTier === 'hot').length;
  const warm = contents.filter(c => c.cacheTier === 'warm').length;
  const cold = contents.filter(c => c.cacheTier === 'cold').length;

  return {
    total,
    hot,
    warm,
    cold,
    hotPercent: total > 0 ? (hot / total) * 100 : 0,
    warmPercent: total > 0 ? (warm / total) * 100 : 0,
    coldPercent: total > 0 ? (cold / total) * 100 : 0,
    totalViews: contents.reduce((sum, c) => sum + c.viewCount, 0),
    totalCost: contents.reduce((sum, c) => sum + c.processingCostUsd, 0),
    estimatedSizeMB: total * 0.5, // Rough estimate: 0.5MB per content
  };
}

/**
 * Suggest cache optimization actions
 */
export function getOptimizationSuggestions(
  contents: ContentLibraryEntry[],
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): Array<{
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  affectedCount: number;
}> {
  const suggestions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    affectedCount: number;
  }> = [];

  const evictionCandidates = getEvictionCandidates(contents, config);

  if (evictionCandidates.length > 0) {
    const savedSpace = evictionCandidates.length * 0.5; // MB
    suggestions.push({
      action: 'evict_cold',
      priority: 'high',
      impact: `Free up ${savedSpace.toFixed(1)} MB of storage`,
      affectedCount: evictionCandidates.length,
    });
  }

  // Check for underutilized warm content that could be demoted
  const warmContent = contents.filter(c => c.cacheTier === 'warm');
  let demoteCount = 0;

  for (const content of warmContent) {
    const analysis = analyzeCacheTier(content, config);
    if (analysis.tier === 'cold') {
      demoteCount++;
    }
  }

  if (demoteCount > 0) {
    suggestions.push({
      action: 'demote_warm_to_cold',
      priority: 'medium',
      impact: 'Optimize cache tier distribution',
      affectedCount: demoteCount,
    });
  }

  return suggestions;
}

/**
 * Simulate cache tier re-balancing
 */
export function simulateRebalancing(
  contents: ContentLibraryEntry[],
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): {
  currentStats: ReturnType<typeof getCacheStats>;
  proposedTiers: Array<{ id: string; current: string; proposed: string }>;
  projectedStats: ReturnType<typeof getCacheStats>;
} {
  const currentStats = getCacheStats(contents);

  const proposedTiers = contents.map(content => {
    const analysis = analyzeCacheTier(content, config);
    return {
      id: content.id,
      current: content.cacheTier,
      proposed: analysis.tier,
    };
  });

  // Create projected contents
  const projectedContents = contents.map((content, index) => ({
    ...content,
    cacheTier: proposedTiers[index].proposed as any,
  }));

  const projectedStats = getCacheStats(projectedContents);

  return {
    currentStats,
    proposedTiers,
    projectedStats,
  };
}
