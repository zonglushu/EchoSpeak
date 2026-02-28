/**
 * Think Mode Practice Page - Main orchestrator for Think mode exercises
 *
 * Features:
 * - Exercise selection (Chunk Activation, Video Retelling, Logic Rewriting)
 * - Phase management between exercises
 * - Results collection and feedback display
 *
 * @module pages/ThinkModePracticePage
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseSelector } from '../components/Think/ExerciseSelector';
import { ChunkActivationExercise, type ExerciseResult } from '../components/Think/ChunkActivationExercise';
import { VideoRetellingExercise } from '../components/Think/VideoRetellingExercise';
import { LogicRewritingExercise } from '../components/Think/LogicRewritingExercise';
import { ThinkFeedbackDashboard } from '../components/Think/ThinkFeedbackDashboard';
import type { ExerciseType } from '../types/mode';
import { saveThinkExerciseResult } from '../services/db/chunkDatabase';
import { Confetti, AchievementPopup } from '../components/ui';

type ThinkPhase =
  | 'exercise-selection'
  | 'chunk-activation'
  | 'video-retelling'
  | 'logic-rewriting'
  | 'feedback';

export function ThinkModePracticePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ThinkPhase>('exercise-selection');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{ title: string; description: string; icon: string } | null>(null);

  const handleExerciseSelect = (type: ExerciseType) => {
    switch (type) {
      case 'chunk-activation':
        setPhase('chunk-activation');
        break;
      case 'video-retelling':
        setPhase('video-retelling');
        break;
      case 'logic-rewriting':
        setPhase('logic-rewriting');
        break;
    }
  };

  const handleExerciseComplete = async (result: ExerciseResult) => {
    // Save to IndexedDB
    try {
      await saveThinkExerciseResult(result);
      console.log('Exercise result saved:', result);
    } catch (error) {
      console.error('Failed to save exercise result:', error);
      // Continue anyway - saving failure shouldn't block the flow
    }

    setResults((prev) => [...prev, result]);
    setPhase('feedback');

    // Trigger celebrations for excellent performance
    if (result.score >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      setShowAchievement(true);
      setAchievementData({
        title: '🎉 太棒了！',
        description: `你在${result.type === 'chunk-activation' ? '语块激活' : result.type === 'video-retelling' ? '视频复述' : '逻辑重写'}练习中表现出色！`,
        icon: '🏆'
      });
      setTimeout(() => setShowAchievement(false), 4000);
    } else if (result.score >= 60) {
      setShowAchievement(true);
      setAchievementData({
        title: '👍 不错哦！',
        description: `继续努力，你一定能做得更好！`,
        icon: '💪'
      });
      setTimeout(() => setShowAchievement(false), 3000);
    }
  };

  const handleBack = () => {
    navigate('/mode/think');
  };

  const handleRestart = () => {
    setResults([]);
    setPhase('exercise-selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-indigo-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-indigo-200 dark:border-indigo-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">💡</span>
              <h1 className="text-lg font-black text-gray-900 dark:text-white">
                Think 模式练习
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {phase === 'exercise-selection' && '选择练习类型'}
              {phase === 'chunk-activation' && '语块激活练习'}
              {phase === 'video-retelling' && '视频复述练习'}
              {phase === 'logic-rewriting' && '逻辑重写练习'}
              {phase === 'feedback' && '练习反馈'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {phase === 'exercise-selection' && (
          <motion.div
            key="exercise-selection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            <ExerciseSelector onSelect={handleExerciseSelect} />
          </motion.div>
        )}

        {phase === 'chunk-activation' && (
          <motion.div
            key="chunk-activation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            <ChunkActivationExercise onComplete={handleExerciseComplete} />
          </motion.div>
        )}

        {phase === 'video-retelling' && (
          <motion.div
            key="video-retelling"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            <VideoRetellingExercise onComplete={handleExerciseComplete} />
          </motion.div>
        )}

        {phase === 'logic-rewriting' && (
          <motion.div
            key="logic-rewriting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            <LogicRewritingExercise onComplete={handleExerciseComplete} />
          </motion.div>
        )}

        {phase === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            <ThinkFeedbackDashboard
              results={results}
              onRestart={handleRestart}
              onBack={handleBack}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Celebration */}
      <Confetti trigger={showConfetti} particleCount={150} />

      {/* Achievement Popup */}
      {showAchievement && achievementData && (
        <AchievementPopup
          title={achievementData.title}
          description={achievementData.description}
          icon={achievementData.icon}
          visible={showAchievement}
          onClose={() => setShowAchievement(false)}
        />
      )}
    </div>
  );
}

export default ThinkModePracticePage;
