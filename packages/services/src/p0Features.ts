/**
 * P0 Features Service Functions
 * Core Retention Mechanisms: Check-ins, History, Playlist, Badges, Trending
 * 
 * IMPORTANT: This module needs a Supabase client to be passed in.
 * Import from your app's supabase client initialization.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  UserCheckin,
  PracticeHistory,
  PracticePlaylistItem,
  Achievement,
  UserAchievement,
  UserStats,
  TrendingItem,
  ViewHistory,
} from '@echospeak/types';

// Singleton supabase client - must be initialized by the app
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client for P0 features
 * Call this once in your app initialization (e.g., in main.tsx)
 */
export function initP0Features(client: SupabaseClient) {
  supabaseClient = client;
}

/**
 * Get the Supabase client instance
 * @throws Error if client hasn't been initialized
 */
function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'P0 Features: Supabase client not initialized. ' +
      'Call initP0Features(supabaseClient) before using P0 features.'
    );
  }
  return supabaseClient;
}

// Helper function
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// ============================================================================
// P0-1: Daily Check-in System
// ============================================================================

/**
 * Record a daily check-in for a user
 * @param userId - The user's UUID
 * @param practiceDurationSeconds - Duration practiced today
 * @param sentencesPracticed - Number of sentences practiced
 */
export async function recordCheckin(
  userId: string,
  practiceDurationSeconds: number = 0,
  sentencesPracticed: number = 0
): Promise<UserCheckin> {
  const supabase = getSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const { data: existing, error: fetchError } = await supabase
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    throw fetchError;
  }

  if (existing) {
    // Update existing check-in
    const { data, error } = await supabase
      .from('user_checkins')
      .update({
        practice_duration_seconds: existing.practice_duration_seconds + practiceDurationSeconds,
        sentences_practiced: existing.sentences_practiced + sentencesPracticed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculate streak
  const { data: yesterdayCheckin } = await supabase
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', getYesterdayDate())
    .single();

  const streakCount = yesterdayCheckin ? yesterdayCheckin.streak_count + 1 : 1;

  // Get total checkins
  const { count } = await supabase
    .from('user_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const totalCheckins = (count || 0) + 1;

  // Create new check-in
  const { data, error } = await supabase
    .from('user_checkins')
    .insert({
      user_id: userId,
      checkin_date: today,
      streak_count: streakCount,
      total_checkins: totalCheckins,
      practice_duration_seconds: practiceDurationSeconds,
      sentences_practiced: sentencesPracticed,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's check-in history
 */
export async function getUserCheckins(userId: string, limit: number = 30): Promise<UserCheckin[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/user_checkins?user_id=eq.${userId}&order=checkin_date.desc&limit=${limit}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data || [];
}

// ============================================================================
// P0-2: Practice History
// ============================================================================

/**
 * Record a practice session
 */
export async function recordPracticeHistory(
  userId: string,
  practiceData: {
    asset_id?: string;
    video_id?: string;
    video_title: string;
    video_thumbnail?: string;
    duration_seconds: number;
    sentences_completed: number;
    sentences_total: number;
  }
): Promise<PracticeHistory> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const practiceDate = new Date().toISOString().split('T')[0];
  const progressPercentage = practiceData.sentences_total > 0
    ? (practiceData.sentences_completed / practiceData.sentences_total) * 100
    : 0;

  const { data } = await fetch(`${supabaseUrl}/rest/v1/practice_history`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      ...practiceData,
      practice_date: practiceDate,
      progress_percentage: progressPercentage,
    }),
  }).then((res) => res.json());

  // Also record check-in if practiced today
  await recordCheckin(userId, practiceData.duration_seconds, practiceData.sentences_completed);

  return data[0];
}

/**
 * Get user's practice history grouped by date
 */
export async function getPracticeHistory(userId: string, days: number = 30): Promise<PracticeHistory[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/practice_history?user_id=eq.${userId}&practice_date=gte.${startDateStr}&order=practice_date.desc,completed_at.desc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data || [];
}

// ============================================================================
// P0-3: Practice Playlist / Favorites
// ============================================================================

/**
 * Add video to practice playlist
 */
export async function addToPlaylist(
  userId: string,
  videoData: {
    asset_id?: string;
    video_id?: string;
    video_title: string;
    video_thumbnail?: string;
    video_duration?: number;
  }
): Promise<PracticePlaylistItem> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Get current max sort_order
  const { data: existingItems } = await fetch(
    `${supabaseUrl}/rest/v1/practice_playlist?user_id=eq.${userId}&select=sort_order&order=sort_order.desc&limit=1`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  const nextSortOrder = existingItems && existingItems.length > 0 ? existingItems[0].sort_order + 1 : 0;

  const { data } = await fetch(`${supabaseUrl}/rest/v1/practice_playlist`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      ...videoData,
      sort_order: nextSortOrder,
    }),
  }).then((res) => res.json());

  return data[0];
}

/**
 * Get user's practice playlist
 */
export async function getPlaylist(userId: string): Promise<PracticePlaylistItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/practice_playlist?user_id=eq.${userId}&order=sort_order.asc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data || [];
}

/**
 * Remove from playlist
 */
export async function removeFromPlaylist(userId: string, playlistItemId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  await fetch(`${supabaseUrl}/rest/v1/practice_playlist?id=eq.${playlistItemId}&user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  });
}

/**
 * Reorder playlist items
 */
export async function reorderPlaylist(
  userId: string,
  itemIds: string[]
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Update sort_order for each item
  for (let i = 0; i < itemIds.length; i++) {
    await fetch(`${supabaseUrl}/rest/v1/practice_playlist?id=eq.${itemIds[i]}&user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sort_order: i }),
    });
  }
}

// ============================================================================
// P0-4: Achievement Badges System
// ============================================================================

/**
 * Get all available achievements
 */
export async function getAchievements(): Promise<Achievement[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/achievements?is_active=eq.true&order=category.asc,rarity.asc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data || [];
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/user_achievements?user_id=eq.${userId}&order=earned_at.desc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data || [];
}

/**
 * Check and award achievements based on user stats
 * This should be called after recording practice/check-in
 */
export async function checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Get user stats
  const { data: stats } = await fetch(
    `${supabaseUrl}/rest/v1/user_stats?user_id=eq.${userId}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  if (!stats || stats.length === 0) return [];

  const userStats = stats[0];

  // Get all achievements
  const allAchievements = await getAchievements();

  // Get user's existing achievements
  const userAchievements = await getUserAchievements(userId);
  const earnedCodes = new Set(userAchievements.map((ua) => ua.achievement_id));

  // Check which achievements should be awarded
  const newAchievements: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (earnedCodes.has(achievement.id)) continue;

    let shouldAward = false;

    switch (achievement.requirement_type) {
      case 'streak_days':
        shouldAward = userStats.current_streak >= achievement.requirement_value;
        break;
      case 'total_practices':
        shouldAward = userStats.total_videos_completed >= achievement.requirement_value;
        break;
      case 'total_sentences':
        shouldAward = userStats.total_sentences_practiced >= achievement.requirement_value;
        break;
      case 'total_seconds':
        shouldAward = userStats.total_practice_seconds >= achievement.requirement_value;
        break;
      case 'playlist_count':
        const playlist = await getPlaylist(userId);
        shouldAward = playlist.length >= achievement.requirement_value;
        break;
    }

    if (shouldAward) {
      // Award achievement
      await fetch(`${supabaseUrl}/rest/v1/user_achievements`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          achievement_id: achievement.id,
        }),
      });

      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

// ============================================================================
// P0-5: Notification System (Web Push API)
// ============================================================================

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Show a local notification
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options,
    });
  }
}

/**
 * Schedule a daily reminder notification
 * This uses the browser's Notification API (client-side only)
 */
export function scheduleDailyReminder(hour: number = 20, minute: number = 0): void {
  // Calculate time until next reminder
  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(hour, minute, 0, 0);

  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  const timeout = reminderTime.getTime() - now.getTime();

  setTimeout(() => {
    showNotification('⏰ Don\'t break your streak!', {
      body: 'You haven\'t practiced today. Keep your streak alive!',
      tag: 'daily-reminder',
      requireInteraction: true,
    });

    // Schedule next day
    scheduleDailyReminder(hour, minute);
  }, timeout);
}

// ============================================================================
// P0-6: Trending / Hot Content
// ============================================================================

/**
 * Record a view (for trending calculation)
 */
export async function recordView(
  userId: string | undefined,
  viewData: {
    asset_id?: string;
    video_id?: string;
    view_duration_seconds?: number;
    completed?: boolean;
  }
): Promise<ViewHistory> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const { data } = await fetch(`${supabaseUrl}/rest/v1/view_history`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      ...viewData,
    }),
  }).then((res) => res.json());

  return data[0];
}

/**
 * Get trending content (hot list)
 */
export async function getTrendingContent(period: 'today' | 'week' | 'month' = 'week'): Promise<TrendingItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Calculate date range
  const now = new Date();
  let startDate = new Date();

  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  }

  const startDateStr = startDate.toISOString();

  // Get view history for the period
  const { data: views } = await fetch(
    `${supabaseUrl}/rest/v1/view_history?viewed_at=gte.${startDateStr}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  if (!views || views.length === 0) return [];

  // Group by asset/video and calculate metrics
  const viewMap = new Map<string, any>();

  for (const view of views) {
    const key = view.asset_id || view.video_id;
    if (!key) continue;

    if (!viewMap.has(key)) {
      viewMap.set(key, {
        asset_id: view.asset_id,
        video_id: view.video_id,
        view_count: 0,
        completed_count: 0,
        total_duration: 0,
      });
    }

    const item = viewMap.get(key);
    item.view_count++;
    if (view.completed) item.completed_count++;
    item.total_duration += view.view_duration_seconds || 0;
  }

  // Convert to trending items with scores
  const trending: TrendingItem[] = Array.from(viewMap.values())
    .map((item) => ({
      asset_id: item.asset_id,
      video_id: item.video_id,
      video_title: item.asset_id ? `Asset ${item.asset_id.slice(0, 8)}` : `Video ${item.video_id}`,
      video_thumbnail: undefined,
      view_count_today: period === 'today' ? item.view_count : 0,
      view_count_week: period === 'week' ? item.view_count : 0,
      view_count_month: period === 'month' ? item.view_count : 0,
      completion_rate: item.view_count > 0 ? item.completed_count / item.view_count : 0,
      trend_score: item.view_count * 1.0 + item.completed_count * 2.0, // Simple scoring
    }))
    .sort((a, b) => b.trend_score - a.trend_score)
    .slice(0, 10); // Top 10

  return trending;
}

// ============================================================================
// User Stats Summary
// ============================================================================

/**
 * Get user's overall stats
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/user_stats?user_id=eq.${userId}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data && data.length > 0 ? data[0] : null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format seconds to human-readable duration (e.g., "2h 30m")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get check-in calendar data (for heatmap visualization)
 */
export async function getCheckinCalendar(userId: string, months: number = 12): Promise<UserCheckin[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data } = await fetch(
    `${supabaseUrl}/rest/v1/user_checkins?user_id=eq.${userId}&checkin_date=gte.${startDateStr}&order=checkin_date.asc`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    }
  ).then((res) => res.json());

  return data || [];
}
