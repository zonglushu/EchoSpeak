import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { TrendingUp, Eye, Flame, ThumbsUp, ChevronRight } from 'lucide-react';
import { getTrendingContent, recordView } from '../../services/p0FeaturesClient';
import { TrendingItem } from '@echospeak/types';

interface TrendingLeaderboardProps {
  userId?: string;
  onSelectVideo?: (videoId: string) => void;
  period?: 'today' | 'week' | 'month';
  layout?: 'horizontal' | 'vertical';
  hideHeader?: boolean;
}

export const TrendingLeaderboard: React.FC<TrendingLeaderboardProps> = ({
  userId,
  onSelectVideo,
  period = 'week',
  layout = 'horizontal',
  hideHeader = false
}) => {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<typeof period>(period);

  useEffect(() => {
    loadTrendingContent();
  }, [selectedPeriod]);

  const loadTrendingContent = useCallback(async function loadTrendingItems() {
    setIsLoading(true);
    try {
      const items = await getTrendingContent(selectedPeriod);
      setTrendingItems(items);
    } catch (error) {
      console.error('Failed to load trending content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  const handleSelectVideo = useCallback(async function selectVideo(item: TrendingItem) {
    const videoId = (item.asset_id || item.video_id) as string;
    if (!videoId) return;

    if (userId) {
      try {
        if (item.asset_id || item.video_id) {
          await recordView(userId, {
            asset_id: item.asset_id as string,
            video_id: item.video_id as string,
          });
        }
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    }

    onSelectVideo?.(videoId);
  }, [userId, onSelectVideo]);

  const getRankIcon = useCallback(function getRankIconForCard(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  }, []);

  const getCardBg = useCallback(function getCardBackground(rank: number): string {
    switch (rank) {
      case 1:
        return 'bg-[#FFFBEB] dark:bg-yellow-900/10 border-[#FEF3C7] dark:border-yellow-800/50 shadow-sm';
      case 2:
        return 'bg-[#F0F9FF] dark:bg-blue-900/10 border-[#E0F2FE] dark:border-blue-800/50 shadow-sm';
      case 3:
        return 'bg-[#FDF2F8] dark:bg-pink-900/10 border-[#FCE7F3] dark:border-pink-800/50 shadow-sm';
      default:
        return 'bg-white dark:bg-slate-900/50 border-gray-100 dark:border-white/5 shadow-sm';
    }
  }, []);

  return (
    <div className="py-4">
      {/* 顶部标题和选择器 */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-black text-[#1E293B] dark:text-white tracking-tight">
              Trending Now
            </h3>
          </div>

          {/* 时间切换器 - 药丸风格 */}
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-full">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${selectedPeriod === p
                  ? 'bg-white dark:bg-slate-700 text-[#1E293B] dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                {p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 横向滚动列表 */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-72 h-44 bg-gray-100 dark:bg-slate-800/50 rounded-3xl animate-pulse border border-gray-200 dark:border-white/5"
            />
          ))
        ) : trendingItems.length === 0 ? (
          <div className="w-full text-center py-10 bg-gray-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-500 dark:text-slate-500 font-bold">暂无热门内容</p>
          </div>
        ) : (
          trendingItems.map((item, index) => (
            <div
              key={item.asset_id || item.video_id || index}
              className={`flex-shrink-0 w-[280px] snap-start relative rounded-[32px] p-6 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${getCardBg(index + 1)}`}
            >
              {/* HOT 标签 */}
              {(index < 3 || item.trend_score > 5) && (
                <div className="absolute top-4 right-4 bg-[#F97316] text-white px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg shadow-orange-500/20">
                  <Flame className="w-3 h-3 fill-current" />
                  HOT
                </div>
              )}

              <div className="flex flex-col h-full">
                {/* 顶部：名次图标和标题 */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl shadow-sm border border-gray-100 dark:border-white/5">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-lg font-black text-[#1E293B] dark:text-white leading-tight line-clamp-1">
                      {item.video_title}
                    </h4>
                    {/* 统计数据 */}
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold leading-none">
                          {(() => {
                            const count = selectedPeriod === 'week' ? item.view_count_week : item.view_count_month;
                            return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count || 0;
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold leading-none">
                          {Math.round(item.trend_score * 5) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部按钮 */}
                <button
                  onClick={() => handleSelectVideo(item)}
                  className="mt-2 w-full bg-[#0EA5E9] hover:bg-[#0284C7] active:bg-[#0369A1] text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group"
                >
                  Practice Now
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrendingLeaderboard;

