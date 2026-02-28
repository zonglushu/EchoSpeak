import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthProvider';
import { DailyGoals } from '../components/DailyGoals';
import {
  LearningModeCards,
  LearningBanner,
  CategoryGrid,
  TrendingSection,
  GlobalHeader,
  FlowModeSection,
  BattleModeSection,
  ThinkModeSection,
} from '../components/home';
import { useHomeData } from '../hooks/home/useHomeData';
import { DEFAULT_DAILY_GOALS, type DailyGoal, RECOMMENDED_VIDEOS } from '../constants/homeConstants';
import { containerVariants, itemVariants } from '../utils/homeHelpers';
import { getAllModeRecommendations } from '../services/recommendationService';

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
 * - Quick start mode cards (Flow, Battle, Think) - ENHANCED
 * - Continue learning / Get started banner
 * - Mode-specific content recommendations (NEW)
 * - Trending content section (simplified)
 * - Category grid (horizontal scroll)
 */
export function HomePage({ onNavigateToVideo, userLevel = 'intermediate' }: HomePageProps): React.JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const { userStats, recentPractice, isLoading, error: homeError } = useHomeData(userId);

  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(DEFAULT_DAILY_GOALS);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);

  // Get mode-specific recommendations
  const modeRecommendations = getAllModeRecommendations(RECOMMENDED_VIDEOS);

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

  // Browse Mode (default) content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Global Header - Full Mode */}
      <GlobalHeader
        mode="full"
        userStats={userStats}
        showNotification={true}
      />

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

        {/* Mode-Specific Recommendations (NEW) */}
        <motion.div variants={itemVariants}>
          <FlowModeSection
            videos={modeRecommendations.flow}
            onNavigate={() => {/* Handle navigation analytics if needed */}}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <BattleModeSection
            videos={modeRecommendations.battle}
            onNavigate={() => {/* Handle navigation analytics if needed */}}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ThinkModeSection
            videos={modeRecommendations.think}
            onNavigate={() => {/* Handle navigation analytics if needed */}}
          />
        </motion.div>

        {/* Discovery Section (simplified) */}
        <motion.div variants={itemVariants}>
          <TrendingSection userId={userId} onSelectVideo={handleVideoClick} />
        </motion.div>

        {/* Category Grid */}
        <motion.div variants={itemVariants}>
          <CategoryGrid userId={userId} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default HomePage;
