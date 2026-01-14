import React, { useCallback, memo } from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * Learning mode configuration
 */
interface LearningMode {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  className: string;
  titleClassName: string;
}

const LEARNING_MODES: LearningMode[] = [
  {
    id: 'flow',
    emoji: '🌊',
    title: 'Flow',
    subtitle: '伴随输入',
    className: 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-100 dark:border-teal-800/30 hover:border-teal-200 dark:hover:border-teal-700',
    titleClassName: 'text-teal-700 dark:text-teal-400',
  },
  {
    id: 'battle',
    emoji: '⚔️',
    title: 'Battle',
    subtitle: '实战练习',
    className: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-100 dark:border-rose-800/30 hover:border-rose-200 dark:hover:border-rose-700',
    titleClassName: 'text-rose-700 dark:text-rose-400',
  },
  {
    id: 'think',
    emoji: '💡',
    title: 'Think',
    subtitle: '思维内化',
    className: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800/30 hover:border-indigo-200 dark:hover:border-indigo-700',
    titleClassName: 'text-indigo-700 dark:text-indigo-400',
  },
];

interface ModeCardProps {
  mode: LearningMode;
}

const ModeCard = memo(function ModeCard({ mode }: ModeCardProps): React.JSX.Element {
  const navigate = useNavigate();

  const handleClick = useCallback(function handleModeCardClick() {
    navigate(`/dashboard?mode=${mode.id}`);
  }, [navigate, mode.id]);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`${mode.className} rounded-2xl p-4 border-2 transition-all cursor-pointer text-center group`}
    >
      <div className="text-4xl mb-2">{mode.emoji}</div>
      <h3 className={`text-sm font-bold ${mode.titleClassName} mb-1`}>
        {mode.title}
      </h3>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
        {mode.subtitle}
      </p>
    </motion.div>
  );
});

export function LearningModeCards(): React.JSX.Element {
  const navigate = useNavigate();

  const handleNavigateToModes = useCallback(function navigateToLearningModes() {
    navigate('/learning-modes');
  }, [navigate]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-500/50" />
          Quick Start
        </h2>
        <button
          onClick={handleNavigateToModes}
          className="text-[10px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 uppercase tracking-wider flex items-center gap-1"
        >
          什么是学习模式？
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {LEARNING_MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode} />
        ))}
      </div>
    </div>
  );
}
