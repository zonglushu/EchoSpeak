/**
 * Content Library Database Operations
 *
 * Handles all CRUD operations for the content_library table.
 */

import { getSupabaseServiceClient } from '../supabaseServer';
import type { ContentLibraryEntry } from '@echospeak/services';

// Database row types (matching the SQL schema)
export interface ContentLibraryRow {
  id: string;
  youtube_id: string;
  raw_subtitles: any;
  language_code: string;
  extracted_at: string;
  basic_annotations?: any;
  basic_processed_at?: string;
  full_prosody_data?: any;
  full_processed_at?: string;
  title?: string;
  thumbnail_url?: string;
  duration?: number;
  view_count: number;
  unique_viewers: number;
  last_viewed_at?: string;
  first_viewed_at?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  topic_tags?: string[];
  is_featured: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
  processing_cost_usd: number;
  ai_model_used?: string;
  generation_time_ms?: number;
  cache_tier: 'hot' | 'warm' | 'cold';
  last_accessed_at: string;
  access_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Find content by YouTube ID
 */
export async function findContentByYoutubeId(youtubeId: string): Promise<ContentLibraryRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('youtube_id', youtubeId)
    .single();

  if (error) {
    console.error('Error finding content by YouTube ID:', error);
    return null;
  }

  return data;
}

/**
 * Create new content entry
 */
export async function createContent(content: Partial<ContentLibraryRow>): Promise<ContentLibraryRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content_library')
    .insert(content)
    .select()
    .single();

  if (error) {
    console.error('Error creating content:', error);
    return null;
  }

  return data;
}

/**
 * Update content entry
 */
export async function updateContent(id: string, updates: Partial<ContentLibraryRow>): Promise<ContentLibraryRow | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content_library')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content:', error);
    return null;
  }

  return data;
}

/**
 * Update access statistics
 */
export async function updateAccessStats(youtubeId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.rpc('increment_content_stats', {
    p_youtube_id: youtubeId,
  });

  if (error) {
    console.error('Error updating access stats:', error);
  }
}

/**
 * List content with filters
 */
export async function listContent(filters: {
  languageCode?: string;
  difficultyLevel?: string;
  isFeatured?: boolean;
  moderationStatus?: string;
  cacheTier?: string;
  topicTags?: string[];
  minViewCount?: number;
  limit?: number;
  offset?: number;
}): Promise<{ data: ContentLibraryRow[]; count: number }> {
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from('content_library')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.languageCode) {
    query = query.eq('language_code', filters.languageCode);
  }

  if (filters.difficultyLevel) {
    query = query.eq('difficulty_level', filters.difficultyLevel);
  }

  if (filters.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured);
  }

  if (filters.moderationStatus) {
    query = query.eq('moderation_status', filters.moderationStatus);
  }

  if (filters.cacheTier) {
    query = query.eq('cache_tier', filters.cacheTier);
  }

  if (filters.minViewCount !== undefined) {
    query = query.gte('view_count', filters.minViewCount);
  }

  if (filters.topicTags && filters.topicTags.length > 0) {
    query = query.contains('topic_tags', filters.topicTags);
  }

  // Apply pagination and ordering
  query = query
    .order('view_count', { ascending: false })
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing content:', error);
    return { data: [], count: 0 };
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Get content statistics
 */
export async function getContentStats(): Promise<{
  total: number;
  featured: number;
  byTier: Record<string, number>;
  byStatus: Record<string, number>;
  totalViews: number;
  totalCost: number;
}> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from('content_library')
    .select('is_featured, cache_tier, moderation_status, view_count, processing_cost_usd');

  if (error || !data) {
    console.error('Error getting content stats:', error);
    return {
      total: 0,
      featured: 0,
      byTier: { hot: 0, warm: 0, cold: 0 },
      byStatus: { pending: 0, approved: 0, rejected: 0 },
      totalViews: 0,
      totalCost: 0,
    };
  }

  return {
    total: data.length,
    featured: data.filter(row => row.is_featured).length,
    byTier: {
      hot: data.filter(row => row.cache_tier === 'hot').length,
      warm: data.filter(row => row.cache_tier === 'warm').length,
      cold: data.filter(row => row.cache_tier === 'cold').length,
    },
    byStatus: {
      pending: data.filter(row => row.moderation_status === 'pending').length,
      approved: data.filter(row => row.moderation_status === 'approved').length,
      rejected: data.filter(row => row.moderation_status === 'rejected').length,
    },
    totalViews: data.reduce((sum, row) => sum + row.view_count, 0),
    totalCost: data.reduce((sum, row) => sum + Number(row.processing_cost_usd), 0),
  };
}
