/**
 * Drill Phase Component
 *
 * Pre-dialogue pronunciation practice phase where users must
 * master key vocabulary before proceeding to the main dialogue.
 * Acts as a hard gate to ensure preparation.
 *
 * @module components/Battle/DrillPhase
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle } from 'lucide-react';
import type { Mission } from '../../types/mode';
import { AudioRecorder } from './AudioRecorder';

interface DrillPhaseProps {
  mission: Mission;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

export function DrillPhase({ mission, onComplete, onCancel }: DrillPhaseProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordScores, setWordScores] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const words = mission.prerequisites.words;
  const currentWord = words[currentWordIndex];
  const progress = ((currentWordIndex + (wordScores[currentWord] !== undefined ? 1 : 0)) / words.length) * 100;
  const completedCount = Object.keys(wordScores).length;

  const handleWordComplete = (word: string, score: number) => {
    setWordScores(prev => ({ ...prev, [word]: score }));

    if (currentWordIndex < words.length - 1) {
      setTimeout(() => {
        setCurrentWordIndex(prev => prev + 1);
      }, 500);
    } else {
      // All words completed, check if passed
      const scores = [...Object.values(wordScores), score];
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const passed = averageScore >= mission.prerequisites.minAccuracy;

      setTimeout(() => {
        setShowResult(true);
        setTimeout(() => {
          onComplete(passed);
        }, 2000);
      }, 500);
    }
  };

  /**
   * Calculates pronunciation accuracy by comparing recognized text with target word
   * Uses string similarity and common pronunciation variations
   */
  const calculateAccuracy = (recognizedText: string, targetWord: string): number => {
    const normalized = recognizedText.toLowerCase().trim();
    const target = targetWord.toLowerCase().trim();

    // Exact match
    if (normalized === target) {
      return 1.0;
    }

    // Check if target is contained in recognized text (with articles/prepositions)
    if (normalized.includes(target)) {
      return 0.95;
    }

    // Levenshtein distance for similarity
    const levenshteinDistance = (a: string, b: string): number => {
      const matrix: number[][] = [];

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }

      return matrix[b.length][a.length];
    };

    const distance = levenshteinDistance(normalized, target);
    const maxLength = Math.max(normalized.length, target.length);
    const similarity = 1 - distance / maxLength;

    // If similarity is high enough, return it
    if (similarity >= 0.7) {
      return similarity;
    }

    // Default low score for poor match
    return 0.4;
  };

  const handleTranscript = (transcript: string) => {
    const accuracy = calculateAccuracy(transcript, currentWord);
    handleWordComplete(currentWord, accuracy);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-950 dark:to-rose-950 pb-24 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-rose-200 dark:border-rose-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
            aria-label="取消"
          >
            <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Practice Phase</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Master {words.length} words to unlock the mission
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 to-red-500 rounded-3xl p-6 text-white shadow-xl"
        >
          <h2 className="text-xl font-black mb-2">🎯 Practice First</h2>
          <p className="text-sm opacity-90">
            Master these key words before the mission. You need {(mission.prerequisites.minAccuracy * 100).toFixed(0)}%
            average accuracy to proceed.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Progress</span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              {completedCount}/{words.length}
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Current Word Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Word {currentWordIndex + 1} of {words.length}
              </p>
              <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6">
                {currentWord}
              </h3>

              {/* Audio Recorder */}
              {wordScores[currentWord] !== undefined ? (
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
                    ✓ Completed!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Accuracy: {(wordScores[currentWord] * 100).toFixed(0)}%
                  </p>
                </div>
              ) : (
                <AudioRecorder
                  onTranscript={handleTranscript}
                  maxLength={10000}
                  language="en-US"
                  className="max-w-xs mx-auto"
                />
              )}

              {/* Instructions */}
              {wordScores[currentWord] === undefined && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-500 dark:text-gray-400 mt-4"
                >
                  按住按钮并清晰地说出单词
                </motion.p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Word List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Word List</p>
          <div className="grid grid-cols-2 gap-2">
            {words.map((word, index) => {
              const status = wordScores[word] !== undefined
                ? 'completed'
                : index === currentWordIndex
                ? 'current'
                : 'pending';

              return (
                <WordItem
                  key={word}
                  word={word}
                  status={status}
                  score={wordScores[word]}
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {(() => {
                const scores = Object.values(wordScores);
                const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                const passed = averageScore >= mission.prerequisites.minAccuracy;

                return (
                  <>
                    <div className="text-6xl mb-4">
                      {passed ? '🎉' : '💪'}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      {passed ? 'Great Job!' : 'Keep Practicing!'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Average accuracy: <span className="font-bold text-rose-600 dark:text-rose-400">{(averageScore * 100).toFixed(1)}%</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {passed
                        ? 'You\'ve unlocked the dialogue phase!'
                        : `You need ${(mission.prerequisites.minAccuracy * 100).toFixed(0)}% to proceed. Try again!`}
                    </p>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface WordItemProps {
  word: string;
  status: 'completed' | 'current' | 'pending';
  score?: number;
}

function WordItem({ word, status, score }: WordItemProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
        ${status === 'completed'
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : status === 'current'
          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }
      `}
    >
      {status === 'completed' ? (
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
      ) : status === 'current' ? (
        <Circle className="w-4 h-4 flex-shrink-0 fill-current" />
      ) : (
        <Circle className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="flex-1 truncate">{word}</span>
      {score !== undefined && (
        <span className="text-xs font-bold">{(score * 100).toFixed(0)}%</span>
      )}
    </div>
  );
}
