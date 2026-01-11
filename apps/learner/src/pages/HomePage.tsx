import React, { useState, useEffect } from 'react';
import { Play, Clock, Flame, BarChart3, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { DailyGoals } from '../components/DailyGoals';
import { TrendingLeaderboard } from '../components/trending';
import { ThemeToggle } from '../components/ThemeToggle';
import { getUserStats, formatDuration, getPracticeHistory } from '../services/p0FeaturesClient';
import { UserStats } from '@echospeak/types';

interface HomePageProps {
  onNavigateToVideo?: (videoId: string) => void;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

// 模拟数据
const recommendedVideos = [
  {
    id: '1',
    title: 'News Report - Weather',
    category: 'news',
    categoryLabel: '新闻',
    difficulty: 'beginner',
    difficultyLabel: '初级',
    thumbnail: '📰',
    duration: '3:15',
    students: 1800,
  },
  {
    id: '2',
    title: 'Movie Scene - Friends',
    category: 'movies',
    categoryLabel: '影视',
    difficulty: 'intermediate',
    difficultyLabel: '中级',
    thumbnail: '🎬',
    duration: '5:42',
    students: 2300,
  },
  {
    id: '3',
    title: 'Business Meeting',
    category: 'business',
    categoryLabel: '商务',
    difficulty: 'advanced',
    difficultyLabel: '高级',
    thumbnail: '💼',
    duration: '8:20',
    students: 980,
  },
  {
    id: '4',
    title: 'TED Talk: Communication',
    category: 'ted',
    categoryLabel: 'TED',
    difficulty: 'advanced',
    difficultyLabel: '高级',
    thumbnail: '🎤',
    duration: '12:35',
    students: 3200,
  },
];

const categories = [
  { id: 'daily', name: '日常对话', icon: '💬', count: 45, color: 'from-green-400 to-emerald-500' },
  { id: 'movies', name: '影视跟读', icon: '🎬', count: 38, color: 'from-purple-400 to-pink-500' },
  { id: 'business', name: '商务英语', icon: '💼', count: 15, color: 'from-blue-400 to-cyan-500' },
  { id: 'ted', name: 'TED演讲', icon: '🎤', count: 12, color: 'from-orange-400 to-red-500' },
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToVideo,
  userLevel = 'intermediate'
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentPractice, setRecentPractice] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [dailyGoals, setDailyGoals] = useState([
    { id: '1', title: '完成一个视频', completed: false },
    { id: '2', title: '练习 20 个句子', completed: false },
    { id: '3', title: '学习 30 分钟', completed: false },
    { id: '4', title: '复习昨天的内容', completed: false },
  ]);

  useEffect(() => {
    if (userId) {
      Promise.all([
        getUserStats(userId),
        getPracticeHistory(userId, 5), // 获取最近5条练习记录
      ]).then(([stats, history]) => {
        setUserStats(stats);
        setRecentPractice(history);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'advanced':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '🌱 初级';
      case 'intermediate':
        return '🌿 中级';
      case 'advanced':
        return '🌳 高级';
      default:
        return difficulty;
    }
  };

  const handleVideoClick = (videoId: string) => {
    if (onNavigateToVideo) {
      onNavigateToVideo(videoId);
    } else {
      navigate(`/video/${videoId}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const handleCheckin = () => {
    // TODO: 实现打卡逻辑
    setTodayCheckedIn(true);
  };

  const handleGoalToggle = (goalId: string) => {
    setDailyGoals(goals =>
      goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* 顶部欢迎栏 - 优化版 */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 用户头像 */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {(user?.email?.split('@')[0] || 'L')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">
                👋 {getGreeting()}，{user?.email?.split('@')[0] || '学习者'}
              </h1>
              {/* 简化的打卡显示 */}
              <div className="flex items-center gap-2 mt-0.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {userStats?.current_streak || 0} 天连续打卡
                </span>
                {!todayCheckedIn && (
                  <button
                    onClick={handleCheckin}
                    className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full hover:bg-orange-600 transition-colors"
                  >
                    今日打卡
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 主题切换 */}
          <ThemeToggle />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 今日目标卡片 */}
        <DailyGoals goals={dailyGoals} onGoalToggle={handleGoalToggle} />

        {/* 学习报告入口卡片 */}
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-5 text-white hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-base font-bold mb-1">📊 查看学习报告</h3>
              <p className="text-sm text-white/80">
                本周学习 {userStats ? formatDuration(userStats.total_practice_seconds) : '0分钟'} | 完成 {userStats?.total_videos_completed || 0} 个视频
              </p>
            </div>
            <ArrowRight className="w-6 h-6" />
          </div>
        </button>

        {/* 继续学习 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">
              {recentPractice.length > 0 ? '继续学习' : '开始学习'}
            </h2>
            {recentPractice.length > 0 && (
              <button
                onClick={() => navigate('/profile')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                查看全部 →
              </button>
            )}
          </div>

          {/* 有练习记录 - 显示最近一次（大卡片） */}
          {recentPractice.length > 0 ? (
            recentPractice.slice(0, 1).map((practice) => (
              <div
                key={practice.id}
                onClick={() => navigate(`/video/${practice.video_id}`)}
                className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl p-6 text-white cursor-pointer active:scale-[0.98] transition-all shadow-2xl hover:shadow-3xl group"
              >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

                <div className="relative">
                  {/* 视频缩略图区域 */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-lg">
                      🎬
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black mb-1 truncate">{practice.video_title}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/90">
                        <span className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          {Math.round(practice.progress_percentage)}% 完成
                        </span>
                        <span>·</span>
                        <span>{practice.sentences_completed}/{practice.sentences_total} 句</span>
                      </div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${practice.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* 继续按钮 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">
                      还剩 {practice.sentences_total - practice.sentences_completed} 句
                    </span>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full font-bold text-sm group-hover:bg-white/30 transition-colors">
                      继续练习
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* 无练习记录 - 显示引导卡片（大卡片） */
            !isLoading && (
              <div
                onClick={() => navigate('/discover')}
                className="relative overflow-hidden bg-gradient-to-br from-green-500 via-teal-600 to-cyan-500 rounded-3xl p-6 text-white cursor-pointer active:scale-[0.98] transition-all shadow-2xl hover:shadow-3xl group"
              >
                {/* 背景装饰 */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-lg">
                      🚀
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black mb-1">开始你的学习之旅！</h3>
                      <p className="text-sm text-white/90">
                        探索精选视频，开始跟读练习
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">
                      {recommendedVideos.length} 个精选视频等你来学
                    </span>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full font-bold text-sm group-hover:bg-white/30 transition-colors">
                      立即开始
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </section>

        {/* 🔥 大家都在学（热门排行榜）- 社交证明 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              大家都在学
            </h2>
            <button
              onClick={() => navigate('/learn')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              查看全部 →
            </button>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-lg">
            <TrendingLeaderboard
              userId={userId}
              onSelectVideo={(videoId: string) => navigate(`/video/${videoId}`)}
            />
          </div>
        </section>

        {/* 为你推荐 - 精简版（只显示3个） */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">
              为你推荐
            </h2>
            <button
              onClick={() => navigate('/learn')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              查看全部 →
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {recommendedVideos.slice(0, 3).map((video) => (
              <div
                key={video.id}
                className="flex-shrink-0 w-48 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 active:scale-95 transition-all cursor-pointer shadow-lg hover:shadow-xl snap-start group"
                onClick={() => onNavigateToVideo && onNavigateToVideo(video.id)}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-5xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <span className="relative">{video.thumbnail}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <span className={`px-2 py-0.5 ${getDifficultyColor(video.difficulty)} rounded-full text-[10px] font-bold`}>
                      {getDifficultyLabel(video.difficulty)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug">{video.title}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{video.duration}</span>
                    </div>
                    <span>{video.students}人学过</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 浏览分类 - 简化版 */}
        <section>
          <h2 className="text-sm font-black text-gray-900 dark:text-white mb-3">
            浏览分类
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => navigate(`/discover?category=${category.id}`)}
                className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 active:scale-95 transition-all cursor-pointer group hover:shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${category.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                    {category.icon}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{category.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{category.count} 个视频</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
