import React, { useState, useEffect } from 'react';
import { Play, Clock, Flame, BarChart3, Target, ArrowRight, CheckCircle, MessageSquare, Film, Briefcase, Mic2, Newspaper, Video, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
    thumbnail: <Newspaper className="w-10 h-10" />,
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
    thumbnail: <Video className="w-10 h-10" />,
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
    thumbnail: <Briefcase className="w-10 h-10" />,
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
    thumbnail: <Mic2 className="w-10 h-10" />,
    duration: '12:35',
    students: 3200,
  },
];

const CATEGORY_CONFIG = [
  { id: 'daily', icon: MessageSquare, color: 'from-teal-400 to-emerald-500' },
  { id: 'movies', icon: Film, color: 'from-cyan-400 to-blue-500' },
  { id: 'business', icon: Briefcase, color: 'from-teal-500 to-teal-700' },
  { id: 'ted', icon: Mic2, color: 'from-orange-400 to-amber-500' },
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToVideo,
  userLevel = 'intermediate'
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentPractice, setRecentPractice] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  // Goals logic might need to be dynamic or translated here if they are not just mock data.
  // For now I'll assume they are placeholder mock data but the UI around them is translated in DailyGoals.tsx
  const [dailyGoals, setDailyGoals] = useState([
    { id: '1', title: '完成一个视频', completed: false },
    { id: '2', title: '练习 20 个句子', completed: false },
    { id: '3', title: '学习 30 分钟', completed: false },
    { id: '4', title: '复习昨天的内容', completed: false },
  ]);

  const userTier = user?.user_metadata?.tier || 'free';
  const tierLabels = {
    free: 'Free Tier',
    pro: 'Pro Tier',
    premium: 'Premium Tier',
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      /* 如果没有用户ID，直接结束加载状态 */
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [stats, history] = await Promise.all([
          getUserStats(userId),
          getPracticeHistory(userId, 5), // 获取最近5条练习记录
        ]);

        if (isMounted) {
          setUserStats(stats);
          setRecentPractice(history || []);
        }
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'advanced':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return `🌱 ${t('difficulty.beginner')}`;
      case 'intermediate':
        return `🌿 ${t('difficulty.intermediate')}`;
      case 'advanced':
        return `🌳 ${t('difficulty.advanced')}`;
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
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const handleCheckin = () => {
    // TODO: 实现打卡逻辑
    setTodayCheckedIn(true);
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

  const handleGoalToggle = (goalId: string) => {
    setDailyGoals(goals =>
      goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* 顶部欢迎栏 - 设计稿对齐版 */}
      <div className="bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-gray-950 dark:text-white tracking-tight leading-none mb-1">
            EchoSpeak
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {getGreeting()}, {userTier === 'free' ? t('tier.free') : t(`tier.${userTier}`)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 打卡状态 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-full">
            <Flame className="w-4 h-4 text-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.3)]" />
            <span className="text-sm font-black text-orange-700 dark:text-orange-400">
              {userStats?.current_streak || 0}
            </span>
          </div>

          {/* 通知图标 */}
          <button className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-sm text-gray-500 hover:text-teal-600 transition-colors">
            <Video className="w-5 h-5" />
          </button>

          {/* 用户头像 - 点击跳转个人中心 */}
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg hover:ring-4 ring-indigo-500/10 transition-all"
          >
            {(user?.email?.split('@')[0] || 'L')[0].toUpperCase()}
          </button>
        </div>
      </div>

      <motion.div
        className="p-6 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 今日目标卡片 */}
        <motion.div variants={itemVariants}>
          <DailyGoals goals={dailyGoals} onGoalToggle={handleGoalToggle} />
        </motion.div>

        {/* 继续学习 / 引导卡片 (Continue Learning / Onboarding Banner) */}
        {isLoading ? (
          <motion.div
            key="loading-skeleton"
            variants={itemVariants}
            className="w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse mb-8"
          />
        ) : (
          <motion.section
            key="learning-content"
            initial="hidden"
            animate="visible"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                {recentPractice.length > 0 ? t('home.continueLearning') : t('home.getStarted')}
              </h2>
              {recentPractice.length > 0 && (
                <button
                  onClick={() => navigate('/profile')}
                  className="text-[10px] font-black text-[#0085FF] hover:underline uppercase tracking-wider"
                >
                  {t('common.viewAll')}
                </button>
              )}
            </div>

            {recentPractice.length > 0 ? (
              /* 有练习记录 - 显示最近一次练习（带进度条） */
              recentPractice.slice(0, 1).map((practice) => (
                <motion.div
                  key={practice.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/video/${practice.video_id}`)}
                  className="relative overflow-hidden bg-gradient-to-br from-[#00A89F] via-[#00B4D8] to-[#0077B6] rounded-[2.5rem] p-8 text-white cursor-pointer transition-all shadow-2xl hover:shadow-3xl group border border-white/10"
                >
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg border border-white/20 overflow-hidden">
                        <img
                          src={`https://img.youtube.com/vi/${practice.video_id}/mqdefault.jpg`}
                          alt="thumbnail"
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                          }}
                        />
                        <Play className="absolute w-6 h-6 fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black mb-1 truncate tracking-tight">{practice.video_title}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80">
                          <span>{Math.round(practice.progress_percentage)}% Completed</span>
                          <span className="opacity-40">•</span>
                          <span>{practice.sentences_completed}/{practice.sentences_total} Sentences</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${practice.progress_percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 bg-gray-200 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 50}`} alt="learner" />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 px-8 py-4 bg-white text-[#00A89F] rounded-full font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                        {t('common.continue')}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              /* 无练习记录 - 显示引导卡片 (Banner 风格) */
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/learn')}
                className="relative overflow-hidden bg-gradient-to-br from-[#00A89F] via-[#00B4D8] to-[#0077B6] rounded-[2.5rem] p-8 text-white cursor-pointer transition-all shadow-2xl hover:shadow-3xl group border border-white/10"
              >
                {/* 背景装饰 (与设计稿一致) */}
                <div className="absolute top-0 right-0 p-6">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] mb-6">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    {t('home.newJourney')}
                  </div>

                  <h2 className="text-3xl font-black mb-4 leading-[1.1] tracking-tight max-w-[200px]">
                    {t('home.startJourneyTitle')}
                  </h2>

                  <p className="text-sm text-white/80 font-medium mb-8 max-w-[240px] leading-relaxed">
                    {t('home.startJourneyDesc')}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white/50 bg-gray-200 overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="learner" />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-black/40 flex items-center justify-center text-[10px] font-black backdrop-blur-sm">
                        +4
                      </div>
                    </div>

                    <button className="flex items-center gap-2 px-8 py-4 bg-white text-[#00A89F] rounded-full font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                      {t('common.startNow')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* 大家都在学 (Trending Now) - 设计稿对齐 */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500/50" />
              {t('home.trending')}
            </h2>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button className="px-4 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-[10px] font-black shadow-sm">{t('home.week')}</button>
              <button className="px-4 py-1.5 text-gray-400 dark:text-gray-500 text-[10px] font-black">{t('home.month')}</button>
            </div>
          </div>

          <div className="bg-transparent overflow-hidden">
            <TrendingLeaderboard
              userId={userId}
              onSelectVideo={(videoId: string) => navigate(`/video/${videoId}`)}
              layout="horizontal"
              hideHeader={true}
            />
          </div>
        </motion.section>

        {/* 为你推荐 (Recommended For You) - 设计稿对齐 */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              {t('home.recommended')}
            </h2>
            <button
              onClick={() => navigate('/learn')}
              className="text-[10px] font-black text-[#0085FF] hover:underline uppercase tracking-wider"
            >
              {t('common.viewAll')}
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide px-1">
            {recommendedVideos.map((video, idx) => {
              const bgColors = [
                'bg-purple-50 dark:bg-purple-900/10',
                'bg-blue-50 dark:bg-blue-900/10',
                'bg-green-50 dark:bg-green-900/10',
                'bg-orange-50 dark:bg-orange-900/10',
              ];
              const iconColors = [
                'text-purple-400',
                'text-blue-400',
                'text-green-400',
                'text-orange-400',
              ];

              return (
                <motion.div
                  key={video.id}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0 w-[200px] group cursor-pointer"
                  onClick={() => onNavigateToVideo && onNavigateToVideo(video.id)}
                >
                  <div className={`aspect-square ${bgColors[idx % bgColors.length]} rounded-[2.5rem] flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-gray-200 dark:group-hover:shadow-none`}>
                    <div className={`${iconColors[idx % iconColors.length]} transform transition-transform duration-500 group-hover:scale-110`}>
                      {video.thumbnail}
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className={`px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${video.difficulty === 'beginner' ? 'text-green-500' :
                        video.difficulty === 'intermediate' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                        {video.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 px-1">
                    <h4 className="text-sm font-black text-gray-950 dark:text-white mb-1 line-clamp-1 leading-tight">{video.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
                      <span>{video.students / 1000}k users</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* 浏览分类 (Categories) - 设计稿对齐 */}
        <motion.section variants={itemVariants}>
          <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 px-1">
            {t('home.categories')}
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {CATEGORY_CONFIG.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/discover?category=${category.id}`)}
                className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-800 transition-all cursor-pointer group shadow-xl hover:shadow-2xl"
              >
                <div className="flex flex-col gap-5">
                  <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-500/10`}>
                    <category.icon className="w-7 h-7" />
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-black text-gray-950 dark:text-white mb-0.5 truncate tracking-tight">{t(`categories.${category.id}`)}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">30+ {t('home.videosCount')}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-[#0085FF] group-hover:text-white transition-all shadow-inner">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default HomePage;
