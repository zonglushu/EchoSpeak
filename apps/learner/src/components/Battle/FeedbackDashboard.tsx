/**
 * Feedback Dashboard Component
 *
 * Displays battle results with scores and feedback.
 * Shows overall performance, breakdown by category, and actionable feedback.
 *
 * @module components/Battle/FeedbackDashboard
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowRight, Trophy, X, Volume2, VolumeX } from 'lucide-react';
import type { BattleResult } from '../../types/mode';
import { ScoreBar } from './ScoreBar';

interface FeedbackDashboardProps {
  result: BattleResult;
  onRetry: () => void;
  onNext: () => void;
  onCancel: () => void;
  drillResults?: Record<string, number>; // word -> score
  userAudioUrl?: string; // URL to recorded audio for playback
}

export function FeedbackDashboard({
  result,
  onRetry,
  onNext,
  onCancel,
  drillResults,
  userAudioUrl
}: FeedbackDashboardProps) {
  const { overallScore, pronunciationScore, fluencyScore, contentScore, passed, feedback } = result;
  const totalScore = overallScore * 10;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-950 dark:to-rose-950 pb-24 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-rose-200 dark:border-rose-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Mission Complete!</h1>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            rounded-3xl p-8 text-center shadow-xl
            ${passed
              ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
            }
          `}
        >
          <div className="text-6xl mb-4">
            {passed ? '🎉' : '💪'}
          </div>
          <h2 className="text-3xl font-black mb-2">
            {passed ? 'Mission Accomplished!' : 'Keep Practicing!'}
          </h2>
          <div className="text-6xl font-black mb-2">
            {totalScore.toFixed(1)}
          </div>
          <p className="text-lg opacity-90">out of 10</p>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-4"
        >
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-rose-500" />
            Performance Breakdown
          </h3>

          <div className="space-y-4">
            <ScoreBar label="Pronunciation" score={pronunciationScore} color="rose" />
            <ScoreBar label="Fluency" score={fluencyScore} color="blue" />
            <ScoreBar label="Content Relevance" score={contentScore} color="green" />
          </div>
        </motion.div>

        {/* Pronunciation Heatmap */}
        {drillResults && Object.keys(drillResults).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-4"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-rose-500" />
              发音准确度
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(drillResults).map(([word, score]) => {
                const percentage = score * 100;
                const getColor = () => {
                  if (percentage >= 85) return 'bg-green-500';
                  if (percentage >= 70) return 'bg-yellow-500';
                  return 'bg-red-500';
                };
                const getTextColor = () => {
                  if (percentage >= 85) return 'text-green-600 dark:text-green-400';
                  if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
                  return 'text-red-600 dark:text-red-400';
                };

                return (
                  <div
                    key={word}
                    className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {word}
                      </span>
                      <span className={`text-xs font-bold ${getTextColor()}`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getColor()} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Audio Playback */}
        {userAudioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-4"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-rose-500" />
              你的录音
            </h3>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.play();
                    }
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <VolumeX className="w-5 h-5" />
                    暂停
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    播放录音
                  </>
                )}
              </button>

              <audio
                ref={audioRef}
                src={userAudioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          </motion.div>
        )}

        {/* Feedback Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-4"
        >
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Feedback & Tips</h3>

          <div className="space-y-3">
            {feedback.map((item, index) => (
              <FeedbackCard key={index} {...item} />
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 pt-2"
        >
          <button
            onClick={onRetry}
            className="w-full py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-rose-600 dark:text-rose-400 rounded-2xl text-base font-bold shadow-lg border-2 border-rose-300 dark:border-rose-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={onNext}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-2xl text-base font-bold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2"
          >
            Next Mission
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  category: string;
  message: string;
}

function FeedbackCard({ category, message }: FeedbackCardProps) {
  const getIcon = () => {
    switch (category) {
      case 'pronunciation':
        return '🎤';
      case 'grammar':
        return '📝';
      case 'pragmatics':
        return '🎯';
      case 'content':
        return '💡';
      default:
        return '✨';
    }
  };

  const getColor = () => {
    switch (category) {
      case 'pronunciation':
        return 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400';
      case 'grammar':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
      case 'pragmatics':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
      case 'content':
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getColor()}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase mb-1 opacity-70">{category}</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
