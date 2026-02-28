import React, { useCallback, memo } from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Learning mode configuration with enhanced features
 */
interface LearningMode {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  className: string;
  titleClassName: string;
  featureBadgeColor: string;
}

const LEARNING_MODES: LearningMode[] = [
  {
    id: 'flow',
    emoji: '🌊',
    title: 'Flow',
    subtitle: '伴随输入',
    description: '轻松沉浸',
    features: ['适合初学者', '无压力跟读', '智能暂停'],
    className: 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-100 dark:border-teal-800/30 hover:border-teal-200 dark:hover:border-teal-700',
    titleClassName: 'text-teal-700 dark:text-teal-400',
    featureBadgeColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  },
  {
    id: 'battle',
    emoji: '⚔️',
    title: 'Battle',
    subtitle: '实战练习',
    description: '挑战自我',
    features: ['AI对话对战', '实时反馈', '等级竞技'],
    className: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-100 dark:border-rose-800/30 hover:border-rose-200 dark:hover:border-rose-700',
    titleClassName: 'text-rose-700 dark:text-rose-400',
    featureBadgeColor: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'think',
    emoji: '💡',
    title: 'Think',
    subtitle: '思维内化',
    description: '深度思考',
    features: ['复述练习', '逻辑重组', '深度理解'],
    className: 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800/30 hover:border-indigo-200 dark:hover:border-indigo-700',
    titleClassName: 'text-indigo-700 dark:text-indigo-400',
    featureBadgeColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  },
];

interface ModeCardProps {
  mode: LearningMode;
  onModeClick?: (modeId: string) => void;
}

const ModeCard = memo(function ModeCard({ mode, onModeClick }: ModeCardProps): React.JSX.Element {
  const navigate = useNavigate();

  const handleClick = useCallback(function handleModeCardClick() {
    if (onModeClick) {
      onModeClick(mode.id);
    }
    navigate(`/dashboard?mode=${mode.id}`);
  }, [navigate, mode.id, onModeClick]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`${mode.className} rounded-3xl p-6 border-2 transition-all cursor-pointer text-center group relative overflow-hidden`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
        <div className="absolute top-0 right-0 w-32 h-32 bg-current rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="text-5xl mb-3">{mode.emoji}</div>
        <h3 className={`text-xl font-bold ${mode.titleClassName} mb-1`}>
          {mode.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-3">
          {mode.subtitle} · {mode.description}
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          {mode.features.map((feature, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 ${mode.featureBadgeColor} text-[10px] font-medium rounded-full`}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

interface LearningModeCardsProps {
  onModeClick?: (modeId: string) => void;
}

export function LearningModeCards({ onModeClick }: LearningModeCardsProps): React.JSX.Element {
  const navigate = useNavigate();

  const handleNavigateToModes = useCallback(function navigateToLearningModes() {
    navigate('/learning-modes');
  }, [navigate]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-500/50" />
          学习模式
        </h2>
        <button
          onClick={handleNavigateToModes}
          className="text-[10px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 uppercase tracking-wider flex items-center gap-1"
        >
          什么是学习模式？
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEARNING_MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode} onModeClick={onModeClick} />
        ))}
      </div>
    </div>
  );
}
