import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, Brain, Star, Bookmark, Play } from 'lucide-react';
import { useChunks } from '../contexts/ChunkContext';
import { GlobalHeader } from '../components/GlobalHeader';
import { UserStats } from '@echospeak/types';
import { toast, EmptyState } from '../components/ui';

// Mock data - 实际应该从 API 获取
const THINK_VIDEOS = [
  {
    id: 'think-1',
    title: 'Business Story Retelling',
    category: 'Business',
    difficulty: '中级',
    duration: '12:30',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '观看后用自己的话复述内容',
  },
  {
    id: 'think-2',
    title: 'Logic Structure Analysis',
    category: 'Education',
    difficulty: '高级',
    duration: '15:45',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '分析逻辑结构，进行句式升级',
  },
  {
    id: 'think-3',
    title: 'Vocabulary Expansion',
    category: 'Language',
    difficulty: '初级',
    duration: '10:20',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '词汇扩展与语块激活练习',
  },
];

// Mock favorites data
interface FavoriteItem {
  id: string;
  text: string;
  translation: string;
  videoTitle: string;
  notes: string[];
  createdAt: string;
}

const mockFavorites: FavoriteItem[] = [
  {
    id: '1',
    text: 'Hello, how are you doing today?',
    translation: '你好，你今天过得怎么样？',
    videoTitle: 'Daily English Conversation',
    notes: ['注意连读: how are → how-are', '语调要在句尾下降'],
    createdAt: '2025-01-08',
  },
  {
    id: '2',
    text: "I'm fine, thank you. And you?",
    translation: '我很好，谢谢。你呢？',
    videoTitle: 'Daily English Conversation',
    notes: ['I\'m 连读成 "Im"'],
    createdAt: '2025-01-07',
  },
];

interface ThinkModeFeedProps {
  userStats?: UserStats | null;
}

export function ThinkModeFeed({ userStats }: ThinkModeFeedProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'videos' | 'favorites'>('videos');
  const [favorites] = useState<FavoriteItem[]>(mockFavorites);
  const { dueForReview } = useChunks();

  const handleVideoClick = (videoId: string, title: string) => {
    toast.success(`开始学习：${title}`);
    navigate(`/video/${videoId}?mode=think`);
  };

  // Get initial tab from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites') {
      setActiveTab('favorites');
    }
  }, [location.search]);

  const handleTabChange = (tab: 'videos' | 'favorites') => {
    setActiveTab(tab);
    const url = new URLSearchParams(location.search);
    if (tab === 'favorites') {
      url.set('tab', 'favorites');
    } else {
      url.delete('tab');
    }
    navigate(`${location.pathname}?${url.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-indigo-950 pb-24">
      {/* Global Header - Compact Mode */}
      <GlobalHeader
        mode="compact"
        userStats={userStats}
        showBackButton={true}
        showStreak={false}
        showAvatar={false}
        onBackClick={() => navigate('/?path=browse')}
        modeTitle="Think 模式"
        modeDescription="思维内化 • 逻辑重构"
        modeEmoji="💡"
        className="border-indigo-200 dark:border-indigo-800"
      />

      {/* Sub-tab Navigation */}
      <div className="sticky top-[73px] z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-indigo-200 dark:border-indigo-800 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => handleTabChange('videos')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'videos'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span className="text-sm font-bold">Think 视频库</span>
          </button>
          <button
            onClick={() => handleTabChange('favorites')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="text-sm font-bold">我的收藏</span>
            <span className="text-xs opacity-60">({favorites.length})</span>
          </button>
        </div>
      </div>

      {/* Mode Info Banner - Only show on videos tab */}
      {activeTab === 'videos' && (
        <div className="p-6 space-y-4">
          {/* Start Practice Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/mode/think/practice')}
            className="w-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-xl font-black mb-1">开始练习</h2>
                <p className="text-sm opacity-90">
                  {dueForReview.length > 0
                    ? `${dueForReview.length} 个语块待复习`
                    : '开始新的 Think 练习'}
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-white" />
              </div>
            </div>
          </motion.button>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl"
          >
            <h2 className="text-xl font-black mb-2">适合什么时候学习？</h2>
            <div className="space-y-2 text-sm opacity-90">
              <p>✓ 睡前复盘 (23:00-23:15)</p>
              <p>✓ 复习总结 (回顾已学内容)</p>
              <p>✓ 低压力环境 (深度思考)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs font-medium opacity-80">建议时长：5-15 分钟</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Content based on active tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'videos' ? (
          <motion.div
            key="videos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 space-y-4"
          >
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              Think 专属视频库
            </h2>

            {THINK_VIDEOS.map((video, index) => (
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
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-medium">
                        {video.category}
                      </span>
                      <span>•</span>
                      <span>{video.difficulty}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Load More */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-white dark:bg-gray-800 rounded-2xl text-sm font-bold text-indigo-600 dark:text-indigo-400 border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-400 transition-all"
            >
              加载更多视频
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="favorites"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 space-y-4"
          >
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-indigo-500" />
              我的收藏 ({favorites.length})
            </h2>

            {favorites.length === 0 ? (
              <EmptyState
                type="no-missions"
                title="暂无收藏"
                description="在观看视频时点击星星收藏句子"
                variant="default"
              />
            ) : (
              favorites.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        {item.text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {item.translation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                      {item.videoTitle}
                    </span>
                    <span>{item.createdAt}</span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ThinkModeFeed;
