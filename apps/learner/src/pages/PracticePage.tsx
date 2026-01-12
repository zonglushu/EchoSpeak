import React, { useState } from 'react';
import { Mic, Clock, TrendingUp, Target, Play, ChevronDown, ChevronUp, Search, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleWatchLater, isInWatchLater } from '../utils/watchLaterUtils';

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contentType, setContentType] = useState<'recommend' | 'hot' | 'new'>('recommend');

  // 练习统计数据（默认收起）
  const practiceStats = {
    todayMinutes: 23,
    streak: 7,
    totalSessions: 42,
  };

  // 分类筛选
  const categories = [
    { id: 'all', name: '全部', icon: '🎯' },
    { id: 'daily', name: '日常对话', icon: '💬' },
    { id: 'news', name: '新闻', icon: '📰' },
    { id: 'movies', name: '影视', icon: '🎬' },
    { id: 'business', name: '商务', icon: '💼' },
    { id: 'ted', name: 'TED', icon: '🎤' },
  ];

  // 推荐练习内容
  const practiceVideos = [
    {
      id: 'video-1',
      title: 'Coffee Shop Order',
      subtitle: '咖啡店点餐',
      category: 'daily',
      categoryName: '日常对话',
      difficulty: 'beginner',
      difficultyLabel: '🌱 初级',
      difficultyColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      duration: '3:24',
      sentences: 8,
      thumbnail: '☕',
      students: 2340,
    },
    {
      id: 'video-2',
      title: 'Weather Forecast',
      subtitle: '天气预报',
      category: 'news',
      categoryName: '新闻',
      difficulty: 'intermediate',
      difficultyLabel: '🌿 中级',
      difficultyColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      duration: '2:45',
      sentences: 12,
      thumbnail: '🌤️',
      students: 1890,
    },
    {
      id: 'video-3',
      title: 'Job Interview Tips',
      subtitle: '面试技巧',
      category: 'business',
      categoryName: '商务',
      difficulty: 'advanced',
      difficultyLabel: '🌳 高级',
      difficultyColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      duration: '5:12',
      sentences: 18,
      thumbnail: '💼',
      students: 980,
    },
    {
      id: 'video-4',
      title: 'Friends Greeting Scene',
      subtitle: '老友记问候场景',
      category: 'movies',
      categoryName: '影视',
      difficulty: 'intermediate',
      difficultyLabel: '🌿 中级',
      difficultyColor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      duration: '4:30',
      sentences: 15,
      thumbnail: '🎬',
      students: 3200,
    },
  ];

  // 根据分类筛选
  const filteredVideos = selectedCategory === 'all'
    ? practiceVideos
    : practiceVideos.filter(v => v.category === selectedCategory);

  // 跟踪每个视频的书签状态
  const [watchLaterSet, setWatchLaterSet] = useState(() => {
    const set = new Set<string>();
    practiceVideos.forEach(v => {
      if (isInWatchLater(v.id)) {
        set.add(v.id);
      }
    });
    return set;
  });

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`);
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

  const handleToggleWatchLater = (e: React.MouseEvent, video: typeof practiceVideos[0]) => {
    e.stopPropagation(); // 防止触发视频点击
    const added = toggleWatchLater({
      id: video.id,
      title: video.title,
      subtitle: video.subtitle,
      category: video.category,
      categoryName: video.categoryName,
      difficulty: video.difficulty,
      difficultyLabel: video.difficultyLabel,
      duration: video.duration,
      sentences: video.sentences,
      thumbnail: video.thumbnail,
    });

    if (added) {
      setWatchLaterSet(prev => new Set(prev).add(video.id));
    } else {
      setWatchLaterSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border dark:bg-dark-background/95 dark:border-dark-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black">练习内容</h1>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  选择感兴趣的内容开始练习
                </p>
              </div>
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border ${selectedCategory === cat.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.name}</span>
              </motion.button>
            ))}
          </div>

          {/* 热门榜单Tab */}
          <div className="flex gap-3 mt-3 px-4">
            <button
              onClick={() => setContentType('recommend')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${contentType === 'recommend'
                ? 'bg-primary text-white'
                : 'bg-transparent text-text-secondary hover:bg-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface'
                }`}
            >
              推荐
            </button>
            <button
              onClick={() => setContentType('hot')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${contentType === 'hot'
                ? 'bg-orange-500 text-white'
                : 'bg-transparent text-text-secondary hover:bg-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface'
                }`}
            >
              🔥 热门
            </button>
            <button
              onClick={() => setContentType('new')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${contentType === 'new'
                ? 'bg-green-500 text-white'
                : 'bg-transparent text-text-secondary hover:bg-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface'
                }`}
            >
              ✨ 最新
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 py-4 space-y-4"
      >
        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800 shadow-sm">
            <p className="text-[10px] font-black text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wider">今日</p>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-100">
              {practiceStats.todayMinutes}<span className="text-sm ml-0.5">MIN</span>
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-2xl p-4 border border-orange-100 dark:border-orange-800 shadow-sm">
            <p className="text-[10px] font-black text-orange-700 dark:text-orange-300 mb-1 uppercase tracking-wider">连续</p>
            <p className="text-2xl font-black text-orange-900 dark:text-orange-100">
              {practiceStats.streak}<span className="text-sm ml-0.5">DAYS</span>
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800 shadow-sm">
            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 mb-1 uppercase tracking-wider">总数</p>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
              {practiceStats.totalSessions}<span className="text-sm ml-0.5">TXS</span>
            </p>
          </motion.div>
        </div>

        {/* 引导文字 */}
        <motion.div variants={itemVariants} className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Target className="w-5 h-5" />
              自主选择，轻松练习
            </h3>
            <p className="text-xs text-white/80 leading-relaxed font-medium">
              选择你感兴趣的内容，看视频跟读练习。每个视频都带有发音谱子标注，帮助你掌握地道的英语发音。
            </p>
          </div>
        </motion.div>

        {/* 练习内容列表 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {selectedCategory === 'all' ? '全部内容' : categories.find(c => c.id === selectedCategory)?.name}
              <span className="ml-2 text-[10px] font-black text-gray-400 dark:text-gray-500">
                ({filteredVideos.length} ITEMS)
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredVideos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl"
                >
                  <Mic className="w-16 h-16 text-gray-200 dark:text-gray-800 mx-auto mb-4" />
                  <p className="text-base font-black text-gray-900 dark:text-white mb-1">
                    该分类暂无内容
                  </p>
                  <p className="text-xs font-bold text-gray-400">
                    试试其他分类吧
                  </p>
                </motion.div>
              ) : (
                filteredVideos.map((video) => (
                  <motion.div
                    layout
                    key={video.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVideoClick(video.id)}
                    className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[2rem] p-4 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-5">
                      {/* 缩略图 */}
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-4xl flex-shrink-0 relative overflow-hidden shadow-inner">
                        {video.thumbnail}
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white flex items-center gap-1">
                          {video.duration}
                        </div>
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1 mb-0.5 tracking-tight">
                            {video.title}
                          </h3>
                          <p className="text-xs font-bold text-gray-400 line-clamp-1">
                            {video.subtitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 ${video.difficultyColor.replace('text-700', 'text-[10px] font-black uppercase tracking-wider')} rounded-full text-[9px] font-black uppercase tracking-wider`}>
                            {video.difficultyLabel.split(' ')[1]}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {video.categoryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          <span className="flex items-center gap-1">📚 {video.sentences} 句</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">👥 {video.students} 人在学</span>
                        </div>
                      </div>

                      {/* 书签 */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => handleToggleWatchLater(e, video)}
                        className={`p-3 rounded-2xl transition-all shadow-lg ${watchLaterSet.has(video.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                          }`}
                      >
                        {watchLaterSet.has(video.id) ? (
                          <BookmarkCheck className="w-5 h-5" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 底部提示 */}
      <div className="mt-8 p-4 bg-surface dark:bg-dark-surface rounded-2xl border border-border dark:border-dark-border">
        <p className="text-xs text-text-secondary dark:text-dark-text-secondary leading-relaxed text-center">
          💡 点击任意内容即可开始跟读练习。系统会自动为你生成发音谱子标注，帮助你掌握每个句子的发音要点。
        </p>
      </div>
    </div>
  );
};
