/**
 * Exercise Selector - Think mode exercise type selection component
 *
 * Displays three exercise type cards:
 * - Chunk Activation (with due count)
 * - Video Retelling
 * - Logic Rewriting
 *
 * @module components/Think/ExerciseSelector
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, Sparkles } from 'lucide-react';
import { useChunks } from '../../contexts/ChunkContext';
import type { ExerciseType } from '../../types/mode';

export interface ExerciseSelectorProps {
  onSelect: (type: ExerciseType) => void;
}

interface ExerciseCard {
  type: ExerciseType;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  badge?: string;
  count?: number;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
  const { dueForReview } = useChunks();
  const hasDueChunks = dueForReview.length > 0;

  const exercises: ExerciseCard[] = [
    {
      type: 'chunk-activation',
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Chunk Activation',
      description: '用间隔重复激活你的词汇',
      time: '5-10 分钟',
      badge: hasDueChunks ? '推荐' : undefined,
      count: hasDueChunks ? dueForReview.length : undefined,
    },
    {
      type: 'video-retelling',
      icon: <Video className="w-6 h-6" />,
      title: 'Video Retelling',
      description: '观看视频并用自己的话复述',
      time: '10-15 分钟',
    },
    {
      type: 'logic-rewriting',
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Logic Rewriting',
      description: '接受 AI 挑战升级你的句子',
      time: '5-8 分钟',
    },
  ];

  return (
    <div className="exercise-selector px-6 py-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          选择练习类型
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          选择一种练习模式开始学习
        </p>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <motion.button
            key={exercise.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(exercise.type)}
            className="w-full bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 text-left relative overflow-hidden group"
          >
            {/* Badge */}
            {exercise.badge && (
              <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full">
                {exercise.badge}
              </div>
            )}

            {/* Content */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                {exercise.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
                  {exercise.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {exercise.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {exercise.time}
                  </span>
                  {exercise.count !== undefined && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {exercise.count} 个待复习
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default ExerciseSelector;
