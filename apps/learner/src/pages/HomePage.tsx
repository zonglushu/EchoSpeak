import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthProvider';
import { DailyGoals } from '../components/DailyGoals';
import { FloatingPathToggle } from '../components/navigation/FloatingPathToggle';
import {
  WelcomeHeader,
  LearningModeCards,
  LearningBanner,
  RecommendedVideos,
  CategoryGrid,
  TrendingSection,
} from '../components/home';
import { useHomeData } from '../hooks/home/useHomeData';
import { DEFAULT_DAILY_GOALS, type DailyGoal } from '../constants/homeConstants';
import { containerVariants, itemVariants } from '../utils/homeHelpers';

interface HomePageProps {
  onNavigateToVideo?: (videoId: string) => void;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * HomePage - Main landing page for the learner app
 *
 * Displays:
 * - Welcome header with user stats and streak
 * - Daily goals tracker
 * - Quick start mode cards (Flow, Battle, Think)
 * - Continue learning / Get started banner
 * - Trending content section
 * - Recommended videos
 * - Category grid
 */
export function HomePage({ onNavigateToVideo, userLevel = 'intermediate' }: HomePageProps): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id;

  const { userStats, recentPractice, isLoading, error: homeError } = useHomeData(userId);

  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(DEFAULT_DAILY_GOALS);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);

  // Get current path mode from URL
  const pathMode = searchParams.get('path') || 'browse';

  const handleGoalToggle = useCallback((goalId: string) => {
    setDailyGoals((goals) =>
      goals.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g)),
    );
  }, []);

  const handleCheckin = useCallback(() => {
    setTodayCheckedIn(true);
  }, []);

  const handleVideoClick = useCallback(
    (videoId: string) => {
      if (onNavigateToVideo) {
        onNavigateToVideo(videoId);
      } else {
        navigate(`/video/${videoId}`);
      }
    },
    [onNavigateToVideo, navigate],
  );

  const handleViewAllRecommended = useCallback(() => {
    navigate('/learn');
  }, [navigate]);

  // By Mode Mode content
  if (pathMode === 'bymode') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/?path=browse')}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              aria-label="返回浏览"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-black text-gray-900 dark:text-white">选择模式</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">根据你的学习目标选择模式</p>
            </div>
          </div>
        </div>

        {/* Mode Cards */}
        <div className="p-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mode/flow')}
            className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border-2 border-teal-200 dark:border-teal-800 cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="text-6xl mb-4">🌊</div>
            <h2 className="text-2xl font-black text-teal-700 dark:text-teal-400 mb-2">
              Flow 模式
            </h2>
            <p className="text-teal-600 dark:text-teal-500 font-medium mb-4">
              伴随输入 • 轻量跟读
            </p>
            <div className="space-y-2 text-sm text-teal-700 dark:text-teal-400 mb-6">
              <p>✓ 适合：晨间通勤、家务时间</p>
              <p>✓ 时长：10-20 分钟</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-teal-600 dark:text-teal-400">
              浏览 Flow 视频库
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mode/battle')}
            className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-3xl p-8 border-2 border-rose-200 dark:border-rose-800 cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="text-6xl mb-4">⚔️</div>
            <h2 className="text-2xl font-black text-rose-700 dark:text-rose-400 mb-2">
              Battle 模式
            </h2>
            <p className="text-rose-600 dark:text-rose-500 font-medium mb-4">
              实战练习 • 角色扮演
            </p>
            <div className="space-y-2 text-sm text-rose-700 dark:text-rose-400 mb-6">
              <p>✓ 适合：晚间专注、周末学习</p>
              <p>✓ 时长：20-40 分钟</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
              开始 Battle 挑战
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mode/think')}
            className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border-2 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="text-6xl mb-4">💡</div>
            <h2 className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mb-2">
              Think 模式
            </h2>
            <p className="text-indigo-600 dark:text-indigo-500 font-medium mb-4">
              思维内化 • 逻辑重构
            </p>
            <div className="space-y-2 text-sm text-indigo-700 dark:text-indigo-400 mb-6">
              <p>✓ 适合：睡前复盘、复习总结</p>
              <p>✓ 时长：5-15 分钟</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
              进入 Think 笔记
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Browse Mode (default) content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Welcome Header */}
      <WelcomeHeader userStats={userStats} />

      <motion.div
        className="p-6 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Daily Goals */}
        <motion.div variants={itemVariants}>
          <DailyGoals goals={dailyGoals} onGoalToggle={handleGoalToggle} />
        </motion.div>

        {/* Learning Mode Cards */}
        <motion.div variants={itemVariants}>
          <LearningModeCards />
        </motion.div>

        {/* Learning Banner */}
        <motion.div variants={itemVariants}>
          <LearningBanner recentPractice={recentPractice} isLoading={isLoading} />
        </motion.div>

        {/* Trending Section */}
        <motion.div variants={itemVariants}>
          <TrendingSection userId={userId} onSelectVideo={handleVideoClick} />
        </motion.div>

        {/* Recommended Videos */}
        <motion.div variants={itemVariants}>
          <RecommendedVideos
            onNavigateToVideo={handleVideoClick}
            onViewAll={handleViewAllRecommended}
          />
        </motion.div>

        {/* Category Grid */}
        <motion.div variants={itemVariants}>
          <CategoryGrid userId={userId} />
        </motion.div>
      </motion.div>

      {/* 🎯 Floating Path Toggle */}
      <FloatingPathToggle />
    </div>
  );
}

export default HomePage;
