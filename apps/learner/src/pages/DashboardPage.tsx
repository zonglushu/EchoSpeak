/**
 * Dashboard Page - Smart Entry Point for 3-Mode Learning System
 *
 * Features:
 * - Time-aware greeting
 * - Intelligent mode recommendation based on time of day
 * - Today's chunk statistics
 * - Quick mode switching
 */

import React, { useMemo, useEffect, useCallback, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChunks } from '../contexts/ChunkContext';
import { motion } from 'framer-motion';
import {
  Headphones,
  Sword,
  Lightbulb,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Clock
} from 'lucide-react';

const MODE_INFO = {
  flow: {
    name: 'Flow Mode',
    icon: <Headphones size={32} />,
    emoji: '🌊',
    title: '伴随输入',
    description: '被动输入 + 一键收藏',
    subtitle: 'Ideal for: Commute, chores, relaxation',
    color: 'from-teal-400 to-emerald-500',
    bgGradient: 'bg-gradient-to-br from-teal-50 to-emerald-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    timeContext: 'Morning (5:00-12:00)'
  },
  battle: {
    name: 'Battle Mode',
    icon: <Sword size={32} />,
    emoji: '⚔️',
    title: '实战练习',
    description: '通过角色扮演突破表达障碍',
    subtitle: 'Ideal for: Evening practice, focused sessions',
    color: 'from-rose-400 to-red-500',
    bgGradient: 'bg-gradient-to-br from-rose-50 to-red-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    timeContext: 'Evening (12:00-21:00)'
  },
  think: {
    name: 'Think Mode',
    icon: <Lightbulb size={32} />,
    emoji: '💡',
    title: '思维内化',
    description: '逻辑重构与语块激活',
    subtitle: 'Ideal for: Bedtime review, reflection',
    color: 'from-indigo-400 to-purple-500',
    bgGradient: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    timeContext: 'Night (21:00-5:00)'
  }
};

type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';
type RecommendedMode = 'flow' | 'battle' | 'think';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { statistics, isLoading } = useChunks();

  // Get mode from URL parameter (if coming from HomePage "Quick Start")
  const preselectedMode = searchParams.get('mode') as RecommendedMode | null;

  // Get time-aware greeting and recommended mode
  const { greeting, timePeriod, recommendedMode } = useMemo(() => {
    const hour = new Date().getHours();
    let greeting: string;
    let timePeriod: TimePeriod;
    let recommendedMode: RecommendedMode;

    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning!';
      timePeriod = 'morning';
      recommendedMode = 'flow';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon!';
      timePeriod = 'afternoon';
      recommendedMode = 'battle';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good Evening!';
      timePeriod = 'evening';
      recommendedMode = 'battle';
    } else {
      greeting = 'Good Night!';
      timePeriod = 'night';
      recommendedMode = 'think';
    }

    return { greeting, timePeriod, recommendedMode };
  }, []);

  // If user came from HomePage with preselected mode, use that
  const displayRecommendedMode = preselectedMode || recommendedMode;

  const otherModes = useMemo(() => {
    return (Object.keys(MODE_INFO) as Array<keyof typeof MODE_INFO>)
      .filter(mode => mode !== displayRecommendedMode);
  }, [displayRecommendedMode]);

  // Navigate to mode
  const handleStartMode = useCallback(function startMode(mode: keyof typeof MODE_INFO) {
    navigate(`/${mode}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-32">

      {/* Header Section */}
      <div className="px-6 pt-12 pb-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {greeting}
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Ready to level up your English?
          </p>
        </motion.div>

        {/* Today's Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mt-8 grid grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="text-indigo-500" size={20} />
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Today</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{statistics.totalCollected}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Chunks Collected</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-500" size={20} />
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Progress</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{statistics.masteredCount}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Mastered</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-orange-500" size={20} />
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Review</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{statistics.dueForReview}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Due for Review</div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        <div className="max-w-4xl mx-auto">
          {/* Recommended Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
              <span className="mr-2">✨</span>
              Recommended for You
            </h2>

            <RecommendedModeCard
              mode={displayRecommendedMode}
              info={MODE_INFO[displayRecommendedMode]}
              onStart={() => handleStartMode(displayRecommendedMode)}
            />
          </motion.div>

          {/* Other Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Or choose another mode:
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {otherModes.map((mode) => (
                <ModeCard
                  key={mode}
                  mode={mode}
                  info={MODE_INFO[mode]}
                  onStart={() => handleStartMode(mode)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Recommended Mode Card (Large, Featured)
interface RecommendedModeCardProps {
  mode: keyof typeof MODE_INFO;
  info: typeof MODE_INFO[keyof typeof MODE_INFO];
  onStart: () => void;
}

const RecommendedModeCard = memo(function RecommendedModeCardInternal({ mode, info, onStart }: RecommendedModeCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`${info.bgGradient} rounded-3xl p-8 border-2 ${info.borderColor} shadow-lg cursor-pointer transition-all`}
      onClick={onStart}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Emoji Icon */}
          <div className="text-6xl mb-4">{info.emoji}</div>

          {/* Title */}
          <h3 className={`text-3xl font-black ${info.textColor} mb-2`}>
            {info.title}
          </h3>

          {/* Description */}
          <p className="text-slate-700 text-lg font-medium mb-3">
            {info.description}
          </p>

          {/* Subtitle */}
          <p className="text-slate-500 text-sm mb-6">
            {info.subtitle}
          </p>

          {/* CTA Button */}
          <button
            className={`bg-gradient-to-r ${info.color} text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-md hover:shadow-xl transition-all flex items-center space-x-2`}
          >
            <span>Start {info.name}</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Time Context Badge */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200">
          <div className="text-xs text-slate-400 uppercase font-bold tracking-wide mb-1">
            Best Time
          </div>
          <div className={`text-sm font-bold ${info.textColor}`}>
            {info.timeContext}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Compact Mode Card
interface ModeCardProps {
  mode: keyof typeof MODE_INFO;
  info: typeof MODE_INFO[keyof typeof MODE_INFO];
  onStart: () => void;
}

const ModeCard = memo(function ModeCardInternal({ mode, info, onStart }: ModeCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onStart}
      className={`${info.bgGradient} rounded-2xl p-6 border-2 ${info.borderColor} shadow-sm hover:shadow-md transition-all text-left`}
    >
      {/* Emoji Icon */}
      <div className="text-4xl mb-3">{info.emoji}</div>

      {/* Title */}
      <h3 className={`text-xl font-bold ${info.textColor} mb-1`}>
        {info.title}
      </h3>

      {/* Description */}
      <p className="text-slate-600 text-sm font-medium">
        {info.description}
      </p>
    </motion.button>
  );
});

export default DashboardPage;
