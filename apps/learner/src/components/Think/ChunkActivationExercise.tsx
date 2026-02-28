/**
 * Chunk Activation Exercise - Practice chunks using spaced repetition
 *
 * Features:
 * - Loads due chunks from SRS
 * - Random exercise format (sentence-creation, scenario-application, translation)
 * - AI evaluation with 0-5 scoring
 * - Updates SRS state automatically
 * - Progress tracking
 *
 * @module components/Think/ChunkActivationExercise
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useThink } from '../../contexts/ThinkContext';
import type { SavedChunk } from '../../types/mode';
import { ErrorAlert } from './ErrorAlert';
import { LoadingState } from './LoadingState';

export interface ChunkActivationExerciseProps {
  onComplete: (result: ExerciseResult) => void;
}

export interface ExerciseResult {
  type: 'chunk-activation';
  timestamp: number;
  score: number;
  feedback: string;
  timeSpent: number;
}

export function ChunkActivationExercise({
  onComplete,
}: ChunkActivationExerciseProps) {
  const {
    state: { chunkActivationState, isLoading, error },
    loadChunksForReview,
    generateChunkPrompt,
    submitChunkAnswer,
    advanceToNextChunk,
    clearError,
  } = useThink();

  const [localAnswer, setLocalAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load chunks on mount
  useEffect(() => {
    loadChunksForReview();
  }, [loadChunksForReview]);

  // Generate prompt when chunk changes
  useEffect(() => {
    const { chunks, currentIndex } = chunkActivationState;
    const currentChunk = chunks[currentIndex];

    if (currentChunk && !hasSubmitted) {
      const formats: Array<'sentence-creation' | 'scenario-application' | 'translation'> = [
        'sentence-creation',
        'scenario-application',
        'translation',
      ];
      const randomFormat = formats[Math.floor(Math.random() * formats.length)];
      generateChunkPrompt(currentChunk, randomFormat);
    }
  }, [chunkActivationState.chunks, chunkActivationState.currentIndex, generateChunkPrompt, hasSubmitted]);

  const currentChunk = chunkActivationState.chunks[chunkActivationState.currentIndex];

  const handleSubmit = async () => {
    if (!currentChunk || !localAnswer.trim()) return;

    setHasSubmitted(true);
    await submitChunkAnswer(localAnswer);

    // Auto-advance after 2 seconds
    setTimeout(() => {
      const { chunks, currentIndex } = chunkActivationState;

      if (currentIndex < chunks.length - 1) {
        setLocalAnswer('');
        setHasSubmitted(false);
        advanceToNextChunk();
      } else {
        // Exercise complete
        const totalTime = (Date.now() - chunkActivationState.startTime) / 1000;
        onComplete({
          type: 'chunk-activation',
          timestamp: Date.now(),
          score: chunkActivationState.feedback?.score ?? 0,
          feedback: chunkActivationState.feedback?.feedback ?? '',
          timeSpent: totalTime,
        });
      }
    }, 2000);
  };

  if (isLoading && chunkActivationState.chunks.length === 0) {
    return (
      <div className="chunk-activation-exercise px-6 py-8">
        <LoadingState message="正在加载待复习语块..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="chunk-activation-exercise px-6 py-8">
        <ErrorAlert
          message={error}
          type="error"
          onDismiss={clearError}
        />
        <div className="text-center py-10">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (chunkActivationState.chunks.length === 0) {
    return (
      <div className="chunk-activation-exercise px-6 py-8">
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-gray-900 dark:text-white font-black text-lg mb-2">
            暂无待复习语块
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            在其他模式下收集语块后，这里会显示待复习内容
          </p>
        </div>
      </div>
    );
  }

  const progress = chunkActivationState.chunks.length > 0
    ? ((chunkActivationState.currentIndex + 1) / chunkActivationState.chunks.length) * 100
    : 0;

  return (
    <div className="chunk-activation-exercise px-6 py-4">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
            进度
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {chunkActivationState.currentIndex + 1}/{chunkActivationState.chunks.length}
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

      {/* Exercise Card */}
      <motion.div
        key={currentChunk?.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
          语块激活练习
        </h3>

        {/* Chunk Info */}
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl">
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-2">
            {currentChunk?.text}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentChunk?.translation}
          </p>
        </div>

        {/* Prompt */}
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            练习要求
          </p>
          <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            {chunkActivationState.currentPrompt}
          </p>
        </div>

        {/* Answer Input */}
        <AnimatePresence mode="wait">
          {!chunkActivationState.feedback ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <textarea
                value={localAnswer}
                onChange={(e) => setLocalAnswer(e.target.value)}
                placeholder="输入你的答案..."
                disabled={isLoading}
                className="w-full h-32 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar"
                autoFocus
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!localAnswer.trim() || isLoading || hasSubmitted}
                className="w-full mt-4 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    评估中...
                  </>
                ) : (
                  <>
                    提交答案
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              {/* Score */}
              <div className="mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-xl"
                >
                  {chunkActivationState.feedback.score}
                </motion.div>
              </div>

              {/* Feedback */}
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {chunkActivationState.feedback.feedback}
              </p>

              {/* Next indicator */}
              {chunkActivationState.currentIndex < chunkActivationState.chunks.length - 1 ? (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  下一题自动加载中...
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  即将完成练习...
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default ChunkActivationExercise;
