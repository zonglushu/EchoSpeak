/**
 * Custom hook for loading home page data
 *
 * Provides user statistics and recent practice history with proper error handling.
 *
 * @module hooks/home/useHomeData
 */

import { useState, useEffect, useCallback } from 'react';
import { UserStats, PracticeHistory } from '@echospeak/types';
import { getUserStats, getPracticeHistory } from '../../services/p0FeaturesClient';
import { logError, getErrorMessage } from '../../services/errors';

/**
 * Error state for home data loading.
 */
export interface HomeDataError {
  message: string;
  retryable: boolean;
}

/**
 * Return type for useHomeData hook
 */
export interface HomeData {
  userStats: UserStats | null;
  recentPractice: PracticeHistory[];
  isLoading: boolean;
  error: HomeDataError | null;
  retry: () => void;
}

/**
 * Custom hook for loading home page data.
 * Fetches user stats and recent practice history.
 *
 * @param userId - The user ID to fetch data for
 * @returns Home data including stats, practice history, loading state, and error state
 *
 * @example
 * ```tsx
 * const { userStats, recentPractice, isLoading, error, retry } = useHomeData(userId);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} onRetry={retry} />;
 * return <Home data={userStats} practice={recentPractice} />;
 * ```
 */
export function useHomeData(userId: string | undefined): HomeData {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentPractice, setRecentPractice] = useState<PracticeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<HomeDataError | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [stats, history] = await Promise.all([
        getUserStats(userId),
        getPracticeHistory(userId, 5),
      ]);

      setUserStats(stats);
      setRecentPractice(history || []);
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      logError(err, 'useHomeData');
      setError({
        message,
        retryable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    loadData().then(() => {
      // Only update state if still mounted
      if (!isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  return {
    userStats,
    recentPractice,
    isLoading,
    error,
    retry: loadData,
  };
}
