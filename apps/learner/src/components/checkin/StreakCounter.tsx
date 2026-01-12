/**
 * P0-1: Daily Check-in System - Streak Counter Component
 * Displays consecutive practice days with fire animation
 */

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getUserCheckins, recordCheckin, formatDuration } from '../../services/p0FeaturesClient';
import { useTranslation } from 'react-i18next';
import { UserCheckin } from '@echospeak/types';

interface StreakCounterProps {
  userId?: string;
  onCheckin?: (checkin: UserCheckin) => void;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({ userId, onCheckin }) => {
  const { t } = useTranslation();
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
    <div className="bg-[#FFF1E6]/50 dark:bg-orange-900/10 backdrop-blur-sm rounded-[2.5rem] p-6 border-2 border-[#FFE8D6] dark:border-orange-800/20 shadow-sm relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-400/5 rounded-full blur-2xl group-hover:bg-orange-400/10 transition-colors"></div>

      <div className="flex items-center justify-between gap-4">
        {/* Streak Display */}
        <div className="flex items-center gap-4">
          <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <Flame
                className={`w-10 h-10 ${currentStreak > 0
                  ? 'text-orange-600 dark:text-orange-500'
                  : 'text-orange-400 dark:text-orange-400'
                  }`}
                fill={currentStreak > 0 ? 'currentColor' : 'none'}
              />
            </div>
            {isAnimating && (
              <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl animate-ping" />
            )}
          </div>
          <div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{currentStreak}</span>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('streak.dayStreak')}</span>
              </div>
              <div className="text-sm font-semibold text-orange-600/80 dark:text-orange-400/80 mt-1">
                {hasCheckedInToday ? t('streak.keepItUp') : t('streak.startHabit')}
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Button / Status */}
        <div className="flex-shrink-0">
          {!hasCheckedInToday ? (
            <button
              onClick={handleCheckin}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FF6B4B] to-[#FF4D4D] hover:from-[#FF7B5B] hover:to-[#FF5D5D] text-white font-black rounded-3xl transition-all active:scale-95 shadow-xl shadow-orange-500/20 text-sm group/btn"
            >
              {t('streak.checkIn')}
              <span className="inline-block transition-transform group-hover/btn:translate-x-1">→</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-black rounded-3xl border-2 border-orange-500/20 text-sm">
              ✓ {t('streak.done')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreakCounter;
