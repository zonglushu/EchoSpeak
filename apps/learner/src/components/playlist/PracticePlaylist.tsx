/**
 * P0-3: Practice Playlist / Favorites System
 * Manages user's practice queue with drag-and-drop reordering
 */

import React, { useEffect, useState } from 'react';
import { Star, Trash2, Play, GripVertical, Plus, Clock } from 'lucide-react';
import {
  getPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  reorderPlaylist,
  formatDuration,
} from '../../services/p0FeaturesClient';
import { PracticePlaylistItem } from '@echospeak/types';

interface PracticePlaylistProps {
  userId?: string;
  onStartPractice?: (itemId: string) => void;
}

export const PracticePlaylist: React.FC<PracticePlaylistProps> = ({ userId, onStartPractice }) => {
  const [playlist, setPlaylist] = useState<PracticePlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadPlaylist();
  }, [userId]);

  const loadPlaylist = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const items = await getPlaylist(userId);
      setPlaylist(items);
    } catch (error) {
      console.error('Failed to load playlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!userId) return;

    try {
      await removeFromPlaylist(userId, itemId);
      setPlaylist(playlist.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error('Failed to remove from playlist:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();

    if (!userId || !draggedItem || draggedItem === targetItemId) return;

    const newPlaylist = [...playlist];
    const draggedIndex = newPlaylist.findIndex((item) => item.id === draggedItem);
    const targetIndex = newPlaylist.findIndex((item) => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder
    const [removed] = newPlaylist.splice(draggedIndex, 1);
    newPlaylist.splice(targetIndex, 0, removed);

    // Update sort_order
    const reorderedItems = newPlaylist.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setPlaylist(reorderedItems);

    try {
      await reorderPlaylist(userId, reorderedItems.map((item) => item.id));
    } catch (error) {
      console.error('Failed to reorder playlist:', error);
      // Revert on error
      setPlaylist(playlist);
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
        <div className="h-64 bg-gray-100 dark:bg-slate-700/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  const totalDuration = playlist.reduce((sum, item) => sum + (item.video_duration || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">待练清单</h3>
          <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {playlist.length} 个视频 • {formatDuration(totalDuration)}
          </div>
        </div>
        <button
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2"
          onClick={() => {
            // Open video selection modal (to be implemented)
            console.log('添加到清单');
          }}
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      {/* Playlist Items */}
      <div className="space-y-3">
        {playlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 dark:bg-slate-700/50 rounded-full">
                <Star className="w-8 h-8 text-gray-400 dark:text-slate-600" />
              </div>
            </div>
            <div className="text-gray-500 dark:text-slate-500 mb-2">清单为空</div>
            <div className="text-sm text-gray-600 dark:text-slate-600 mb-4">
              添加视频，稍后练习
            </div>
            <button
              className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all active:scale-95"
              onClick={() => {
                console.log('浏览视频');
              }}
            >
              浏览视频
            </button>
          </div>
        ) : (
          playlist.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              className={`bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 border transition-all cursor-pointer hover:border-gray-300 dark:hover:border-white/20 ${
                draggedItem === item.id ? 'opacity-50' : 'border-gray-200 dark:border-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="flex items-center gap-2 text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 mt-1">
                  <GripVertical className="w-5 h-5 cursor-grab" />
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>

                {/* Thumbnail */}
                {item.video_thumbnail && (
                  <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-800 flex-shrink-0">
                    <img
                      src={item.video_thumbnail}
                      alt={item.video_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                    {item.video_title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    {item.video_duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.video_duration)}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-gray-500 dark:text-slate-500 truncate max-w-xs">{item.notes}</div>
                    )}
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-0.5 bg-gray-200 dark:bg-slate-700/50 text-gray-700 dark:text-slate-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-slate-700/50 text-gray-700 dark:text-slate-400 text-xs rounded-full">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartPractice?.(item.asset_id || item.video_id || item.id)}
                    className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-all active:scale-95"
                    title="开始练习"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/40 text-red-600 dark:text-red-400 rounded-lg transition-all"
                    title="移除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      {playlist.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
          <div className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-2">
            <GripVertical className="w-4 h-4" />
            拖拽可调整练习顺序
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticePlaylist;
