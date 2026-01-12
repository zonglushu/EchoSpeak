/**
 * P0-1: Daily Check-in System - Streak Counter Component
 * Displays consecutive practice days with fire animation
 */

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getUserCheckins, recordCheckin, formatDuration } from '../../services/p0FeaturesClient';
import { UserCheckin } from '@echospeak/types';

interface StreakCounterProps {
  userId?: string;
  onCheckin?: (checkin: UserCheckin) => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ userId, onCheckin }) => {
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [totalCheckins, setTotalCheckins] = useState<number>(0);
  const [todayPracticeDuration, setTodayPracticeDuration] = useState<number>(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;
    loadTodayCheckin();
  }, [userId]);

  const loadTodayCheckin = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const checkins = await getUserCheckins(userId, 1);
      const today = new Date().toISOString().split('T')[0];

      if (checkins.length > 0 && checkins[0].checkin_date === today) {
        setHasCheckedInToday(true);
        setCurrentStreak(checkins[0].streak_count);
        setTotalCheckins(checkins[0].total_checkins);
        setTodayPracticeDuration(checkins[0].practice_duration_seconds);
      } else {
        // Get yesterday's streak if exists
        const allCheckins = await getUserCheckins(userId, 2);
        if (allCheckins.length > 0) {
          setCurrentStreak(allCheckins[0].streak_count);
          setTotalCheckins(allCheckins[0].total_checkins);
        }
        setHasCheckedInToday(false);
      }
    } catch (error) {
      console.error('Failed to load check-in data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!userId || hasCheckedInToday) return;

    try {
      setIsAnimating(true);
      const checkin = await recordCheckin(userId, 0, 0); // Initial check-in, practice data updated later

      setCurrentStreak(checkin.streak_count);
      setTotalCheckins(checkin.total_checkins);
      setHasCheckedInToday(true);

      // Trigger animation
      setTimeout(() => setIsAnimating(false), 1000);

      onCheckin?.(checkin);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-pulse">
        <div className="h-12 bg-slate-700/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800/50 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Streak Display */}
        <div className="flex items-center gap-4">
          <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
            <Flame
              className={`w-12 h-12 ${
                currentStreak > 0
                  ? currentStreak >= 30
                    ? 'text-cyan-600 dark:text-purple-500'
                    : currentStreak >= 7
                    ? 'text-orange-600 dark:text-orange-500'
                    : 'text-yellow-600 dark:text-yellow-500'
                  : 'text-gray-400 dark:text-gray-600'
              }`}
              fill={currentStreak > 0 ? 'currentColor' : 'none'}
            />
            {isAnimating && (
              <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl animate-ping" />
            )}
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 dark:text-white">{currentStreak}</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">天连续打卡</div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
            共 {totalCheckins} 次打卡
          </div>
          {todayPracticeDuration > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              今日练习 {formatDuration(todayPracticeDuration)}
            </div>
          )}
        </div>

        {/* Check-in Button */}
        {!hasCheckedInToday && (
          <button
            onClick={handleCheckin}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/30 text-lg"
          >
            立即打卡
          </button>
        )}

        {hasCheckedInToday && (
          <div className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-xl border-2 border-green-500/50 text-lg">
            ✓ 已打卡
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakCounter;
