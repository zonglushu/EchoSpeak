import React, { useCallback, memo } from 'react';
import { Clock, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Video } from '../../types/video';

interface FlowModeSectionProps {
  videos: Video[];
  onNavigate?: () => void;
}

const VideoCard = memo(function VideoCard({
  video,
  onClick,
}: {
  video: Video;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 w-[180px] group cursor-pointer"
      onClick={onClick}
    >
      <div
        className={`aspect-square bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-teal-200/50 dark:group-hover:shadow-teal-900/20 border-2 border-teal-100 dark:border-teal-800/30`}
      >
        <div className="text-teal-600 dark:text-teal-400 transform transition-transform duration-500 group-hover:scale-110">
          <video.thumbnail className="w-10 h-10" />
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm text-teal-700 dark:text-teal-300">
            {video.difficulty}
          </span>
        </div>
      </div>
      <div className="mt-4 px-1">
        <h4 className="text-sm font-black text-gray-950 dark:text-white mb-2 line-clamp-2 leading-tight">
          {video.title}
        </h4>
        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {video.students / 1000}k
          </span>
        </div>
      </div>
    </motion.div>
  );
});

export function FlowModeSection({ videos, onNavigate }: FlowModeSectionProps): React.JSX.Element {
  const navigate = useNavigate();

  const handleViewAll = useCallback(() => {
    navigate('/mode/flow');
  }, [navigate]);

  const handleVideoClick = useCallback(
    (videoId: string) => {
      navigate(`/video/${videoId}?mode=flow`);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  return (
    <section id="mode-section-flow" className="mb-8 scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🌊</span>
            Flow 模式推荐
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            伴随输入，轻松沉浸
          </p>
        </div>
        <button
          onClick={handleViewAll}
          className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Feature Tags */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <span className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium rounded-full">
          ✓ 适合初学者
        </span>
        <span className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium rounded-full">
          ✓ 无压力跟读
        </span>
        <span className="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-medium rounded-full">
          ✓ 智能暂停
        </span>
      </div>

      {/* Video Cards Slider */}
      <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => handleVideoClick(video.id)}
          />
        ))}
      </div>
    </section>
  );
}
