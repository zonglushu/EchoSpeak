import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, Brain } from 'lucide-react';

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

export function ThinkModeFeed() {
  const navigate = useNavigate();

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}?mode=think`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-indigo-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-indigo-200 dark:border-indigo-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/?path=browse')}
            className="p-2 -ml-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💡</span>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">Think 模式</h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">思维内化 • 逻辑重构</p>
          </div>
        </div>
      </div>

      {/* Mode Info Banner */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

      {/* Video List */}
      <div className="px-6 space-y-4">
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
      </div>
    </div>
  );
}

export default ThinkModeFeed;
