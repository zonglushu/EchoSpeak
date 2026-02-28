/**
 * ProgressDashboard - 进度仪表板组件
 *
 * 用于显示用户学习进度和成就：
 * - 跨模式统计
 * - 成就徽章
 * - 连续学习日历
 * - 模式切换历史
 *
 * 特性：
 * - 响应式设计
 * - 动画效果
 * - 数据可视化
 * - 模式适配色彩
 *
 * @module components/ui/ProgressDashboard
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Flame,
  Calendar,
  Trophy,
  BookOpen,
  Swords,
  Lightbulb,
  ArrowRight,
  Waves,
} from 'lucide-react';
import { ProgressBar, CircularProgress } from './Progress';
import type { ModeType } from '../../constants/modeColors';

export interface DashboardStats {
  totalStudyTime: number; // minutes
  streakDays: number;
  chunksCollected: number;
  chunksMastered: number;
  sessionsCompleted: number;
  currentLevel: number;
  xp: number;
  xpToNextLevel: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ModeUsageStats {
  mode: ModeType;
  minutes: number;
  sessions: number;
  percentage: number;
}

export interface ProgressDashboardProps {
  stats: DashboardStats;
  achievements?: Achievement[];
  modeUsage?: ModeUsageStats[];
  onNavigateToMode?: (mode: ModeType) => void;
  onViewAchievements?: () => void;
  className?: string;
  compact?: boolean; // Compact mode: hide duplicates shown elsewhere
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  stats,
  achievements = [],
  modeUsage = [],
  onNavigateToMode,
  onViewAchievements,
  className = '',
  compact = false,
}) => {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards - Hidden in compact mode */}
      {!compact && (
        <div className="grid grid-cols-2 gap-4">
          {/* Study Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">学习时长</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {formatTime(stats.totalStudyTime)}
            </p>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">连续学习</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.streakDays} <span className="text-sm font-normal text-gray-500">天</span>
            </p>
          </motion.div>

          {/* Chunks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">语块收集</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.chunksCollected} <span className="text-sm font-normal text-gray-500">/ {stats.chunksMastered}</span>
            </p>
          </motion.div>

          {/* Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">当前等级</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              Lv.{stats.currentLevel}
            </p>
          </motion.div>
        </div>
      )}

      {/* XP Progress - Hidden in compact mode */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">经验值</h3>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {stats.xp} / {stats.xpToNextLevel} XP
            </span>
          </div>
          <ProgressBar
            value={(stats.xp / stats.xpToNextLevel) * 100}
            size="lg"
            color="success"
          />
        </motion.div>
      )}

      {/* Mode Usage */}
      {modeUsage.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">模式分布</h3>
          <div className="space-y-4">
            {modeUsage.map((usage) => {
              const modeIcons = {
                flow: <Waves className="w-5 h-5" />,
                battle: <Swords className="w-5 h-5" />,
                think: <Lightbulb className="w-5 h-5" />,
              };

              const modeColors = {
                flow: 'text-teal-600 dark:text-teal-400',
                battle: 'text-rose-600 dark:text-rose-400',
                think: 'text-indigo-600 dark:text-indigo-400',
              };

              return (
                <div key={usage.mode} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modeColors[usage.mode]} bg-opacity-10`}>
                    {modeIcons[usage.mode]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {usage.mode}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {usage.percentage}%
                      </span>
                    </div>
                    <ProgressBar value={usage.percentage} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Achievements - Hidden in compact mode */}
      {!compact && achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">成就徽章</h3>
            {onViewAchievements && (
              <button
                onClick={onViewAchievements}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                查看全部
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3">
            {achievements.slice(0, 4).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`
                    w-14 h-14 mx-auto mb-2 rounded-2xl flex items-center justify-center text-2xl
                    ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                    }
                  `}
                >
                  {achievement.icon}
                </div>
                <p
                  className={`text-xs font-medium truncate ${
                    achievement.unlocked
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {achievement.title}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      {onNavigateToMode && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => onNavigateToMode('flow')}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          继续学习
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

/**
 * MiniDashboard - 紧凑型仪表板（用于侧边栏等）
 */
export interface MiniDashboardProps {
  stats: DashboardStats;
  className?: string;
}

export const MiniDashboard: React.FC<MiniDashboardProps> = ({ stats, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">今日进度</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {stats.sessionsCompleted} 次练习
          </span>
        </div>
        <ProgressBar
          value={(stats.xp / stats.xpToNextLevel) * 100}
          size="sm"
          showLabel
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 text-center">
          <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-black text-gray-900 dark:text-white">{stats.streakDays}</p>
          <p className="text-xs text-gray-500">天连续</p>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 text-center">
          <BookOpen className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-black text-gray-900 dark:text-white">{stats.chunksCollected}</p>
          <p className="text-xs text-gray-500">已收集</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
