/**
 * P0-6: Trending / Hot Content Leaderboard
 * Shows most popular content based on views and engagement
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, Eye, Users, Award, Flame } from 'lucide-react';
import { getTrendingContent, recordView } from '../../services/p0FeaturesClient';
import { TrendingItem } from '@echospeak/types';

interface TrendingLeaderboardProps {
  userId?: string;
  onSelectVideo?: (videoId: string) => void;
  period?: 'today' | 'week' | 'month';
}

export const TrendingLeaderboard: React.FC<TrendingLeaderboardProps> = ({
  userId,
  onSelectVideo,
  period = 'week'
}) => {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<typeof period>(period);

  useEffect(() => {
    loadTrendingContent();
  }, [selectedPeriod]);

  const loadTrendingContent = async () => {
    setIsLoading(true);
    try {
      const items = await getTrendingContent(selectedPeriod);
      setTrendingItems(items);
    } catch (error) {
      console.error('Failed to load trending content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVideo = async (item: TrendingItem) => {
    const videoId = item.asset_id || item.video_id;
    if (!videoId) return;

    // Record view
    if (userId) {
      try {
        await recordView(userId, {
          asset_id: item.asset_id,
          video_id: item.video_id,
        });
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    }

    onSelectVideo?.(videoId);
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-700/50';
      case 2:
        return 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-600/50';
      case 3:
        return 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700/50';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
    }
  };

  const getPeriodLabel = (p: typeof selectedPeriod): string => {
    switch (p) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Trending Now
          </h3>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${selectedPeriod === p
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Most popular content {getPeriodLabel(selectedPeriod).toLowerCase()}
        </p>
      </div>

      {/* Trending List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-200 dark:border-white/5 animate-pulse"
            >
              <div className="h-4 bg-gray-300 dark:bg-slate-700/50 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-300 dark:bg-slate-700/50 rounded w-1/2" />
            </div>
          ))
        ) : trendingItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-full">
                <TrendingUp className="w-8 h-8 text-gray-400 dark:text-slate-600" />
              </div>
            </div>
            <div className="text-gray-500 dark:text-slate-500 mb-2">No trending content yet</div>
            <div className="text-sm text-gray-600 dark:text-slate-600">
              Be the first to practice and start the trend!
            </div>
          </div>
        ) : (
          trendingItems.map((item, index) => (
            <div
              key={item.asset_id || item.video_id || index}
              onClick={() => handleSelectVideo(item)}
              className={`relative rounded-xl p-4 border-2 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl ${index < 3
                  ? `bg-gradient-to-br ${getRankColor(index + 1)}`
                  : getRankColor(index + 1)
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-12 h-12 text-2xl font-black flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {item.video_title}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-slate-400">
                    {/* Views */}
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>
                        {(() => {
                          const viewCount = selectedPeriod === 'today'
                            ? item.view_count_today
                            : selectedPeriod === 'week'
                              ? item.view_count_week
                              : item.view_count_month;
                          return isNaN(viewCount) || viewCount === null || viewCount === undefined ? 0 : viewCount;
                        })()}
                      </span>
                    </div>

                    {/* Completion Rate */}
                    {item.completion_rate > 0 && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>{Math.round(item.completion_rate * 100)}% complete</span>
                      </div>
                    )}

                    {/* Trend Score */}
                    <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                      <Flame className="w-3 h-3" />
                      <span>{isNaN(item.trend_score) ? 0 : Math.round(item.trend_score)}</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-all active:scale-95 text-sm flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectVideo(item);
                  }}
                >
                  Practice
                </button>
              </div>

              {/* Trend Badge for Top 3 */}
              {index < 3 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full">
                  <Flame className="w-3 h-3 inline mr-1" />
                  Hot
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* View More */}
      {!isLoading && trendingItems.length > 0 && (
        <button
          onClick={() => {
            console.log('View all trending clicked');
          }}
          className="w-full mt-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          View all trending content →
        </button>
      )}

      {/* Tips */}
      {trendingItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending is based on views and completion rates
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingLeaderboard;
