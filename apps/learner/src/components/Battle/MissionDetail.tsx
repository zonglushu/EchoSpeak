/**
 * Mission Detail Component
 *
 * Displays detailed information about a selected mission
 * including requirements, evaluation criteria, and keywords.
 *
 * @module components/Battle/MissionDetail
 */

import { motion } from 'framer-motion';
import { ArrowLeft, Play, BookOpen, Target, Award } from 'lucide-react';
import type { Mission } from '../../types/mode';

interface MissionDetailProps {
  mission: Mission;
  onStart: () => void;
  onBack: () => void;
}

export function MissionDetail({ mission, onStart, onBack }: MissionDetailProps) {
  const difficultyStars = '⭐'.repeat(mission.difficulty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-950 dark:to-rose-950 pb-24 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-rose-200 dark:border-rose-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Mission Details</h1>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 to-red-500 rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-black">{mission.title}</h2>
            <span className="text-lg">{difficultyStars}</span>
          </div>
          <p className="text-sm opacity-90">{mission.description}</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold capitalize">
              {mission.category}
            </span>
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Prerequisites
            </h3>
          </div>

          <div className="space-y-3">
            {/* Words to Practice */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Key vocabulary to practice first:
              </p>
              <div className="flex flex-wrap gap-2">
                {mission.prerequisites.words.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Minimum Accuracy */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Minimum accuracy required
                </span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {(mission.prerequisites.minAccuracy * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Evaluation Criteria */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Evaluation Criteria
            </h3>
          </div>

          <div className="space-y-3">
            <CriteriaBar
              label="Pronunciation"
              percentage={mission.evaluationCriteria.pronunciationWeight * 100}
            />
            <CriteriaBar
              label="Grammar"
              percentage={mission.evaluationCriteria.grammarWeight * 100}
            />
            <CriteriaBar
              label="Pragmatics"
              percentage={mission.evaluationCriteria.pragmaticWeight * 100}
            />
            <CriteriaBar
              label="Content"
              percentage={mission.evaluationCriteria.contentWeight * 100}
            />

            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Passing score
                </span>
                <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {(mission.evaluationCriteria.passingScore * 10).toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scenario Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Scenario Preview
            </h3>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">AI Character says:</p>
            <p className="text-sm text-gray-900 dark:text-white italic">
              "{mission.dialogueScript.text}"
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 capitalize">
              Personality: <span className="font-medium">{mission.dialogueScript.personality}</span>
            </p>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-2"
        >
          <button
            onClick={onStart}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-2xl text-base font-bold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Mission
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface CriteriaBarProps {
  label: string;
  percentage: number;
}

function CriteriaBar({ label, percentage }: CriteriaBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
