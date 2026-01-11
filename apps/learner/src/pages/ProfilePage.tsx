import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Trophy, ChevronRight, Bell, HelpCircle, LogOut, Sparkles, ChevronDown, Bug, BarChart3, Target } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { StreakCounter, CheckinCalendar } from '../components/checkin';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const userTier = user?.user_metadata?.tier || 'free';
  const tierColors = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
  };

  const tierLabels = {
    free: '🔰 免费版',
    pro: '💎 专业版',
    premium: '👑 高级版',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* 顶部区域容器 */}
      <div className="relative pb-48">{/* 增加到 pb-48，给统计卡片足够空间（卡片高度约160px + 向下偏移64px = 224px，pb-48=192px接近） */}
        {/* 顶部渐变背景 */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 pt-8 pb-24 px-4">
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

          {/* 用户信息卡片 */}
          <div className="relative max-w-md mx-auto">
            <div className="flex items-center gap-4">
              {/* 用户头像 */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white/30">
                  {(user?.email?.split('@')[0] || 'L')[0].toUpperCase()}
                </div>
                {/* 在线状态指示器 */}
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-gray-900" />
              </div>

              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-white mb-1 truncate">
                  {user?.email?.split('@')[0] || '学习者'}
                </h1>
                <p className="text-sm text-white/80 mb-2 truncate">
                  {user?.email}
                </p>
                <span className={`inline-block px-3 py-1 ${tierColors[userTier as keyof typeof tierColors]} rounded-full text-xs font-bold`}>
                  {tierLabels[userTier as keyof typeof tierLabels]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 - 使用绝对定位浮动 */}
        <div className="absolute -bottom-16 left-0 right-0 px-4">{/* 改为 -bottom-16，让卡片浮动一半 */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {userStats ? formatDuration(userStats.total_practice_seconds) : '0m'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">总时长</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {userStats?.total_videos_completed || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">完成视频</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {userStats?.total_sentences_practiced || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">练习句子</p>
              </div>
            </div>

            {/* 等级进度条 */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">当前等级</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  Lv.{userStats?.level || 1} · {userStats?.total_xp || 0} XP
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(((userStats?.total_xp || 0) % 1000) / 10, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-4">{/* 减少 mt 到 4，因为外层容器已经有足够的 pb */}
        {/* P0-1: 打卡组件（完整版） */}
        <section>
          <StreakCounter userId={userId} />
        </section>

        {/* 练习日历 */}
        <section>
          <CheckinCalendar userId={userId} useDemoData={process.env.NODE_ENV === 'development'} />
        </section>

        {/* 学习历史 */}
        <section>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
              学习历史
            </h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showHistory && (
            <div className="space-y-4">
              {practiceHistory.length > 0 ? (
                practiceHistory.map((history) => (
                  <div
                    key={history.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => navigate(`/video/${history.video_id}`)}
                    >
                      <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-xl">
                        🎬
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {history.video_title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDuration(history.duration_seconds)} · {history.sentences_completed}/{history.sentences_total} 句
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          {Math.round(history.progress_percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <Clock className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    还没有学习记录
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    开始第一次练习吧！
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 成就徽章 */}
        {achievements.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                成就徽章
              </h3>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {achievements.length} 已解锁
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((userAchievement) => {
                const achievement = userAchievement.achievement;
                if (!achievement) return null;

                return (
                  <div
                    key={userAchievement.id}
                    className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl mb-2 mx-auto">
                      {achievement.icon_name}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white text-center mb-1">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      {achievement.description}
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 text-center mt-2">
                      {new Date(userAchievement.earned_at).toLocaleDateString()}
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
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-4 border-2 border-purple-300 dark:border-purple-700 space-y-3">
                <p className="text-xs font-bold text-purple-900 dark:text-purple-100">
                  🛠️ 开发者调试工具
                </p>
                <p className="text-[10px] text-purple-700 dark:text-purple-300 mb-3">
                  查看当前用户状态和统计数据
                </p>

                <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                  <p className="text-[10px] text-purple-800 dark:text-purple-200 leading-relaxed">
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

        {/* 设置入口 */}
        <section>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">
            设置
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
            <button
              onClick={() => navigate('/subscription')}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">会员中心</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">升级套餐、查看配额</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </button>
            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">学习偏好</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">每日目标、提醒设置</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </button>
            <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">通知设置</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">学习提醒、更新通知</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </button>
            <button
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              onClick={() => navigate('/help')}
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">帮助中心</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">使用教程、常见问题</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600" />
            </button>
            <div className="w-full flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">主题模式</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">切换浅色/深色</p>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
            >
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">退出登录</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">登出当前账户</p>
              </div>
              <ChevronRight className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
