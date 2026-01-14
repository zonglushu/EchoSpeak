import React, { memo, useCallback } from 'react';
import { Play, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PracticeHistory } from '@echospeak/types';

interface LearningBannerProps {
  recentPractice: PracticeHistory[];
  isLoading: boolean;
}

export function LearningBanner({ recentPractice, isLoading }: LearningBannerProps): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <motion.div
        variants={{
          hidden: { y: 20, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: {
              type: 'spring' as const,
              stiffness: 100,
              damping: 15,
            },
          },
        }}
        className="w-full h-64 bg-gray-200 dark:bg-gray-800 rounded-[2.5rem] animate-pulse mb-8"
      />
    );
  }

  const hasRecentPractice = recentPractice.length > 0;

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: {
            type: 'spring' as const,
            stiffness: 100,
            damping: 15,
          },
        },
      }}
    >
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
          {hasRecentPractice ? t('home.continueLearning') : t('home.getStarted')}
        </h2>
        {hasRecentPractice && (
          <button
            onClick={() => navigate('/profile')}
            className="text-[10px] font-black text-[#0085FF] hover:underline uppercase tracking-wider"
          >
            {t('common.viewAll')}
          </button>
        )}
      </div>

      {hasRecentPractice ? (
        <ContinueLearningCard practice={recentPractice[0]} navigate={navigate} t={t} />
      ) : (
        <GetStartedCard navigate={navigate} t={t} />
      )}
    </motion.section>
  );
}

interface ContinueLearningCardProps {
  practice: PracticeHistory;
  navigate: (path: string) => void;
  t: (key: string) => string;
}

const ContinueLearningCard = memo(function ContinueLearningCard({ practice, navigate, t }: ContinueLearningCardProps): React.JSX.Element {
  const handleClick = useCallback(function navigateToVideo() {
    navigate(`/video/${practice.video_id}`);
  }, [navigate, practice.video_id]);

  const handleImageError = useCallback(function hideThumbnail(e: React.SyntheticEvent<HTMLImageElement>) {
    e.currentTarget.style.display = 'none';
  }, []);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="relative overflow-hidden bg-gradient-to-br from-[#00A89F] via-[#00B4D8] to-[#0077B6] rounded-[2.5rem] p-8 text-white cursor-pointer transition-all shadow-2xl hover:shadow-3xl group border border-white/10"
    >
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
        <Sparkles className="w-8 h-8 text-white" />
      </div>

      <div className="relative">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg border border-white/20 overflow-hidden">
            <img
              src={`https://img.youtube.com/vi/${practice.video_id}/mqdefault.jpg`}
              alt="thumbnail"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
              onError={handleImageError}
            />
            <Play className="absolute w-6 h-6 fill-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black mb-1 truncate tracking-tight">{practice.video_title}</h3>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80">
              <span>{Math.round(practice.progress_percentage)}% Completed</span>
              <span className="opacity-40">•</span>
              <span>
                {practice.sentences_completed}/{practice.sentences_total} Sentences
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${practice.progress_percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white/30 bg-gray-200 overflow-hidden"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 50}`}
                  alt="learner"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-8 py-4 bg-white text-[#00A89F] rounded-full font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
            {t('common.continue')}
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

interface GetStartedCardProps {
  navigate: (path: string) => void;
  t: (key: string) => string;
}

const GetStartedCard = memo(function GetStartedCard({ navigate, t }: GetStartedCardProps): React.JSX.Element {
  const handleClick = useCallback(function navigateToLearn() {
    navigate('/learn');
  }, [navigate]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="relative overflow-hidden bg-gradient-to-br from-[#00A89F] via-[#00B4D8] to-[#0077B6] rounded-[2.5rem] p-8 text-white cursor-pointer transition-all shadow-2xl hover:shadow-3xl group border border-white/10"
    >
      <div className="absolute top-0 right-0 p-6">
        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] mb-6">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          {t('home.newJourney')}
        </div>

        <h2 className="text-3xl font-black mb-4 leading-[1.1] tracking-tight max-w-[200px]">
          {t('home.startJourneyTitle')}
        </h2>

        <p className="text-sm text-white/80 font-medium mb-8 max-w-[240px] leading-relaxed">
          {t('home.startJourneyDesc')}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-white/50 bg-gray-200 overflow-hidden shadow-lg transform hover:-translate-y-1 transition-transform"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`}
                  alt="learner"
                />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-black/40 flex items-center justify-center text-[10px] font-black backdrop-blur-sm">
              +4
            </div>
          </div>

          <button className="flex items-center gap-2 px-8 py-4 bg-white text-[#00A89F] rounded-full font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
            {t('common.startNow')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});
