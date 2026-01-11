/**
 * P0-4: Achievement Badges System
 * Displays earned and locked achievements with celebration animations
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Lock, Award } from 'lucide-react';
import { getAchievements, getUserAchievements, getUserStats } from '../../services/p0FeaturesClient';
import { Achievement, UserAchievement } from '@echospeak/types';

interface AchievementBadgesProps {
  userId?: string;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ userId }) => {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [achievements, userAch] = await Promise.all([
        getAchievements(),
        getUserAchievements(userId),
      ]);

      setAllAchievements(achievements);
      setUserAchievements(userAch);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common':
        return 'bg-slate-600 border-slate-500';
      case 'rare':
        return 'bg-blue-600/80 border-blue-500';
      case 'epic':
        return 'bg-purple-600/80 border-purple-500';
      case 'legendary':
        return 'bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-400';
      default:
        return 'bg-slate-600 border-slate-500';
    }
  };

  const getRarityGlow = (rarity: string): string => {
    switch (rarity) {
      case 'rare':
        return 'shadow-blue-500/20';
      case 'epic':
        return 'shadow-purple-500/20';
      case 'legendary':
        return 'shadow-yellow-500/30';
      default:
        return '';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'streak':
        return '🔥';
      case 'practice':
        return '📚';
      case 'sentences':
        return '💬';
      case 'time':
        return '⏱️';
      case 'playlist':
        return '⭐';
      default:
        return '🏆';
    }
  };

  const categories = ['all', ...Array.from(new Set(allAchievements.map((a) => a.category)))];

  const filteredAchievements =
    selectedCategory === 'all'
      ? allAchievements
      : allAchievements.filter((a) => a.category === selectedCategory);

  const earnedAchievementIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const earnedCount = earnedAchievementIds.size;
  const totalCount = allAchievements.length;
  const progressPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="h-64 bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Achievements
          </h3>
          <div className="text-sm text-slate-400">
            {earnedCount}/{totalCount} unlocked
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {category === 'all' ? 'All' : getCategoryIcon(category) + ' ' + category}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredAchievements.map((achievement) => {
          const isEarned = earnedAchievementIds.has(achievement.id);
          const userAch = userAchievements.find((ua) => ua.achievement_id === achievement.id);

          return (
            <div
              key={achievement.id}
              className={`relative rounded-xl p-4 border-2 transition-all ${
                isEarned
                  ? `${getRarityColor(achievement.rarity)} ${getRarityGlow(achievement.rarity)} shadow-lg`
                  : 'bg-slate-900/50 border-slate-700 opacity-60'
              }`}
              title={achievement.description}
            >
              {/* Icon */}
              <div className="text-3xl mb-2">{achievement.icon_name}</div>

              {/* Name */}
              <div className={`text-sm font-bold mb-1 ${isEarned ? 'text-white' : 'text-slate-400'}`}>
                {achievement.name}
              </div>

              {/* Description */}
              <div className="text-xs text-slate-400 line-clamp-2 mb-2">
                {achievement.description}
              </div>

              {/* XP Reward */}
              {isEarned && achievement.xp_reward > 0 && (
                <div className="text-xs text-yellow-400 font-bold">
                  +{achievement.xp_reward} XP
                </div>
              )}

              {/* Lock Icon */}
              {!isEarned && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
              )}

              {/* Earned Date */}
              {isEarned && userAch && (
                <div className="text-xs text-slate-400 mt-2">
                  {new Date(userAch.earned_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Celebration Modal */}
      {showCelebration && newlyUnlocked.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 border border-yellow-500/30 max-w-md w-full animate-bounce">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-black text-white mb-2">Achievement Unlocked!</h3>

              {newlyUnlocked.map((achievement) => (
                <div key={achievement.id} className="mb-4">
                  <div className="text-4xl mb-2">{achievement.icon_name}</div>
                  <div className="text-lg font-bold text-white">{achievement.name}</div>
                  <div className="text-sm text-slate-300">{achievement.description}</div>
                  {achievement.xp_reward > 0 && (
                    <div className="text-sm text-yellow-400 font-bold mt-2">
                      +{achievement.xp_reward} XP
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  setShowCelebration(false);
                  setNewlyUnlocked([]);
                }}
                className="w-full mt-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{earnedCount}</div>
          <div className="text-xs text-slate-400">Earned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {allAchievements.reduce((sum, a) => sum + (earnedAchievementIds.has(a.id) ? a.xp_reward : 0), 0)}
          </div>
          <div className="text-xs text-slate-400">Total XP</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {userAchievements.filter((ua) => ua.achievement?.rarity === 'legendary').length}
          </div>
          <div className="text-xs text-slate-400">Legendary</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadges;
