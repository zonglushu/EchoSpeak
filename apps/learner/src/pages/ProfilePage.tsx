import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Trophy, ChevronRight, Bell, HelpCircle, LogOut, Sparkles, ChevronDown, Bug, Target, TrendingUp, Calendar, Award, Settings } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { StreakCounter } from '../components/checkin';
import { CheckinCalendarV2 } from '../components/checkin/CheckinCalendarV2';
import { getUserStats, formatDuration, getUserAchievements, getPracticeHistory } from '../services/p0FeaturesClient';
import { UserStats, UserAchievement } from '@echospeak/types';

interface ProfilePageProps {
  onNavigateToSettings?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToSettings }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
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

  return (
    <div className="min-h-screen bg-teal-50/30 dark:bg-gray-950 pb-24">
      {/* 顶部用户卡片 - 使用 Glassmorphism 设计 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 px-4 pt-8 pb-6">
        {/* 装饰性背景圆形 */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl"></div>

        <div className="relative mx-auto max-w-md space-y-5">
          {/* 用户信息区 */}
          <div className="flex items-center gap-4">
            {/* 头像 */}
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-xl font-bold text-white backdrop-blur-sm transition-transform duration-200 hover:scale-105">
                {(user?.email?.split('@')[0] || 'L')[0].toUpperCase()}
              </div>
              {/* 在线状态 */}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500"></div>
            </div>

            {/* 用户名和等级 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white mb-1.5 truncate">
                {user?.email?.split('@')[0] || '学习者'}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${tierColors[userTier as keyof typeof tierColors]}`}>
                  {userTier === 'premium' && <Award className="h-3 w-3" />}
                  {userTier === 'pro' && <Sparkles className="h-3 w-3" />}
                  {tierLabels[userTier as keyof typeof tierLabels]}
                </span>
              </div>
            </div>
          </div>

          {/* 统计数据卡片 - Glassmorphism */}
          <div className="rounded-2xl border border-white/20 bg-white/90 p-5 shadow-xl backdrop-blur-md dark:bg-gray-900/90">
            {/* 三栏数据 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 transition-transform duration-200 hover:scale-110 cursor-pointer">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {userStats ? formatDuration(userStats.total_practice_seconds) : '0m'}
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">总时长</p>
              </div>
              <div className="text-center border-x border-gray-200 dark:border-gray-700">
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 transition-transform duration-200 hover:scale-110 cursor-pointer">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {userStats?.total_videos_completed || 0}
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">完成视频</p>
              </div>
              <div className="text-center">
                <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 transition-transform duration-200 hover:scale-110 cursor-pointer">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {userStats?.total_sentences_practiced || 0}
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">练习句子</p>
              </div>
            </div>

            {/* 等级进度条 */}
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Lv.{userStats?.level || 1}
                </span>
                <span className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
                  <TrendingUp className="h-4 w-4" />
                  {userStats?.total_xp || 0} XP
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(((userStats?.total_xp || 0) % 1000) / 10, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* 打卡连击 */}
        <section>
          <StreakCounter userId={userId} />
        </section>

        {/* 练习日历 */}
        <section>
          <CheckinCalendarV2 userId={userId} useDemoData={process.env.NODE_ENV === 'development'} />
        </section>

        {/* 学习历史 */}
        {practiceHistory.length > 0 && (
          <section>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="group mb-3 flex w-full items-center justify-between transition-colors hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
            >
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <Calendar className="h-4 w-4" />
                最近练习
              </h3>
              <ChevronDown
                className={`h-5 w-5 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
                  showHistory ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showHistory && (
              <div className="space-y-2.5">
                {practiceHistory.slice(0, 5).map((history) => (
                  <div
                    key={history.id}
                    onClick={() => navigate(`/video/${history.video_id}`)}
                    className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:border-teal-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-teal-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 text-2xl transition-transform duration-200 group-hover:scale-110 dark:from-teal-900/30 dark:to-cyan-900/30">
                        🎬
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
            )}
          </section>
        )}

        {/* 成就徽章 */}
        {achievements.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <Award className="h-4 w-4" />
                成就徽章
              </h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {achievements.length} 枚
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {achievements.slice(0, 6).map((userAchievement) => {
                const achievement = userAchievement.achievement;
                if (!achievement) return null;

                return (
                  <div
                    key={userAchievement.id}
                    className="group cursor-pointer rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 transition-all duration-200 hover:scale-105 hover:shadow-md dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20"
                  >
                    <div className="mb-2 text-center text-3xl transition-transform duration-200 group-hover:scale-110">
                      {achievement.icon_name}
                    </div>
                    <p className="truncate text-center text-xs font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
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
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Settings className="h-4 w-4" />
            设置
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => navigate('/subscription')}
              className="group flex w-full cursor-pointer items-center gap-3.5 border-b border-gray-200 p-4 transition-colors duration-200 hover:bg-teal-50 dark:border-gray-800 dark:hover:bg-teal-900/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 transition-transform duration-200 group-hover:scale-110">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 dark:text-white dark:group-hover:text-teal-400">
                  会员中心
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">升级套餐、查看配额</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-600" />
            </button>

            <button className="group flex w-full cursor-pointer items-center gap-3.5 border-b border-gray-200 p-4 transition-colors duration-200 hover:bg-teal-50 dark:border-gray-800 dark:hover:bg-teal-900/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 transition-transform duration-200 group-hover:scale-110 dark:bg-teal-900/30">
                <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 dark:text-white dark:group-hover:text-teal-400">
                  学习偏好
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">每日目标设置</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-600" />
            </button>

            <button
              onClick={() => navigate('/help')}
              className="group flex w-full cursor-pointer items-center gap-3.5 border-b border-gray-200 p-4 transition-colors duration-200 hover:bg-green-50 dark:border-gray-800 dark:hover:bg-green-900/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 transition-transform duration-200 group-hover:scale-110 dark:bg-green-900/30">
                <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400">
                  帮助中心
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">使用教程、常见问题</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-600" />
            </button>

            <div className="flex w-full items-center gap-3.5 border-b border-gray-200 p-4 dark:border-gray-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">主题模式</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">浅色/深色</p>
              </div>
              <ThemeToggle />
            </div>

            <button
              onClick={handleSignOut}
              className="group flex w-full cursor-pointer items-center gap-3.5 p-4 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 transition-transform duration-200 group-hover:scale-110 dark:bg-red-900/30">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">退出登录</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">登出当前账户</p>
              </div>
              <ChevronRight className="h-5 w-5 text-red-400 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
