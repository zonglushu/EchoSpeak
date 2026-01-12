import { Search, TrendingUp, Play, Clock, Bookmark, Star, ArrowRight, Newspaper, Video, Mic2, Tv, Laugh, BookOpen, Film, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiscoverPageProps {
  onVideoSelect?: (videoId: string) => void;
}

// 模拟推荐数据
const recommendedVideos = [
  {
    id: '1',
    title: 'Daily English Conversation',
    thumbnail: <Film className="w-12 h-12" />,
    duration: '12:34',
    progress: 45,
    category: '日常对话',
  },
  {
    id: '2',
    title: 'Business English Meeting',
    thumbnail: <Briefcase className="w-12 h-12" />,
    duration: '15:20',
    progress: 0,
    category: '商务英语',
  },
  {
    id: '3',
    title: 'Movie Scenes - Friends',
    thumbnail: <Video className="w-12 h-12" />,
    duration: '8:45',
    progress: 100,
    category: '影视',
  },
];

const categories = [
  { id: 'news', name: '新闻', icon: Newspaper, count: 15, color: 'bg-teal-500' },
  { id: 'movies', name: '电影', icon: Video, count: 23, color: 'bg-cyan-500' },
  { id: 'talks', name: '访谈', icon: Mic2, count: 18, color: 'bg-emerald-500' },
  { id: 'documentaries', name: '纪录片', icon: Tv, count: 12, color: 'bg-teal-600' },
  { id: 'comedy', name: '喜剧', icon: Laugh, count: 9, color: 'bg-cyan-600' },
  { id: 'education', name: '教育', icon: BookOpen, count: 31, color: 'bg-teal-700' },
];

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ onVideoSelect }) => {
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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
        {/* 今日今日目标 */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-white" />
                <span className="text-base font-black text-white uppercase tracking-widest">今日目标</span>
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">3/5</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 mb-3 border border-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="bg-white rounded-full h-full shadow-lg shadow-teal-500/50"
              />
            </div>
            <p className="text-xs text-white/80 font-bold uppercase tracking-widest">已完成 60%，继续加油！</p>
          </div>
        </motion.div>

        {/* 继续学习 */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              继续学习
            </h3>
            <button className="text-xs text-teal-600 font-black uppercase tracking-widest">查看历史</button>
          </div>
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800 shadow-xl"
          >
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner border border-teal-50 dark:border-teal-800">
                <Play className="w-10 h-10 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-black text-gray-900 mb-1 truncate dark:text-white tracking-tight">Daily English Conversation</h4>
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">已学 45% • 剩余 7分钟</p>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-teal-600 rounded-full h-full shadow-sm"
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-4 bg-teal-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                <Play className="w-5 h-5 text-white fill-white" />
              </motion.button>
            </div>
          </motion.div>
        </motion.section>

        {/* 推荐内容 */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              推荐内容
            </h3>
            <button className="text-xs text-teal-600 font-black uppercase tracking-widest">更多 →</button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {recommendedVideos.map((video) => (
              <motion.div
                key={video.id}
                whileTap={{ scale: 0.96 }}
                className="flex-shrink-0 w-48 bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all snap-start group"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 flex items-center justify-center text-teal-600 relative overflow-hidden group-hover:after:absolute group-hover:after:inset-0 group-hover:after:bg-black/5">
                  {video.thumbnail}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-black text-gray-900 mb-1 truncate dark:text-white tracking-tight">{video.title}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{video.duration}</span>
                  </div>
                  {video.progress > 0 && video.progress < 100 && (
                    <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${video.progress}%` }}
                        className="bg-teal-600 rounded-full h-full"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 分类浏览 */}
        <motion.section variants={itemVariants}>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 px-1">
            分类浏览
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 ${category.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
                <div className={`w-14 h-14 ${category.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg border border-white/20`}>
                  <category.icon className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-gray-900 mb-0.5 dark:text-white tracking-tight">{category.name}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category.count} 个学习视频</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 热门榜单 */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              热门排行榜
            </h3>
            <button className="text-xs text-teal-600 font-black uppercase tracking-widest flex items-center gap-1">
              全榜
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((rank) => (
              <motion.div
                key={rank}
                whileHover={{ x: 4 }}
                className="flex items-center gap-5 bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-inner ${rank === 1
                    ? 'bg-amber-400 text-white'
                    : rank === 2
                      ? 'bg-blue-400 text-white'
                      : rank === 3
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                    }`}
                >
                  {rank}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-gray-900 truncate dark:text-white tracking-tight">热门视频标题 {rank}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">12,540 人已学</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default DiscoverPage;
