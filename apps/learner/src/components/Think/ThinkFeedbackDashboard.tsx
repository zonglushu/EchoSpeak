/**
 * Think Feedback Dashboard - Displays exercise results and statistics
 *
 * Features:
 * - Summary statistics (completed exercises, average score)
 * - Individual result cards
 * - Action buttons (continue practice, back to feed)
 *
 * @module components/Think/ThinkFeedbackDashboard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Clock, RotateCcw, ArrowLeft } from 'lucide-react';

export interface ExerciseResult {
  type: 'chunk-activation' | 'video-retelling' | 'logic-rewriting';
  timestamp: number;
  score: number;
  feedback: string;
  timeSpent: number;
}

export interface ThinkFeedbackDashboardProps {
  results: ExerciseResult[];
  onRestart: () => void;
  onBack: () => void;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ResultCard({ result }: { result: ExerciseResult }) {
  const getExerciseLabel = (type: ExerciseResult['type']) => {
    switch (type) {
      case 'chunk-activation':
        return '语块激活';
      case 'video-retelling':
        return '视频复述';
      case 'logic-rewriting':
        return '逻辑重写';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'from-green-500 to-emerald-500';
    if (score >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
            {getExerciseLabel(result.type)}
          </p>
          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
            {result.feedback}
          </p>
        </div>
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(
            result.score
          )} flex items-center justify-center text-white text-xl font-black shadow-lg flex-shrink-0 ml-3`}
        >
          {result.score.toFixed(1)}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
        <Clock className="w-3 h-3" />
        <span>{Math.round(result.timeSpent)} 秒</span>
      </div>
    </motion.div>
  );
}

export function ThinkFeedbackDashboard({
  results,
  onRestart,
  onBack,
}: ThinkFeedbackDashboardProps) {
  const avgScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

  const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);

  return (
    <div className="think-feedback-dashboard px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-xl">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          练习完成！🎉
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          你已经完成了本次练习，表现很棒！
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="完成练习"
          value={results.length}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="平均得分"
          value={`${avgScore.toFixed(1)}`}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="总用时"
          value={`${Math.round(totalTime)}秒`}
        />
      </div>

      {/* Results */}
      <div className="space-y-3 mb-8">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
          练习详情
        </h3>
        {results.map((result, index) => (
          <ResultCard key={index} result={result} />
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          继续练习
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="w-full py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-black rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          返回首页
        </motion.button>
      </div>
    </div>
  );
}

export default ThinkFeedbackDashboard;
