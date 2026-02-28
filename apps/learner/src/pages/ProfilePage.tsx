import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Trophy, ChevronRight, Bell, HelpCircle, LogOut, Sparkles, ChevronDown, Bug, Target, TrendingUp, Calendar, Award, Settings, PlayCircle, Zap, Shield, Star, Medal, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../components/ThemeToggle';
import { GlobalHeader } from '../components/GlobalHeader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { StreakCounter, CheckinCalendar } from '../components/checkin';
import { getUserStats, formatDuration, getUserAchievements, getPracticeHistory } from '../services/p0FeaturesClient';
import { UserStats, UserAchievement, PracticeHistory } from '@echospeak/types';
import { ProgressDashboard, SettingsPanel } from '../components/ui';
import type { DashboardStats } from '../components/ui/ProgressDashboard';

interface ProfilePageProps {
  onNavigateToSettings?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToSettings }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistory[]>([]);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      Promise.all([
        getUserStats(userId),
        getUserAchievements(userId),
        getPracticeHistory(userId, 30),
      ]).then(([stats, userAchievements, history]) => {
        setUserStats(stats);
        setAchievements(userAchievements);
        setPracticeHistory(history);
        setIsLoading(false);
      }).catch((error) => {
        console.error('Failed to load profile data:', error);
        setIsLoading(false);
      });
    }
  }, [userId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const userTier = user?.user_metadata?.tier || 'free';
  const tierColors = {
    free: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    pro: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    premium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };

  const tierLabels = {
    free: '免费版',
    pro: '专业版',
    premium: '高级版',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-teal-50/30 dark:bg-gray-950 pb-24">
      {/* Global Header - Compact Mode (no back button for profile) */}
      <GlobalHeader
        mode="compact"
        userStats={userStats}
        showBackButton={false}
        showStreak={false}
        showAvatar={false}
        modeTitle="个人中心"
        modeDescription="查看你的学习进度和成就"
      />

      {/* 顶部用户卡片 - 使用 Glassmorphism 设计 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 px-4 pt-10 pb-16">
        {/* 装饰性背景圆形 */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl"></div>

        <div className="relative mx-auto max-w-md">
          {/* 用户信息区 */}
          <div className="flex items-center gap-5 mb-8">
            {/* 头像 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-2xl font-black text-white backdrop-blur-md shadow-2xl">
                {(user?.email?.split('@')[0] || 'L')[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-blue-600 bg-emerald-500 shadow-lg"></div>
            </motion.div>

            {/* 用户名和等级 */}
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-black text-white mb-2 truncate"
              >
                {user?.email?.split('@')[0] || '学习者'}
              </motion.h1>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white backdrop-blur-md border border-white/10`}>
                  {userTier === 'premium' && <Award className="h-3 w-3" />}
                  {userTier === 'pro' && <Sparkles className="h-3 w-3" />}
                  {userTier === 'free' ? 'Free Tier' : tierLabels[userTier as keyof typeof tierLabels]}
                </span>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ rotate: 90 }}
              onClick={() => setShowSettingsPanel(true)}
              className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>

          {/* 统计数据卡片 - Glassmorphism */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
            className="rounded-[2.5rem] border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl dark:bg-gray-900/90 -mb-12"
          >
            {/* 三栏数据 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 shadow-inner">
                  <Clock className="h-7 w-7" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {userStats ? formatDuration(userStats.total_practice_seconds) : '0m'}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Study Time</p>
              </div>
              <div className="text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400 shadow-inner">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {userStats?.total_videos_completed || 0}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Lessons</p>
              </div>
              <div className="text-center">
                <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400 shadow-inner">
                  <Trophy className="h-7 w-7" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {userStats?.total_sentences_practiced || 0}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sentences</p>
              </div>
            </div>

            {/* 等级进度条 */}
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-gray-900 dark:text-white/90 drop-shadow-sm dark:drop-shadow-sm">
                  Lv.{userStats?.level || 1} Novice
                </span>
                <span className="flex items-center gap-1.5 text-sm font-black text-gray-900 dark:text-white/90">
                  <TrendingUp className="h-4 w-4 text-orange-300" />
                  {userStats?.total_xp || 0} XP
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/20 backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((userStats?.total_xp || 0) % 1000) / 10, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 shadow-[0_0_12px_rgba(253,224,71,0.5)]"
                />
              </div>
              <div className="flex justify-end">
                <span className="text-[10px] font-bold text-gray-500 dark:text-white/70 uppercase tracking-widest">
                  Next Level: {(Math.floor((userStats?.total_xp || 0) / 1000) + 1) * 1000} XP
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 主内容区域 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-md space-y-6 px-4 pt-16 pb-24"
      >
        {/* 打卡连击 */}
        <motion.section variants={itemVariants}>
          <StreakCounter userId={userId} />
        </motion.section>

        {/* 综合进度面板 */}
        <motion.section variants={itemVariants}>
          <ProgressDashboard
            stats={{
              totalStudyTime: Math.floor((userStats?.total_practice_seconds || 0) / 60),
              streakDays: userStats?.current_streak || 0,
              chunksCollected: userStats?.total_sentences_practiced || 0,
              chunksMastered: Math.floor((userStats?.total_sentences_practiced || 0) * 0.7),
              sessionsCompleted: userStats?.total_videos_completed || 0,
              currentLevel: userStats?.level || 1,
              xp: userStats?.total_xp || 0,
              xpToNextLevel: ((Math.floor((userStats?.total_xp || 0) / 1000) + 1) * 1000) - (userStats?.total_xp || 0),
            }}
            modeUsage={[
              { mode: 'flow', minutes: 45, sessions: 5, percentage: 45 },
              { mode: 'battle', minutes: 35, sessions: 3, percentage: 35 },
              { mode: 'think', minutes: 20, sessions: 2, percentage: 20 },
            ]}
            achievements={achievements.map(a => ({
              id: a.id,
              title: a.achievement?.name || 'Achievement',
              description: a.achievement?.description || '',
              icon: '🏆',
              unlocked: true,
              unlockedAt: a.unlocked_at || new Date().toISOString(),
            }))}
            compact={true}
          />
        </motion.section>

        {/* 练习日历 */}
        <motion.section variants={itemVariants}>
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                <Calendar className="h-4 w-4 text-teal-500/30" />
                Learning Activity
              </h3>
              <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full text-[9px] font-bold text-gray-400 uppercase tracking-wider border border-gray-100 dark:border-gray-700">
                Last 3 Months
              </span>
            </div>
            <CheckinCalendar userId={userId} useDemoData={process.env.NODE_ENV === 'development'} />
          </div>
        </motion.section>

        {/* 学习历史 */}
        {practiceHistory.length > 0 && (
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <Calendar className="h-4 w-4" />
              最近练习
            </h3>

            <div className="space-y-2.5">
              {practiceHistory.slice(0, 5).map((history) => (
                <div
                  key={history.id}
                  onClick={() => navigate(`/video/${history.video_id}`)}
                  className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-teal-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white transition-transform duration-200 group-hover:scale-110 shadow-lg shadow-teal-500/20">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-teal-600 dark:text-white dark:group-hover:text-teal-400">
                        {history.video_title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(history.duration_seconds)} · {history.sentences_completed}/{history.sentences_total} 句
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {Math.round(history.progress_percentage)}%
                      </div>
                      <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 成就徽章 */}
        {achievements.length > 0 && (
          <motion.section variants={itemVariants}>
            <div className="mb-4 flex items-center justify-between px-1">
              <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                <Award className="h-4 w-4 text-orange-500" />
                我的勋章墙
              </h3>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 uppercase">
                {achievements.length} Badges
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {achievements.slice(0, 6).map((userAchievement) => {
                const achievement = userAchievement.achievement;
                if (!achievement) return null;

                return (
                  <motion.div
                    key={userAchievement.id}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="group cursor-pointer rounded-3xl border border-gray-100 bg-white p-4 transition-all shadow-lg hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-3 flex justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                        <Medal className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="truncate text-center text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                      {achievement.name}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* 开发者调试工具 */}
        {process.env.NODE_ENV === 'development' && (
          <section>
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Bug className="w-4 h-4" />
                开发者工具
              </h3>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showDevTools ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {showDevTools && (
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-4 border-2 border-cyan-300 dark:border-cyan-700 space-y-3">
                <p className="text-xs font-bold text-cyan-900 dark:text-cyan-100">
                  🛠️ 开发者调试工具
                </p>
                <p className="text-[10px] text-cyan-700 dark:text-cyan-300 mb-3">
                  查看当前用户状态和统计数据
                </p>

                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <p className="text-[10px] text-cyan-800 dark:text-cyan-200 leading-relaxed">
                    User ID: {userId}<br />
                    Total XP: {userStats?.total_xp || 0}<br />
                    Level: {userStats?.level || 1}<br />
                    Current Streak: {userStats?.current_streak || 0}<br />
                    Longest Streak: {userStats?.longest_streak || 0}<br />
                    Achievements: {achievements.length}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 设置菜单 */}
        <section className="space-y-4">
          <h3 className="px-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            {t('profile.settings')}
          </h3>

          <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => navigate('/subscription')}
              className="group flex w-full cursor-pointer items-center gap-5 border-b border-gray-50 p-6 transition-colors duration-200 hover:bg-teal-50/50 dark:border-gray-800 dark:hover:bg-teal-900/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-500 dark:bg-teal-900/30 transition-transform duration-200 group-hover:scale-110">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">{t('profile.membership')}</p>
                <p className="text-xs font-medium text-gray-400">{t('profile.membershipDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => setShowSettingsPanel(true)}
              className="group flex w-full cursor-pointer items-center gap-5 border-b border-gray-50 p-6 transition-colors duration-200 hover:bg-indigo-50/50 dark:border-gray-800 dark:hover:bg-indigo-900/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 transition-transform duration-200 group-hover:scale-110">
                <Settings className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">{t('profile.preferences')}</p>
                <p className="text-xs font-medium text-gray-400">{t('profile.preferencesDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <div className="flex w-full items-center gap-5 border-b border-gray-50 p-6 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-900/30">
                <Star className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">{t('profile.appearance')}</p>
                <p className="text-xs font-medium text-gray-400">{t('profile.appearanceDesc')}</p>
              </div>
              <ThemeToggle />
            </div>

            {/* Language Switcher */}
            <div className="flex w-full items-center gap-5 border-b border-gray-50 p-6 dark:border-gray-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-pink-900/30">
                <Languages className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">{t('profile.language')}</p>
                <p className="text-xs font-medium text-gray-400">{t('profile.languageDesc')}</p>
              </div>
              <button
                onClick={() => i18n.changeLanguage(i18n.language.startsWith('en') ? 'zh' : 'en')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                style={{ minWidth: '80px' }}
              >
                {i18n.language.startsWith('en') ? 'English' : '中文'}
              </button>
            </div>

            <button
              onClick={() => navigate('/help')}
              className="group flex w-full cursor-pointer items-center gap-5 p-6 transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-900/30 transition-transform duration-200 group-hover:scale-110">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">{t('profile.help')}</p>
                <p className="text-xs font-medium text-gray-400">{t('profile.helpDesc')}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* 退出登录按钮 */}
        <motion.div variants={itemVariants} className="pt-4 text-center">
          <button
            onClick={handleSignOut}
            className="group inline-flex items-center gap-2 px-10 py-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 font-black rounded-3xl transition-all active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            {t('profile.logout')}
          </button>
          <p className="mt-8 text-[11px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">
            {t('profile.version')} 2.4.0
          </p>
        </motion.div>
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
      />
    </div>
  );
};

export default ProfilePage;
