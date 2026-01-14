import React, { useCallback, memo } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  RECOMMENDED_VIDEOS,
  VIDEO_CARD_BG_COLORS,
  VIDEO_CARD_ICON_COLORS,
  type RecommendedVideo,
} from '../../constants/homeConstants';
import { getVideoCardBadgeColor } from '../../utils/homeHelpers';

interface RecommendedVideosProps {
  onNavigateToVideo?: (videoId: string) => void;
  onViewAll?: () => void;
}

interface VideoCardProps {
  video: RecommendedVideo;
  idx: number;
  onNavigateToVideo?: (videoId: string) => void;
}

const VideoCard = memo(function VideoCard({ video, idx, onNavigateToVideo }: VideoCardProps): React.JSX.Element {
  const bgColor = VIDEO_CARD_BG_COLORS[idx % VIDEO_CARD_BG_COLORS.length];
  const iconColor = VIDEO_CARD_ICON_COLORS[idx % VIDEO_CARD_ICON_COLORS.length];
  const badgeColor = getVideoCardBadgeColor(video.difficulty);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 w-[200px] group cursor-pointer"
      onClick={() => onNavigateToVideo?.(video.id)}
    >
      <div
        className={`aspect-square ${bgColor} rounded-[2.5rem] flex items-center justify-center relative overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-gray-200 dark:group-hover:shadow-none`}
      >
        <div className={`${iconColor} transform transition-transform duration-500 group-hover:scale-110`}>
          <video.thumbnail className="w-10 h-10" />
        </div>
        <div className="absolute bottom-4 left-4">
          <span
            className={`px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${badgeColor}`}
          >
            {video.difficulty}
          </span>
        </div>
      </div>
      <div className="mt-4 px-1">
        <h4 className="text-sm font-black text-gray-950 dark:text-white mb-1 line-clamp-1 leading-tight">
          {video.title}
        </h4>
        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.duration}
          </span>
          <span>{video.students / 1000}k users</span>
        </div>
      </div>
    </motion.div>
  );
});

export function RecommendedVideos({
  onNavigateToVideo,
  onViewAll,
}: RecommendedVideosProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleViewAll = useCallback(function handleViewAllRecommended() {
    onViewAll?.();
  }, [onViewAll]);

  return (
    <section>
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
          {t('home.recommended')}
        </h2>
        {onViewAll && (
          <button
            onClick={handleViewAll}
            className="text-[10px] font-black text-[#0085FF] hover:underline uppercase tracking-wider"
          >
            {t('common.viewAll')}
          </button>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide px-1">
        {RECOMMENDED_VIDEOS.map((video, idx) => (
          <VideoCard key={video.id} video={video} idx={idx} onNavigateToVideo={onNavigateToVideo} />
        ))}
      </div>
    </section>
  );
}
