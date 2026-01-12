import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { StreakCounter, CheckinCalendar } from '../components/checkin';
import { getUserStats, formatDuration } from '../services/p0FeaturesClient';
import { BarChart3, Flame, Clock, Target, Trophy, ArrowRight } from 'lucide-react';
import { UserStats } from '@echospeak/types';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getUserStats(userId).then((stats) => {
        setUserStats(stats);
        setLoading(false);
      });
    }
  }, [userId]);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg">{t('dashboard.loginMessage')}</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('dashboard.loginBtn')}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const hasStreak = (userStats?.current_streak || 0) > 0;
  const daysSinceLastPractice = userStats?.last_practice_date
    ? Math.floor((new Date().getTime() - new Date(userStats.last_practice_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-teal-600 dark:text-blue-500" />
                {t('dashboard.overview')}
              </h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 今日状态卡片 - 优化版 */}
        {!hasStreak && daysSinceLastPractice !== null && daysSinceLastPractice > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-2xl">
            {/* 背景装饰 */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Flame className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">
                  {daysSinceLastPractice === 1 ? t('dashboard.yesterday') : `${daysSinceLastPractice} ${t('dashboard.daysAgo')}`} {t('dashboard.practiced')}
                </p>
                <p className="text-sm text-orange-50">
                  {t('dashboard.keepStreak')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* P0-1: 打卡组件（最重要） */}
        <section>
          <StreakCounter userId={userId} />
        </section>

        {/* 核心数据概览 - 优化版 */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600 dark:text-blue-500" />
            {t('dashboard.achievements')}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {/* 总时长 */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {userStats ? formatDuration(userStats.total_practice_seconds) : '0m'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.totalTime')}</div>
            </div>

            {/* 完成视频 */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {userStats?.total_videos_completed || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.completedVideos')}</div>
            </div>

            {/* 练习句子 */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {userStats?.total_sentences_practiced || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('dashboard.practicedSentences')}</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.currentLevel')}</span>
              <span className="font-bold text-gray-900 dark:text-white">
                Lv.{userStats?.level || 1} · {userStats?.total_xp || 0} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all duration-500"
                style={{
                  width: `${Math.min(((userStats?.total_xp || 0) % 1000) / 10, 100)}%`
                }}
              />
            </div>
          </div>
        </section>

        {/* 练习日历 */}
        <section>
          <CheckinCalendar userId={userId} useDemoData={process.env.NODE_ENV === 'development'} />
        </section>

        {/* 快捷入口 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-800 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.moreFeatures')}</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('dashboard.badges')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('dashboard.badgesDesc')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/history')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('dashboard.history')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('dashboard.historyDesc')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-teal-600 dark:text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">{t('dashboard.notifications')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('dashboard.notificationsDesc')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </button>
          </div>
        </section>

        {/* 激励卡片 */}
        {hasStreak && (userStats?.current_streak || 0) >= 7 && (
          <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Trophy className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">
                  {t('dashboard.streakTitle', { days: userStats?.current_streak })}
                </p>
                <p className="text-sm text-purple-50">
                  {userStats?.current_streak && userStats.current_streak >= 30
                    ? t('dashboard.streakMaster')
                    : userStats?.current_streak && userStats.current_streak >= 14
                      ? t('dashboard.streakMonth')
                      : t('dashboard.streakHabit')}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
