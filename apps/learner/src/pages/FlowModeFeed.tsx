import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, TrendingUp, Flame, Sparkles } from 'lucide-react';
import { GlobalHeader } from '../components/GlobalHeader';
import { UserStats } from '@echospeak/types';
import { toast, EmptyState } from '../components/ui';

// Mock data - 实际应该从 API 获取
const FLOW_VIDEOS = [
  {
    id: 'flow-1',
    title: 'Morning Business Briefing',
    category: 'Business',
    difficulty: '中级',
    duration: '15:20',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '轻松的商务英语播客，适合晨间收听',
  },
  {
    id: 'flow-2',
    title: 'Daily News Summary',
    category: 'News',
    difficulty: '初级',
    duration: '10:45',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '每日新闻摘要，语速适中',
  },
  {
    id: 'flow-3',
    title: 'TED Talk: The Power of Habit',
    category: 'Education',
    difficulty: '中级',
    duration: '18:30',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '启发性演讲，培养语感',
  },
];

const categories = [
  { id: 'all', name: '全部', emoji: '🌊' },
  { id: 'news', name: '新闻', emoji: '📰' },
  { id: 'daily', name: '日常', emoji: '💬' },
  { id: 'ted', name: 'TED', emoji: '🎤' },
];

const contentTypes = [
  { id: 'recommend', name: '推荐', icon: TrendingUp },
  { id: 'hot', name: '热门', icon: Flame },
  { id: 'new', name: '最新', icon: Sparkles },
];

interface FlowModeFeedProps {
  userStats?: UserStats | null;
}

export function FlowModeFeed({ userStats }: FlowModeFeedProps = {}) {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [contentType, setContentType] = useState('recommend');

  const handleVideoClick = (videoId: string, title: string) => {
    toast.success(`开始学习：${title}`);
    navigate(`/video/${videoId}?mode=flow`);
  };

  // Filter videos by category
  const filteredVideos = category === 'all'
    ? FLOW_VIDEOS
    : FLOW_VIDEOS.filter(video => {
        const categoryMap: Record<string, string> = {
          'news': 'News',
          'daily': 'Daily',
          'ted': 'Education'
        };
        return video.category === categoryMap[category];
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-teal-950 pb-24">
      {/* Global Header - Compact Mode */}
      <GlobalHeader
        mode="compact"
        userStats={userStats}
        showBackButton={true}
        showStreak={false}
        showAvatar={false}
        onBackClick={() => navigate('/?path=browse')}
        modeTitle="Flow 模式"
        modeDescription="伴随输入 • 轻量跟读"
        modeEmoji="🌊"
        className="border-teal-200 dark:border-teal-800"
      />

      {/* Filter Section */}
      <div className="sticky top-[73px] z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-teal-200 dark:border-teal-800 p-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold
                transition-all duration-200
                ${category === cat.id
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Content Type Switch */}
        <div className="flex gap-3 mt-3">
          {contentTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  contentType === type.id
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {type.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Info Banner */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-teal-500 to-emerald-500 rounded-3xl p-6 text-white shadow-xl"
        >
          <h2 className="text-xl font-black mb-2">适合什么时候学习？</h2>
          <div className="space-y-2 text-sm opacity-90">
            <p>✓ 晨间通勤 (07:30-08:30)</p>
            <p>✓ 家务时间 (碎片时间)</p>
            <p>✓ 放松时刻 (需要轻量输入时)</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs font-medium opacity-80">建议时长：10-20 分钟</p>
          </div>
        </motion.div>
      </div>

      {/* Video List */}
      <div className="px-6 space-y-4">
        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-500" />
          Flow 专属视频库 ({filteredVideos.length})
        </h2>

        {filteredVideos.length === 0 ? (
          <EmptyState
            type="no-videos"
            title="该分类暂无视频"
            description="试试其他分类吧"
            variant="default"
          />
        ) : (
          filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVideoClick(video.id, video.title)}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
          >
            <div className="flex gap-4 p-4">
              {/* Thumbnail */}
              <div className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-900">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  {video.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                    {video.category}
                  </span>
                  <span>•</span>
                  <span>{video.difficulty}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        ))
        )}

        {/* Load More */}
        {filteredVideos.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white dark:bg-gray-800 rounded-2xl text-sm font-bold text-teal-600 dark:text-teal-400 border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-400 transition-all"
          >
            加载更多视频
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default FlowModeFeed;
