import React from 'react';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TrendingLeaderboard } from '../trending';

interface TrendingSectionProps {
  userId: string | undefined;
  onSelectVideo: (videoId: string) => void;
}

export function TrendingSection({ userId, onSelectVideo }: TrendingSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <motion.section>
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500/50" />
          {t('home.trending')}
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button className="px-4 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-[10px] font-black shadow-sm">
            {t('home.week')}
          </button>
          <button className="px-4 py-1.5 text-gray-400 dark:text-gray-500 text-[10px] font-black">
            {t('home.month')}
          </button>
        </div>
      </div>

      <div className="bg-transparent overflow-hidden">
        <TrendingLeaderboard
          userId={userId}
          onSelectVideo={onSelectVideo}
          layout="horizontal"
          hideHeader={true}
        />
      </div>
    </motion.section>
  );
}
