import React, { useState } from 'react';
import { Search, Filter, Star, Bookmark, ChevronRight, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoriteItem {
  id: string;
  text: string;
  translation: string;
  videoTitle: string;
  notes: string[];
  createdAt: string;
}

// 模拟收藏数据
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
  {
    id: '3',
    text: 'What a wonderful surprise!',
    translation: '真是个惊喜！',
    videoTitle: 'Movie Scenes - Friends',
    notes: ['What a 连读', 'wonderful 重音在第一音节'],
    createdAt: '2025-01-06',
  },
];

export const FavoritesPage: React.FC = () => {
  const [favorites] = useState<FavoriteItem[]>(mockFavorites);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredFavorites = favorites.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    // 简化日期过滤逻辑
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 safe-top dark:bg-dark-background dark:dark-text-primary">
      {/* 顶部栏 - 优化版 */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">我的收藏</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{favorites.length} 个收藏项</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-teal-600 to-cyan-500 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        {/* 搜索栏 - 优化版 */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-gray-500 dark:text-white"
            placeholder="搜索收藏..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 快速筛选标签 - 优化版 */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: '全部' },
            { key: 'today', label: '今天' },
            { key: 'week', label: '本周' },
            { key: 'month', label: '本月' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === item.key
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 收藏列表 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredFavorites.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Star className="w-12 h-12 text-white" />
              </div>
              <p className="text-gray-900 dark:text-white font-black text-xl mb-2 uppercase tracking-tight">暂无收藏内容</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">在观看视频时点击星星图标收藏句子</p>
            </motion.div>
          ) : (
            filteredFavorites.map((item) => (
              <motion.div
                layout
                key={item.id}
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[2.5rem] p-7 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
              >
                {/* 背景装饰 */}
                <div className="absolute -right-8 -top-8 w-48 h-48 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity" />

                {/* 句子内容 */}
                <div className="relative mb-6">
                  <p className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight tracking-tight">
                    {item.text}
                  </p>
                  <p className="text-sm font-bold text-gray-400 italic dark:text-gray-500 leading-relaxed">{item.translation}</p>
                </div>

                {/* 视频来源 */}
                <div className="flex items-center gap-2.5 text-xs font-black text-gray-400 dark:text-gray-600 mb-6 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-full">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{item.videoTitle}</span>
                  </div>
                  <span>•</span>
                  <span>{item.createdAt}</span>
                </div>

                {/* 笔记预览 */}
                {item.notes.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl p-6 mb-6 border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-base">📝</span>
                      </div>
                      <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        笔记心得
                      </span>
                    </div>
                    <div className="space-y-2">
                      {item.notes.map((note, index) => (
                        <p key={index} className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed flex gap-2">
                          <span className="text-blue-500">•</span>
                          {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="relative flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                    立即重学
                  </motion.button>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 rounded-[1.25rem] transition-all border border-gray-100 dark:border-gray-700 shadow-inner"
                    >
                      <Edit className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[1.25rem] transition-all border border-gray-100 dark:border-gray-700 group/delete"
                    >
                      <Trash2 className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover/delete:text-red-500 transition-colors" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* 统计信息 */}
      {filteredFavorites.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-4 pb-10"
        >
          <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-[2rem] p-6 border border-blue-500/10 backdrop-blur-md">
            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest">💡 收藏统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 shadow-inner border border-white/20">
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{favorites.length}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">总收藏项</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-4 shadow-inner border border-white/20">
                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  {favorites.reduce((sum, item) => sum + item.notes.length, 0)}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">笔记总数</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FavoritesPage;
