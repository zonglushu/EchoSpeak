/**
 * P0-1: Compact Streak Counter Component
 * Lightweight inline display for use in headers and navigation
 * Supports i18n and provides minimal UI for streak visualization
 */

import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { getUserCheckins, recordCheckin } from '../../services/p0FeaturesClient';
import { UserCheckin } from '@echospeak/types';
import { useTranslation } from 'react-i18next';

interface StreakCounterCompactProps {
  userId?: string;
  onCheckin?: (checkin: UserCheckin) => void;
}

export const StreakCounterCompact: React.FC<StreakCounterCompactProps> = ({
  userId,
  onCheckin
}) => {
  const { t } = useTranslation();
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;
    loadTodayCheckin();
  }, [userId]);

  function loadTodayCheckin() {
    if (!userId) return;

    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];

    getUserCheckins(userId, 1)
      .then((checkins) => {
        if (checkins.length > 0 && checkins[0].checkin_date === today) {
          setHasCheckedInToday(true);
          setCurrentStreak(checkins[0].streak_count);
        } else {
          return getUserCheckins(userId, 2);
        }
      })
      .then((checkins) => {
        if (checkins && checkins.length > 0) {
          setCurrentStreak(checkins[0].streak_count);
        }
      })
      .catch((error) => {
        console.error('Failed to load check-in data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleCheckin() {
    if (!userId || hasCheckedInToday) return;

    setIsAnimating(true);

    recordCheckin(userId, 0, 0)
      .then((checkin) => {
        setCurrentStreak(checkin.streak_count);
        setHasCheckedInToday(true);

        setTimeout(() => setIsAnimating(false), 1000);
        onCheckin?.(checkin);
      })
      .catch((error) => {
        console.error('Check-in failed:', error);
        setIsAnimating(false);
      });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-full" />
        <div className="w-12 h-3 bg-gray-300 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${
        hasCheckedInToday
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30'
      } rounded-full pr-1 transition-all ${isAnimating ? 'scale-105' : ''}`}
    >
      {/* Flame icon */}
      <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
        <Flame
          className={`w-4 h-4 ${
            currentStreak > 0
              ? currentStreak >= 7
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-400 dark:text-gray-600'
          }`}
          fill={currentStreak > 0 ? 'currentColor' : 'none'}
        />
      </div>

      {/* Streak count */}
      {currentStreak > 0 && (
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {currentStreak}{t('common.days')}
        </span>
      )}

      {/* Check-in button */}
      {!hasCheckedInToday ? (
        <button
          onClick={handleCheckin}
          className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-md"
        >
          {t('streak.checkIn')}
        </button>
      ) : (
        <span className="px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
          {t('streak.done')}
        </span>
      )}
    </div>
  );
};

export default StreakCounterCompact;
