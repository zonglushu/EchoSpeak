/**
 * Logic Rewriting Exercise - AI-powered sentence transformation challenges
 *
 * Features:
 * - AI generates sentence rewriting challenges
 * - Four challenge types: vocabulary upgrade, grammar structure, logic extension, style transformation
 * - User attempts to rewrite sentences
 * - AI evaluates quality (0-5 scale)
 * - Supports generating new challenges
 *
 * @module components/Think/LogicRewritingExercise
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, CheckCircle, Loader2, Lightbulb } from 'lucide-react';
import { useThink } from '../../contexts/ThinkContext';
import type { LogicRewritingExercise as LogicRewritingExerciseType } from '../../types/mode';

export interface LogicRewritingExerciseProps {
  onComplete: (result: ExerciseResult) => void;
}

export interface ExerciseResult {
  type: 'logic-rewriting';
  timestamp: number;
  score: number;
  feedback: string;
  timeSpent: number;
}

const CHALLENGE_TYPE_LABELS: Record<
  LogicRewritingExerciseType['challengeType'],
  string
> = {
  'vocabulary-upgrade': '词汇升级',
  'grammar-structure': '语法结构',
  'logic-extension': '逻辑扩展',
  'style-transformation': '风格转换',
};

const CHALLENGE_TYPE_ICONS: Record<
  LogicRewritingExerciseType['challengeType'],
  string
> = {
  'vocabulary-upgrade': '📚',
  'grammar-structure': '🔧',
  'logic-extension': '🔗',
  'style-transformation': '✨',
};

export function LogicRewritingExercise({
  onComplete,
}: LogicRewritingExerciseProps) {
  const {
    state: { logicRewritingState, isLoading },
    generateLogicChallenge,
    submitLogicAnswer,
    retryLogicChallenge,
    advanceToNextChallenge,
  } = useThink();

  const [localAttempt, setLocalAttempt] = useState('');

  // Generate initial challenge on mount
  useEffect(() => {
    generateLogicChallenge();
  }, [generateLogicChallenge]);

  // Sync local attempt with context when challenge changes
  useEffect(() => {
    if (logicRewritingState.challenge && !logicRewritingState.result) {
      setLocalAttempt('');
    }
  }, [logicRewritingState.challenge, logicRewritingState.result]);

  const handleSubmit = async () => {
    if (!logicRewritingState.challenge || !localAttempt.trim()) return;

    // Update context state with user attempt before submitting
    setLocalAttempt(localAttempt);
    await submitLogicAnswer(localAttempt);
  };

  const handleNewChallenge = () => {
    setLocalAttempt('');

    if (logicRewritingState.completedCount >= 2) {
      const totalTime = (Date.now() - logicRewritingState.startTime) / 1000;
      const avgScore = logicRewritingState.result?.score ?? 3;
      onComplete({
        type: 'logic-rewriting',
        timestamp: Date.now(),
        score: avgScore,
        feedback: logicRewritingState.result?.feedback ?? 'Logic rewriting exercise completed',
        timeSpent: totalTime,
      });
    } else {
      advanceToNextChallenge();
    }
  };

  const handleRetry = () => {
    setLocalAttempt('');
    retryLogicChallenge();
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'from-green-500 to-emerald-500';
    if (score >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  if (isLoading || !logicRewritingState.challenge) {
    return (
      <div className="logic-rewriting-exercise px-6 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
          <p className="text-gray-900 dark:text-white font-black">AI 正在生成挑战...</p>
        </div>
      </div>
    );
  }

  const progress = Math.min(((logicRewritingState.completedCount + 1) / 3) * 100, 100);

  return (
    <div className="logic-rewriting-exercise px-6 py-4">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
            挑战进度
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {logicRewritingState.completedCount + 1}/3
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Challenge Card */}
      <motion.div
        key={logicRewritingState.challenge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 mb-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center text-2xl">
            {CHALLENGE_TYPE_ICONS[logicRewritingState.challenge.challengeType]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              句子升级挑战
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {CHALLENGE_TYPE_LABELS[logicRewritingState.challenge.challengeType]}
            </p>
          </div>
        </div>

        {/* Original Sentence */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
            原句
          </p>
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
            <p className="text-base text-gray-900 dark:text-white">
              "{logicRewritingState.challenge.originalAnswer}"
            </p>
          </div>
        </div>

        {/* Challenge Type */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
            挑战目标
          </p>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-sm text-gray-900 dark:text-white">
              {logicRewritingState.challenge.targetElement}
            </p>
          </div>
        </div>

        {/* Hint */}
        {logicRewritingState.challenge.hint && (
          <div className="mb-6">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                  提示
                </p>
                <p className="text-xs text-gray-900 dark:text-white">
                  {logicRewritingState.challenge.hint}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Input */}
      <AnimatePresence mode="wait">
        {!logicRewritingState.result ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 mb-6"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              你的答案
            </h3>
            <textarea
              value={localAttempt}
              onChange={(e) => setLocalAttempt(e.target.value)}
              placeholder="输入你改进后的句子..."
              disabled={isLoading}
              className="w-full h-32 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar mb-4"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!localAttempt.trim() || isLoading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  评估中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  提交答案
                </>
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 mb-6"
          >
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 text-center">
              评估结果
            </h3>

            {/* Score */}
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className={`w-24 h-24 mx-auto bg-gradient-to-br ${getScoreColor(
                  logicRewritingState.result.score
                )} rounded-full flex items-center justify-center text-white text-3xl font-black shadow-xl mb-4`}
              >
                {logicRewritingState.result.score}
              </motion.div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                / 5 分
              </p>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                  {logicRewritingState.result.feedback}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewChallenge}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {logicRewritingState.completedCount >= 2 ? (
                  <>
                    完成练习
                    <CheckCircle className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    下一挑战
                    <RotateCcw className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              {logicRewritingState.completedCount < 2 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="w-full py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-black rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  重新尝试
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LogicRewritingExercise;
