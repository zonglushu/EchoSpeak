/**
 * Mission Selector Component
 *
 * Displays available missions for Battle mode with filtering options.
 * Users can browse and select missions to start.
 *
 * @module components/Battle/MissionSelector
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Sparkles, Zap } from 'lucide-react';
import type { Mission } from '../../types/mode';
import { missionService } from '../../services/missionService';

interface MissionSelectorProps {
  onMissionSelect: (mission: Mission) => void;
}

export function MissionSelector({ onMissionSelect }: MissionSelectorProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'business' | 'academic' | 'travel'>('all');
  const [contentType, setContentType] = useState<'recommend' | 'hot' | 'new'>('recommend');

  useEffect(() => {
    loadMissions();
  }, [filter]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      let data: Mission[];
      if (filter === 'all') {
        data = await missionService.getAllMissions();
      } else {
        data = await missionService.getMissionsByCategory(filter);
      }
      setMissions(data);
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMissions = () => {
    if (contentType === 'recommend') {
      return missions.filter(m => m.difficulty <= 2);
    }
    // For MVP, 'hot' and 'new' return all missions
    return missions;
  };

  const filteredMissions = getFilteredMissions();

  const categories: Array<{ id: typeof filter; name: string; emoji: string }> = [
    { id: 'all', name: 'All', emoji: '⚔️' },
    { id: 'business', name: 'Business', emoji: '💼' },
    { id: 'academic', name: 'Academic', emoji: '📚' },
    { id: 'travel', name: 'Travel', emoji: '✈️' },
  ];

  const contentTypes: Array<{ id: typeof contentType; name: string; icon: any }> = [
    { id: 'recommend', name: 'Recommended', icon: Trophy },
    { id: 'hot', name: 'Popular', icon: Flame },
    { id: 'new', name: 'New', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-950 dark:to-rose-950 pb-24 overflow-y-auto overflow-x-hidden">
      {/* Filter Section */}
      <div className="sticky top-[73px] z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-rose-200 dark:border-rose-800 p-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold
                transition-all duration-200
                ${filter === cat.id
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {cat.emoji} {cat.name}
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

      {/* Mission List */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
            Available Missions ({filteredMissions.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-600 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMissions.map((mission, index) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClick={() => onMissionSelect(mission)}
                index={index}
              />
            ))}

            {filteredMissions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No missions found in this category.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MissionCardProps {
  mission: Mission;
  onClick: () => void;
  index: number;
}

function MissionCard({ mission, onClick, index }: MissionCardProps) {
  const difficultyStars = '⭐'.repeat(mission.difficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {mission.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm">{difficultyStars}</span>
            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-medium capitalize">
              {mission.category}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {mission.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {mission.prerequisites.words.length} words to practice
        </span>
        <span>•</span>
        <span>Min accuracy: {(mission.prerequisites.minAccuracy * 100).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
}
