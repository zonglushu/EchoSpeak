/**
 * Content Library Service
 *
 * Manages storage and retrieval of processed YouTube content.
 * Implements intelligent caching strategy with hot/warm/cold tiers.
 */

import type { TranscriptLine } from '@echospeak/types';
import type { YouTubeVideoMetadata } from './youtube';

/**
 * Cache tier types
 */
export type CacheTier = 'hot' | 'warm' | 'cold';

/**
 * Processing layer types
 */
export type ProcessingLayer = 'layer1' | 'layer2' | 'layer3';

/**
 * Moderation status
 */
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

/**
 * Content library entry
 */
export interface ContentLibraryEntry {
  id: string;
  youtubeId: string;

  // Layer 1: Raw subtitles (always present)
  rawSubtitles: TranscriptLine[];
  languageCode: string;
  extractedAt: Date;

  // Layer 2: Basic annotations (optional)
  basicAnnotations?: TranscriptLine[];
  basicProcessedAt?: Date;

  // Layer 3: Full prosody data (optional)
  fullProsodyData?: TranscriptLine[];
  fullProcessedAt?: Date;

  // Metadata
  title?: string;
  thumbnailUrl?: string;
  duration?: number;

  // Usage statistics
  viewCount: number;
  uniqueViewers: number;
  lastViewedAt?: Date;
  firstViewedAt?: Date;

  // Content classification
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  topicTags?: string[];
  isFeatured: boolean;

  // Quality control
  moderationStatus: ModerationStatus;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: Date;

  // Cost tracking
  processingCostUsd: number;
  aiModelUsed?: string;
  generationTimeMs?: number;

  // Cache management
  cacheTier: CacheTier;
  lastAccessedAt: Date;
  accessCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content search filters
 */
export interface ContentSearchFilters {
  languageCode?: string;
  difficultyLevel?: string;
  isFeatured?: boolean;
  moderationStatus?: ModerationStatus;
  cacheTier?: CacheTier;
  topicTags?: string[];
  minViewCount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Content access result
 */
export interface ContentAccessResult {
  found: boolean;
  entry?: ContentLibraryEntry;
  layer: ProcessingLayer;
  fromCache: boolean;
}

/**
 * Calculate cache tier based on content statistics
 */
export function calculateCacheTier(entry: Pick<ContentLibraryEntry,
  'isFeatured' | 'viewCount' | 'lastAccessedAt' | 'accessCount' | 'createdAt'
>): CacheTier {
  const now = new Date();
  const daysSinceLastAccess = entry.lastAccessedAt
    ? (now.getTime() - entry.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  // Hot content: Featured OR high traffic
  if (
    entry.isFeatured ||
    entry.viewCount > 500 ||
    (daysSinceLastAccess < 7 && entry.accessCount > 50)
  ) {
    return 'hot';
  }

  // Warm content: Moderate traffic
  if (daysSinceLastAccess < 30 && entry.accessCount > 10) {
    return 'warm';
  }

  // Cold content: Low traffic
  return 'cold';
}

/**
 * Check if content should be evicted (deleted)
 */
export function shouldEvictContent(entry: Pick<ContentLibraryEntry,
  'isFeatured' | 'cacheTier' | 'lastAccessedAt' | 'viewCount' | 'createdAt'
>): boolean {
  // Never evict featured content
  if (entry.isFeatured) {
    return false;
  }

  const now = new Date();
  const daysSinceLastAccess = entry.lastAccessedAt
    ? (now.getTime() - entry.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  // Eviction conditions (all must be true):
  // 1. Cold tier
  // 2. Not accessed in 30 days
  // 3. Total views < 20
  return (
    entry.cacheTier === 'cold' &&
    daysSinceLastAccess > 30 &&
    entry.viewCount < 20
  );
}

/**
 * Update access statistics for content
 */
export function updateAccessStats(entry: ContentLibraryEntry): ContentLibraryEntry {
  const now = new Date();
  const newCacheTier = calculateCacheTier(entry);

  return {
    ...entry,
    lastAccessedAt: now,
    accessCount: entry.accessCount + 1,
    viewCount: entry.viewCount + 1,
    cacheTier: newCacheTier,
    updatedAt: now,
  };
}

/**
 * Create a new content library entry
 */
export function createContentEntry(
  youtubeId: string,
  rawSubtitles: TranscriptLine[],
  metadata: YouTubeVideoMetadata | null,
  options: {
    languageCode?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    topicTags?: string[];
  } = {}
): ContentLibraryEntry {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    youtubeId,
    rawSubtitles,
    languageCode: options.languageCode || 'en',
    extractedAt: now,

    title: metadata?.title,
    thumbnailUrl: metadata?.thumbnailUrl,
    duration: metadata?.duration,

    viewCount: 0,
    uniqueViewers: 0,
    lastAccessedAt: now,
    firstViewedAt: undefined,

    difficultyLevel: options.difficultyLevel,
    topicTags: options.topicTags,
    isFeatured: false,

    moderationStatus: 'pending',

    processingCostUsd: 0,

    cacheTier: 'cold',
    accessCount: 0,

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add layer 2 processing (basic annotations)
 */
export function addBasicAnnotations(
  entry: ContentLibraryEntry,
  annotations: TranscriptLine[],
  cost: number,
  aiModel: string
): ContentLibraryEntry {
  return {
    ...entry,
    basicAnnotations: annotations,
    basicProcessedAt: new Date(),
    processingCostUsd: entry.processingCostUsd + cost,
    aiModelUsed: aiModel,
    updatedAt: new Date(),
  };
}

/**
 * Add layer 3 processing (full prosody)
 */
export function addFullProsody(
  entry: ContentLibraryEntry,
  prosodyData: TranscriptLine[],
  cost: number,
  aiModel: string,
  generationTimeMs: number
): ContentLibraryEntry {
  return {
    ...entry,
    fullProsodyData: prosodyData,
    fullProcessedAt: new Date(),
    processingCostUsd: entry.processingCostUsd + cost,
    aiModelUsed: aiModel,
    generationTimeMs,
    updatedAt: new Date(),
  };
}

/**
 * Approve content moderation
 */
export function approveContent(
  entry: ContentLibraryEntry,
  moderatorId: string,
  notes?: string
): ContentLibraryEntry {
  return {
    ...entry,
    moderationStatus: 'approved',
    moderationNotes: notes,
    moderatedBy: moderatorId,
    moderatedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Reject content moderation
 */
export function rejectContent(
  entry: ContentLibraryEntry,
  moderatorId: string,
  notes?: string
): ContentLibraryEntry {
  return {
    ...entry,
    moderationStatus: 'rejected',
    moderationNotes: notes,
    moderatedBy: moderatorId,
    moderatedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Feature content (mark as featured)
 */
export function featureContent(entry: ContentLibraryEntry): ContentLibraryEntry {
  return {
    ...entry,
    isFeatured: true,
    cacheTier: 'hot', // Featured content is always hot
    updatedAt: new Date(),
  };
}

/**
 * Unfeature content
 */
export function unfeatureContent(entry: ContentLibraryEntry): ContentLibraryEntry {
  const updated = { ...entry, isFeatured: false };
  updated.cacheTier = calculateCacheTier(updated);
  updated.updatedAt = new Date();
  return updated;
}

/**
 * Search content with filters
 */
export function searchContent(
  entries: ContentLibraryEntry[],
  filters: ContentSearchFilters
): ContentLibraryEntry[] {
  let results = [...entries];

  // Filter by language
  if (filters.languageCode) {
    results = results.filter(e => e.languageCode === filters.languageCode);
  }

  // Filter by difficulty
  if (filters.difficultyLevel) {
    results = results.filter(e => e.difficultyLevel === filters.difficultyLevel);
  }

  // Filter by featured status
  if (filters.isFeatured !== undefined) {
    results = results.filter(e => e.isFeatured === filters.isFeatured);
  }

  // Filter by moderation status
  if (filters.moderationStatus) {
    results = results.filter(e => e.moderationStatus === filters.moderationStatus);
  }

  // Filter by cache tier
  if (filters.cacheTier) {
    results = results.filter(e => e.cacheTier === filters.cacheTier);
  }

  // Filter by topic tags
  if (filters.topicTags && filters.topicTags.length > 0) {
    results = results.filter(e =>
      filters.topicTags!.some(tag => e.topicTags?.includes(tag))
    );
  }

  // Filter by minimum view count
  if (filters.minViewCount !== undefined) {
    results = results.filter(e => e.viewCount >= filters.minViewCount!);
  }

  // Sort by view count (descending)
  results.sort((a, b) => b.viewCount - a.viewCount);

  // Pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 20;

  return results.slice(offset, offset + limit);
}

/**
 * Get content statistics
 */
export function getContentStats(entries: ContentLibraryEntry[]): {
  total: number;
  featured: number;
  byTier: Record<CacheTier, number>;
  byStatus: Record<ModerationStatus, number>;
  totalViews: number;
  totalCost: number;
} {
  return {
    total: entries.length,
    featured: entries.filter(e => e.isFeatured).length,
    byTier: {
      hot: entries.filter(e => e.cacheTier === 'hot').length,
      warm: entries.filter(e => e.cacheTier === 'warm').length,
      cold: entries.filter(e => e.cacheTier === 'cold').length,
    },
    byStatus: {
      pending: entries.filter(e => e.moderationStatus === 'pending').length,
      approved: entries.filter(e => e.moderationStatus === 'approved').length,
      rejected: entries.filter(e => e.moderationStatus === 'rejected').length,
    },
    totalViews: entries.reduce((sum, e) => sum + e.viewCount, 0),
    totalCost: entries.reduce((sum, e) => sum + e.processingCostUsd, 0),
  };
}
