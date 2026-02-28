/**
 * Video Retelling Exercise - Watch videos and answer comprehension questions
 *
 * Features:
 * - Select and watch short videos (30-45 seconds)
 * - View transcript for reference
 * - AI-generated comprehension questions
 * - Evaluation of content and language quality
 * - Detailed feedback in Chinese
 *
 * @module components/Think/VideoRetellingExercise
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, Loader2, FileText, Eye } from 'lucide-react';
import { useThink } from '../../contexts/ThinkContext';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { THINK_VIDEOS } from './videoData';

export interface VideoRetellingExerciseProps {
  onComplete: (result: ExerciseResult) => void;
}

export interface ExerciseResult {
  type: 'video-retelling';
  timestamp: number;
  score: number;
  feedback: string;
  timeSpent: number;
}

export function VideoRetellingExercise({
  onComplete,
}: VideoRetellingExerciseProps) {
  const {
    state: { videoRetellingState, isLoading },
    selectVideo,
    toggleTranscript,
    submitVideoAnswer,
    advanceToNextVideo,
  } = useThink();

  const [localAnswer, setLocalAnswer] = useState('');

  const currentVideo = THINK_VIDEOS[videoRetellingState.currentVideoIndex];

  const handleSubmit = async () => {
    if (!localAnswer.trim()) return;
    await submitVideoAnswer(localAnswer);
  };

  const handleNext = () => {
    setLocalAnswer('');

    if (videoRetellingState.currentVideoIndex < THINK_VIDEOS.length - 1) {
      advanceToNextVideo();
    } else {
      const totalTime = (Date.now() - videoRetellingState.startTime) / 1000;
      const avgScore = videoRetellingState.evaluation
        ? (videoRetellingState.evaluation.contentScore +
           videoRetellingState.evaluation.languageScore) / 2
        : 0.5;
      onComplete({
        type: 'video-retelling',
        timestamp: Date.now(),
        score: avgScore * 5,
        feedback: videoRetellingState.evaluation
          ? `${videoRetellingState.evaluation.feedback.content} ${videoRetellingState.evaluation.feedback.language}`
          : 'Video retelling exercise completed',
        timeSpent: totalTime,
      });
    }
  };

  const handleVideoSelect = (index: number) => {
    setLocalAnswer('');
    selectVideo(index);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-500 to-emerald-500';
    if (score >= 0.6) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="video-retelling-exercise px-6 py-4">
      {/* Video Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            选择视频 ({videoRetellingState.currentVideoIndex + 1}/{THINK_VIDEOS.length})
          </h3>
          <button
            onClick={toggleTranscript}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FileText className="w-3 h-3" />
            {videoRetellingState.showTranscript ? '隐藏' : '显示'}文本
          </button>
        </div>

        {/* Video Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
          {THINK_VIDEOS.map((video, index) => (
            <motion.button
              key={video.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVideoSelect(index)}
              className={`flex-shrink-0 w-40 rounded-xl overflow-hidden border-2 transition-all ${
                index === videoRetellingState.currentVideoIndex
                  ? 'border-indigo-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="relative">
                <div className="w-full h-24 bg-gray-900 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-gray-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                  {video.title}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {video.category}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Video Player */}
      <div className="mb-6">
        <VideoPlayer
          src={currentVideo.url}
          poster={currentVideo.thumbnail}
          className="aspect-video"
        />
      </div>

      {/* Transcript */}
      <AnimatePresence>
        {videoRetellingState.showTranscript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl"
          >
            <div className="flex items-start gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                {currentVideo.transcript}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          理解问题
        </h3>
        {videoRetellingState.isGeneratingQuestion ? (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              AI 正在生成问题...
            </span>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-900 dark:text-white">{videoRetellingState.question}</p>
            </div>
          </div>
        )}
      </div>

      {/* Answer Input */}
      <AnimatePresence mode="wait">
        {!videoRetellingState.evaluation ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                你的答案
              </h3>
              <textarea
                value={localAnswer}
                onChange={(e) => setLocalAnswer(e.target.value)}
                placeholder="用英语回答这个问题..."
                disabled={isLoading}
                className="w-full h-32 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors resize-none custom-scrollbar"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!localAnswer.trim() || isLoading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  评估中...
                </>
              ) : (
                '提交答案'
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 text-center">
              评估结果
            </h3>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`w-20 h-20 mx-auto mb-2 bg-gradient-to-br ${getScoreColor(
                    videoRetellingState.evaluation.contentScore
                  )} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg`}
                >
                  {(videoRetellingState.evaluation.contentScore * 100).toFixed(0)}%
                </motion.div>
                <p className="text-xs text-gray-600 dark:text-gray-400">内容得分</p>
              </div>
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`w-20 h-20 mx-auto mb-2 bg-gradient-to-br ${getScoreColor(
                    videoRetellingState.evaluation.languageScore
                  )} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg`}
                >
                  {(videoRetellingState.evaluation.languageScore * 100).toFixed(0)}%
                </motion.div>
                <p className="text-xs text-gray-600 dark:text-gray-400">语言得分</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">
                  内容反馈
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {videoRetellingState.evaluation.feedback.content}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">
                  语言反馈
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {videoRetellingState.evaluation.feedback.language}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1">
                  改进建议
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {videoRetellingState.evaluation.feedback.improvement}
                </p>
              </div>
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {videoRetellingState.currentVideoIndex < THINK_VIDEOS.length - 1 ? (
                <>
                  下一个视频
                  <Play className="w-5 h-5" />
                </>
              ) : (
                <>
                  完成练习
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VideoRetellingExercise;
