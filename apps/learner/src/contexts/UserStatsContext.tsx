import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthProvider';
import { UserStats } from '@echospeak/types';
import { getUserStats } from '../services/p0FeaturesClient';

interface UserStatsContextType {
  userStats: UserStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined);

export const UserStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setUserStats(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      const stats = await getUserStats(user.id);
      setUserStats(stats);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('[UserStatsContext] Failed to fetch user stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <UserStatsContext.Provider value={{ userStats, isLoading, error, refresh }}>
      {children}
    </UserStatsContext.Provider>
  );
};

export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error('useUserStats must be used within UserStatsProvider');
  }
  return context;
};
