import React, { useState } from 'react';
import { Mic, Clock, TrendingUp, Target, Play, ChevronDown, ChevronUp, Search, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toggleWatchLater, isInWatchLater } from '../utils/watchLaterUtils';

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
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

            {/* 统计数据切换按钮 */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {showStats ? '隐藏' : '统计'}
              </span>
            </button>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-surface text-text-secondary hover:bg-surface-hover dark:bg-dark-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface-hover'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* 热门榜单Tab */}
          <div className="flex gap-3 mt-3 px-4">
            <button
              onClick={() => setContentType('recommend')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                contentType === 'recommend'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-text-secondary hover:bg-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface'
              }`}
            >
              推荐
            </button>
            <button
              onClick={() => setContentType('hot')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                contentType === 'hot'
                  ? 'bg-orange-500 text-white'
                  : 'bg-transparent text-text-secondary hover:bg-surface dark:text-dark-text-secondary dark:hover:bg-dark-surface'
              }`}
            >
              🔥 热门
            </button>
            <button
              onClick={() => setContentType('new')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                contentType === 'new'
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
      <div className="px-4 py-6">
        {/* 可折叠的统计数据 */}
        {showStats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-3 border border-teal-200 dark:border-teal-800">
              <p className="text-xs text-teal-700 dark:text-teal-300 mb-1">今日</p>
              <p className="text-xl font-black text-teal-900 dark:text-teal-100">
                {practiceStats.todayMinutes}<span className="text-sm">分</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">连续</p>
              <p className="text-xl font-black text-orange-900 dark:text-orange-100">
                {practiceStats.streak}<span className="text-sm">天</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 mb-1">总次数</p>
              <p className="text-xl font-black text-green-900 dark:text-green-100">
                {practiceStats.totalSessions}<span className="text-sm">次</span>
              </p>
            </div>
          </div>
        )}

        {/* 引导文字 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-primary/20">
          <p className="text-sm font-bold text-text-primary dark:text-dark-text-primary mb-2">
            🎯 自主选择，轻松练习
          </p>
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary leading-relaxed">
            选择你感兴趣的内容，看视频跟读练习。每个视频都带有发音谱子标注，帮助你掌握地道的英语发音。
          </p>
        </div>

        {/* 练习内容列表 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary dark:text-dark-text-primary">
              {selectedCategory === 'all' ? '全部内容' : categories.find(c => c.id === selectedCategory)?.name}
              <span className="ml-2 text-xs font-normal text-text-secondary dark:text-dark-text-secondary">
                ({filteredVideos.length} 个)
              </span>
            </h2>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="text-center py-12 bg-surface dark:bg-dark-surface rounded-2xl border border-border dark:border-dark-border">
              <Mic className="w-12 h-12 text-text-tertiary dark:text-dark-text-tertiary mx-auto mb-3" />
              <p className="text-sm font-bold text-text-secondary dark:text-dark-text-secondary mb-1">
                该分类暂无内容
              </p>
              <p className="text-xs text-text-tertiary dark:text-dark-text-tertiary">
                试试其他分类吧
              </p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleVideoClick(video.id)}
                className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-border dark:border-dark-border hover:border-primary/50 transition-all cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md relative"
              >
                {/* 稍后练按钮 */}
                <button
                  onClick={(e) => handleToggleWatchLater(e, video)}
                  className={`absolute top-4 right-4 p-2 rounded-lg transition-all z-10 ${
                    watchLaterSet.has(video.id)
                      ? 'bg-primary text-white'
                      : 'bg-white/80 hover:bg-white text-text-secondary dark:bg-black/40 dark:hover:bg-black/60 dark:text-dark-text-secondary'
                  }`}
                  title={watchLaterSet.has(video.id) ? '已收藏' : '稍后练'}
                >
                  {watchLaterSet.has(video.id) ? (
                    <BookmarkCheck className="w-5 h-5" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </button>

                <div className="flex items-start gap-4">
                  {/* 缩略图 */}
                  <div className="w-24 h-16 rounded-xl bg-gradient-to-br from-info-dark to-dark-background flex items-center justify-center text-2xl flex-shrink-0 dark:from-dark-surface dark:to-dark-background relative overflow-hidden">
                    {video.thumbnail}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-bold text-white flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {video.duration}
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-text-primary dark:text-dark-text-primary line-clamp-1 mb-0.5">
                          {video.title}
                        </h3>
                        <p className="text-xs text-text-tertiary dark:text-dark-text-tertiary">
                          {video.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 ${video.difficultyColor} rounded text-[10px] font-bold`}>
                        {video.difficultyLabel}
                      </span>
                      <span className="text-[10px] text-text-tertiary dark:text-dark-text-tertiary">
                        {video.categoryName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-text-secondary dark:text-dark-text-secondary">
                      <span>{video.sentences} 个句子</span>
                      <span>•</span>
                      <span>{video.students} 人练过</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 p-4 bg-surface dark:bg-dark-surface rounded-2xl border border-border dark:border-dark-border">
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary leading-relaxed text-center">
            💡 点击任意内容即可开始跟读练习。系统会自动为你生成发音谱子标注，帮助你掌握每个句子的发音要点。
          </p>
        </div>
      </div>
    </div>
  );
};
