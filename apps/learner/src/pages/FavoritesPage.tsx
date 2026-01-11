import React, { useState } from 'react';
import { Search, Filter, Star, Bookmark, ChevronRight, Trash2, Edit } from 'lucide-react';

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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all active:scale-95">
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
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 收藏列表 */}
      <div className="p-4 space-y-3">
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Star className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">暂无收藏内容</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">在观看视频时点击星星图标收藏句子</p>
          </div>
        ) : (
          filteredFavorites.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer group"
            >
              {/* 背景装饰 */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:opacity-100 opacity-0 transition-opacity" />

              {/* 句子内容 */}
              <div className="relative mb-4">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {item.text}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 italic">{item.translation}</p>
              </div>

              {/* 视频来源 */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
                <Bookmark className="w-3.5 h-3.5" />
                <span>{item.videoTitle}</span>
                <span>•</span>
                <span>{item.createdAt}</span>
              </div>

              {/* 笔记预览 - 优化版 */}
              {item.notes.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📝</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {item.notes.length} 条笔记
                    </span>
                  </div>
                  {item.notes.map((note, index) => (
                    <p key={index} className="text-xs text-gray-700 dark:text-gray-300 mb-1.5 last:mb-0 leading-relaxed">
                      • {note}
                    </p>
                  ))}
                </div>
              )}

              {/* 操作按钮 - 优化版 */}
              <div className="relative flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg">
                  <ChevronRight className="w-4 h-4" />
                  继续学习
                </button>
                <button className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all">
                  <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all group/delete">
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover/delete:text-red-600 dark:group-hover/delete:text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 统计信息 */}
      {filteredFavorites.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl p-4 border border-accent/20">
            <h3 className="text-sm font-black text-text-primary mb-3 dark:dark-text-primary">💡 学习统计</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/20 rounded-xl p-3 dark:bg-white/5">
                <p className="text-2xl font-black text-text-primary dark:dark-text-primary">{favorites.length}</p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">总收藏</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3 dark:bg-white/5">
                <p className="text-2xl font-black text-text-primary dark:dark-text-primary">
                  {favorites.reduce((sum, item) => sum + item.notes.length, 0)}
                </p>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">笔记数量</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
