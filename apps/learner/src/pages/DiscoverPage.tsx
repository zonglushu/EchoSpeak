import React from 'react';
import { Search, TrendingUp, Play, Clock, BookMark, Star } from 'lucide-react';

interface DiscoverPageProps {
  onVideoSelect?: (videoId: string) => void;
}

// 模拟推荐数据
const recommendedVideos = [
  {
    id: '1',
    title: 'Daily English Conversation',
    thumbnail: '🎬',
    duration: '12:34',
    progress: 45,
    category: '日常对话',
  },
  {
    id: '2',
    title: 'Business English Meeting',
    thumbnail: '💼',
    duration: '15:20',
    progress: 0,
    category: '商务英语',
  },
  {
    id: '3',
    title: 'Movie Scenes - Friends',
    thumbnail: '🎥',
    duration: '8:45',
    progress: 100,
    category: '影视',
  },
];

const categories = [
  { id: 'news', name: '新闻', icon: '📰', count: 15, color: 'bg-teal-500' },
  { id: 'movies', name: '电影', icon: '🎬', count: 23, color: 'bg-cyan-500' },
  { id: 'talks', name: '访谈', icon: '🎙️', count: 18, color: 'bg-green-500' },
  { id: 'documentaries', name: '纪录片', icon: '📺', count: 12, color: 'bg-orange-500' },
  { id: 'comedy', name: '喜剧', icon: '😂', count: 9, color: 'bg-pink-500' },
  { id: 'education', name: '教育', icon: '📚', count: 31, color: 'bg-indigo-500' },
];

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onVideoSelect }) => {
  return (
    <div className="min-h-screen bg-background text-text-primary pb-24 safe-top dark:bg-dark-background dark:dark-text-primary">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-2xl border-b border-border p-4 dark:bg-dark-background/95 dark:border-dark-border">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface border border-border px-4 py-3 rounded-xl dark:bg-dark-surface dark:border-dark-border">
            <Search className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary" />
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-text-tertiary dark:placeholder:text-dark-text-tertiary dark:text-dark-text-primary"
              placeholder="搜索视频..."
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 今日进度 */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white">今日目标</span>
            </div>
            <span className="text-2xl font-black text-white">3/5</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div className="bg-white rounded-full h-2 transition-all" style={{ width: '60%' }} />
          </div>
          <p className="text-xs text-white/80 font-medium">已完成 60%，继续加油！</p>
        </div>

        {/* 继续学习 */}
        <div>
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-3 px-1 dark:text-dark-text-secondary">
            继续学习
          </h3>
          <div className="bg-surface rounded-2xl p-4 border border-border dark:bg-dark-surface dark:border-dark-border">
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-2xl">
                🎬
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text-primary mb-1 truncate dark:dark-text-primary">Daily English Conversation</h4>
                <p className="text-xs text-text-secondary mb-2 dark:text-dark-text-secondary">已学 45% • 剩余 7分钟</p>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5" style={{ width: '45%' }} />
                </div>
              </div>
              <button className="p-3 bg-primary rounded-xl hover:bg-primary-light transition-all touch-friendly dark:bg-primary-light dark:hover:bg-primary">
                <Play className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 推荐内容 - 横向滚动 */}
        <div>
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-3 px-1 dark:text-dark-text-secondary">
            推荐内容
          </h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {recommendedVideos.map((video) => (
              <div
                key={video.id}
                className="flex-shrink-0 w-40 bg-surface rounded-2xl overflow-hidden border border-border active:scale-95 transition-transform dark:bg-dark-surface dark:border-dark-border"
              >
                <div className="aspect-video bg-gradient-to-br from-info-dark to-dark-background flex items-center justify-center text-4xl dark:from-dark-surface dark:to-dark-background">
                  {video.thumbnail}
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-text-primary mb-1 truncate dark:dark-text-primary">{video.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-text-secondary dark:text-dark-text-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{video.duration}</span>
                  </div>
                  {video.progress > 0 && video.progress < 100 && (
                    <div className="mt-2 w-full bg-white/10 rounded-full h-1">
                      <div className="bg-primary rounded-full h-1" style={{ width: `${video.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分类浏览 - 网格布局 */}
        <div>
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-3 px-1 dark:text-dark-text-secondary">
            分类浏览
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-surface rounded-2xl p-4 border border-border active:scale-95 transition-transform cursor-pointer dark:bg-dark-surface dark:border-dark-border"
              >
                <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>
                  {category.icon}
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1 dark:dark-text-primary">{category.name}</h4>
                <p className="text-xs text-text-secondary dark:text-dark-text-secondary">{category.count} 个视频</p>
              </div>
            ))}
          </div>
        </div>

        {/* 热门榜单 */}
        <div>
          <h3 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-3 px-1 dark:text-dark-text-secondary">
            热门榜单
          </h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div
                key={rank}
                className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border active:bg-surface-hover transition-colors cursor-pointer dark:bg-dark-surface dark:border-dark-border dark:active:bg-dark-surface-hover"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                    rank === 1
                      ? 'bg-warning text-white'
                      : rank === 2
                      ? 'bg-info text-white'
                      : rank === 3
                      ? 'bg-warning-dark text-white'
                      : 'bg-surface-hover text-text-secondary dark:bg-dark-surface-hover dark:text-dark-text-secondary'
                  }`}
                >
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate dark:dark-text-primary">热门视频标题 {rank}</h4>
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">12.5K 次学习</p>
                </div>
                <Star className="w-5 h-5 text-warning" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
