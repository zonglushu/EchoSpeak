/**
 * P0 Features Client Wrapper
 * Provides easy-to-use functions that work in the browser
 */

import { supabase } from '../lib/supabase';
import type {
  UserCheckin,
  PracticeHistory,
  Achievement,
  UserAchievement,
  TrendingItem,
} from '@echospeak/types';

// ============================================================================
// P0-1: Daily Check-in System
// ============================================================================

function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export async function recordCheckin(
  userId: string,
  practiceDurationSeconds: number = 0,
  sentencesPracticed: number = 0
): Promise<UserCheckin> {
  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const { data: existing, error: fetchError } = await supabase
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .maybeSingle();

  if (fetchError) throw fetchError;

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
    .maybeSingle();

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

export async function getUserCheckins(userId: string, limit: number = 30): Promise<UserCheckin[]> {
  const { data, error } = await supabase
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getCheckinCalendar(userId: string, months: number = 12): Promise<UserCheckin[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('checkin_date', startDateStr)
    .order('checkin_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// P0-2: Practice History
// ============================================================================

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
  const practiceDate = new Date().toISOString().split('T')[0];
  const progressPercentage = practiceData.sentences_total > 0
    ? (practiceData.sentences_completed / practiceData.sentences_total) * 100
    : 0;

  const { data, error } = await supabase
    .from('practice_history')
    .insert({
      user_id: userId,
      ...practiceData,
      practice_date: practiceDate,
      progress_percentage: progressPercentage,
    })
    .select()
    .single();

  if (error) throw error;

  // Also record check-in
  await recordCheckin(userId, practiceData.duration_seconds, practiceData.sentences_completed);

  return data;
}

export async function getPracticeHistory(userId: string, days: number = 30): Promise<PracticeHistory[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('practice_history')
    .select('*')
    .eq('user_id', userId)
    .gte('practice_date', startDateStr)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// P0-3: Practice Playlist
// ============================================================================

export async function addToPlaylist(
  userId: string,
  videoData: {
    asset_id?: string;
    video_id: string;
    video_title: string;
    video_thumbnail?: string;
    video_duration?: number;
  }
) {
  // Get current max sort_order
  const { data: existing } = await supabase
    .from('practice_playlist')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = existing ? existing.sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('practice_playlist')
    .insert({
      user_id: userId,
      ...videoData,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPlaylist(userId: string) {
  const { data, error } = await supabase
    .from('practice_playlist')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function removeFromPlaylist(userId: string, playlistItemId: string) {
  const { error } = await supabase
    .from('practice_playlist')
    .delete()
    .eq('id', playlistItemId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function reorderPlaylist(userId: string, itemIds: string[]) {
  // Update sort_order for each item
  const updates = itemIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    await supabase
      .from('practice_playlist')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('user_id', userId);
  }
}

// ============================================================================
// P0-4: Achievement System
// ============================================================================

export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
  // Get user stats
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!stats) return [];

  // Get all achievements
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true);

  if (!allAchievements) return [];

  // Get already earned achievements
  const { data: earnedAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const earnedIds = new Set(earnedAchievements?.map(a => a.achievement_id) || []);
  const newAchievements: Achievement[] = [];

  // Check each achievement
  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue;

    let earned = false;

    switch (achievement.requirement_type) {
      case 'streak_days':
        earned = stats.current_streak >= achievement.requirement_value;
        break;
      case 'total_practices':
        earned = stats.total_checkins >= achievement.requirement_value;
        break;
      case 'total_sentences':
        earned = stats.total_sentences_practiced >= achievement.requirement_value;
        break;
      case 'total_seconds':
        earned = stats.total_practice_seconds >= achievement.requirement_value;
        break;
      case 'playlist_count':
        const { count } = await supabase
          .from('practice_playlist')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        earned = (count || 0) >= achievement.requirement_value;
        break;
    }

    if (earned) {
      // Award achievement
      await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

// ============================================================================
// P0-6: Trending Content
// ============================================================================

export async function recordView(
  userId: string,
  viewData: {
    asset_id?: string;
    video_id: string;
    view_duration_seconds?: number;
    completed?: boolean;
  }
) {
  const { error } = await supabase
    .from('view_history')
    .insert({
      user_id: userId,
      ...viewData,
    });

  if (error) throw error;
}

export async function getTrendingContent(period: 'today' | 'week' | 'month' = 'week'): Promise<TrendingItem[]> {
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  // 获取过去一段时间内的观看记录，并尝试关联视频信息
  const { data, error } = await supabase
    .from('view_history')
    .select(`
      video_id,
      asset_id,
      completed
    `)
    .gte('viewed_at', startDate.toISOString());

  if (error) throw error;

  // 1. 统计观看次数和完成次数
  const videoStats = new Map<string, { views: number; completions: number }>();
  data?.forEach(view => {
    const key = view.video_id || view.asset_id || '';
    if (!key) return;

    const stats = videoStats.get(key) || { views: 0, completions: 0 };
    stats.views += 1;
    if (view.completed) stats.completions += 1;
    videoStats.set(key, stats);
  });

  // 2. 获取前 10 个热门视频的 ID
  const topVideoIds = Array.from(videoStats.entries())
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 10)
    .map(([id]) => id);

  if (topVideoIds.length === 0) return [];

  // 3. 获取这些视频的详细信息（标题、缩略图等）
  // 注意：在实际项目中，这些信息可能存储在 media_assets 或类似表中
  const { data: videoInfos } = await supabase
    .from('media_assets')
    .select('id, title, description')
    .in('id', topVideoIds);

  const videoInfoMap = new Map(videoInfos?.map(v => [v.id, v]) || []);

  // 4. 构建 TrendingItem 对象
  return topVideoIds.map(id => {
    const stats = videoStats.get(id)!;
    const info = videoInfoMap.get(id);

    // 生成一些模拟数据用于演示，如果数据库中没有的话
    return {
      video_id: id,
      asset_id: id,
      video_title: info?.title || `精彩视频 ${id.slice(0, 4)}`,
      video_thumbnail: `https://picsum.photos/seed/${id}/400/225`,
      view_count_today: period === 'today' ? stats.views : Math.floor(stats.views * 0.2),
      view_count_week: period === 'week' ? stats.views : stats.views * 5,
      view_count_month: period === 'month' ? stats.views : stats.views * 20,
      completion_rate: stats.completions / stats.views,
      trend_score: (stats.views * 0.7) + (stats.completions * 0.3), // 简单的评分算法
    };
  });
}

// ============================================================
// Notification Functions (P0-5)
// ============================================================

/**
 * Get recent achievements for notifications
 */
export async function getRecentAchievements(userId: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get streak reminder if user hasn't practiced today
 */
export async function getStreakReminders(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('user_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', today);

  if (error) throw error;

  // If no checkin today, return reminder
  if (!data || data.length === 0) {
    const { data: stats } = await supabase
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    return {
      needsReminder: true,
      currentStreak: stats?.current_streak || 0,
    };
  }

  return { needsReminder: false };
}

/**
 * Mark notification as read (placeholder - extend if you add notifications table)
 */
export async function markNotificationRead(notificationId: string) {
  // If you add a notifications table later, implement this
  // For now, just return success
  return { success: true };
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get user stats summary
 */
export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine for new users
    throw error;
  }

  // 如果没有统计数据，创建初始记录
  if (!data) {
    const { data: newStats, error: insertError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        total_practice_seconds: 0,
        total_sentences_practiced: 0,
        total_videos_completed: 0,
        current_streak: 0,
        longest_streak: 0,
        total_checkins: 0,
        total_xp: 0,
        level: 1,
      })
      .select()
      .single();

    if (insertError) {
      // 如果插入失败（可能并发插入），重新查询
      const { data: retryData } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return retryData || null;
    }

    return newStats;
  }

  return data;
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 60) return '0m';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Request notification permission from the browser
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      ...options,
    });
  }
}

/**
 * Schedule daily reminder (simplified version using setTimeout)
 * For production, consider using Service Workers
 */
export function scheduleDailyReminder(hour: number = 20, minute: number = 0) {
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0
  );

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilReminder = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    showNotification('⏰ 练习提醒', {
      body: '别忘了今天的学习哦！保持连续打卡记录 🔥',
      tag: 'daily-reminder',
      requireInteraction: false,
    });

    scheduleDailyReminder(hour, minute);
  }, timeUntilReminder);
}
