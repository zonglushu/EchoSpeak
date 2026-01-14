import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, TrendingUp } from 'lucide-react';

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

export function FlowModeFeed() {
  const navigate = useNavigate();

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}?mode=flow`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-950 dark:to-teal-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-teal-200 dark:border-teal-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/?path=browse')}
            className="p-2 -ml-2 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900 transition-all"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🌊</span>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">Flow 模式</h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">伴随输入 • 轻量跟读</p>
          </div>
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
          Flow 专属视频库
        </h2>

        {FLOW_VIDEOS.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVideoClick(video.id)}
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
        ))}

        {/* Load More */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-white dark:bg-gray-800 rounded-2xl text-sm font-bold text-teal-600 dark:text-teal-400 border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-400 transition-all"
        >
          加载更多视频
        </motion.button>
      </div>
    </div>
  );
}

export default FlowModeFeed;
