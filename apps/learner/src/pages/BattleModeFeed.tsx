import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BookOpen, Zap, Flame, Sparkles, Trophy, Play, Target } from 'lucide-react';
import { GlobalHeader } from '../components/GlobalHeader';
import { UserStats } from '@echospeak/types';
import { toast, EmptyState } from '../components/ui';

// Mock data - 实际应该从 API 获取
const BATTLE_VIDEOS = [
  {
    id: 'battle-1',
    title: 'Business Meeting Simulation',
    category: 'Business',
    difficulty: '高级',
    duration: '25:30',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '模拟真实商务会议场景，包含谈判和讨论',
  },
  {
    id: 'battle-2',
    title: 'IELTS Speaking Practice',
    category: 'Exam Prep',
    difficulty: '中级',
    duration: '20:15',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: 'IELTS 口语全真模拟练习',
  },
  {
    id: 'battle-3',
    title: 'Job Interview Roleplay',
    category: 'Career',
    difficulty: '中级',
    duration: '18:45',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    description: '求职面试角色扮演，提升表达自信',
  },
];

const difficulties = [
  { id: 'all', name: '全部', emoji: '⚔️' },
  { id: 'beginner', name: '初级', emoji: '🌱' },
  { id: 'intermediate', name: '中级', emoji: '🌿' },
  { id: 'advanced', name: '高级', emoji: '🌳' },
];

const contentTypes = [
  { id: 'recommend', name: '推荐', icon: Trophy },
  { id: 'hot', name: '热门', icon: Flame },
  { id: 'new', name: '最新', icon: Sparkles },
];

interface BattleModeFeedProps {
  userStats?: UserStats | null;
}

export function BattleModeFeed({ userStats }: BattleModeFeedProps = {}) {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState('all');
  const [contentType, setContentType] = useState('recommend');

  const handleVideoClick = (videoId: string, title: string) => {
    toast.success(`开始挑战：${title}`);
    navigate(`/video/${videoId}?mode=battle`);
  };

  const handleStartBattle = () => {
    navigate('/battle/mission');
  };

  // Filter videos by difficulty
  const filteredVideos = difficulty === 'all'
    ? BATTLE_VIDEOS
    : BATTLE_VIDEOS.filter(video => {
        const difficultyMap: Record<string, string> = {
          'beginner': '初级',
          'intermediate': '中级',
          'advanced': '高级'
        };
        return video.difficulty === difficultyMap[difficulty];
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-950 dark:to-rose-950 pb-24">
      {/* Global Header - Compact Mode */}
      <GlobalHeader
        mode="compact"
        userStats={userStats}
        showBackButton={true}
        showStreak={false}
        showAvatar={false}
        onBackClick={() => navigate('/?path=browse')}
        modeTitle="Battle 模式"
        modeDescription="实战练习 • 角色扮演"
        modeEmoji="⚔️"
        className="border-rose-200 dark:border-rose-800"
      />

      {/* Filter Section */}
      <div className="sticky top-[73px] z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-rose-200 dark:border-rose-800 p-4">
        {/* Difficulty Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {difficulties.map(diff => (
            <button
              key={diff.id}
              onClick={() => setDifficulty(diff.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold
                transition-all duration-200
                ${difficulty === diff.id
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {diff.emoji} {diff.name}
            </button>
          ))}
        </div>

        {/* Content Type Switch */}
        <div className="flex gap-3 mt-3">
          {contentTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  contentType === type.id
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {type.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Info Banner */}
      <div className="p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-500 to-red-500 rounded-3xl p-6 text-white shadow-xl"
        >
          <h2 className="text-xl font-black mb-2">适合什么时候学习？</h2>
          <div className="space-y-2 text-sm opacity-90">
            <p>✓ 晚间专注 (20:00-20:45)</p>
            <p>✓ 周末深度学习 (集中训练)</p>
            <p>✓ 需要高强度练习时</p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs font-medium opacity-80">建议时长：20-40 分钟</p>
          </div>
        </motion.div>

        {/* Start Battle CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleStartBattle}
          className="w-full py-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-3xl shadow-xl shadow-rose-500/30 transition-all flex items-center justify-center gap-3"
        >
          <Target className="w-6 h-6" />
          <span className="text-lg font-black">Start Mission Mode</span>
          <Play className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Video List */}
      <div className="px-6 space-y-4">
        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-500" />
          Battle 专属视频库 ({filteredVideos.length})
        </h2>

        {filteredVideos.length === 0 ? (
          <EmptyState
            type="no-videos"
            title="该难度暂无视频"
            description="试试其他难度吧"
            variant="default"
          />
        ) : (
          filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVideoClick(video.id, video.title)}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
          >
            <div className="flex gap-4 p-4">
              {/* Thumbnail */}
              <div className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-900">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  {video.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full font-medium">
                    {video.category}
                  </span>
                  <span>•</span>
                  <span>{video.difficulty}</span>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        ))
        )}

        {/* Load More */}
        {filteredVideos.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white dark:bg-gray-800 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 border-2 border-dashed border-rose-300 dark:border-rose-700 hover:border-rose-400 transition-all"
          >
            加载更多视频
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default BattleModeFeed;
