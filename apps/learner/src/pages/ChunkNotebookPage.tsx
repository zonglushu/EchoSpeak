/**
 * Chunk Notebook Page - Display all saved chunks
 *
 * Features:
 * - View all saved chunks by category
 * - Search functionality
 * - Delete chunks
 * - View chunk statistics
 */

import React, { useState, useMemo } from 'react';
import { useChunks } from '../contexts/ChunkContext';
import { ChunkCategory, SavedChunk } from '../types/mode';
import { Trash2, Search, Filter, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_LABELS: Record<ChunkCategory, string> = {
  [ChunkCategory.BUSINESS]: '职场',
  [ChunkCategory.ACADEMIC]: '学术',
  [ChunkCategory.DAILY_LIFE]: '日常',
  [ChunkCategory.TRAVEL]: '旅行',
  [ChunkCategory.IDIOM]: '习语',
  [ChunkCategory.CUSTOM]: '自定义'
};

const CATEGORY_COLORS: Record<ChunkCategory, string> = {
  [ChunkCategory.BUSINESS]: 'bg-blue-100 text-blue-700',
  [ChunkCategory.ACADEMIC]: 'bg-purple-100 text-purple-700',
  [ChunkCategory.DAILY_LIFE]: 'bg-green-100 text-green-700',
  [ChunkCategory.TRAVEL]: 'bg-orange-100 text-orange-700',
  [ChunkCategory.IDIOM]: 'bg-pink-100 text-pink-700',
  [ChunkCategory.CUSTOM]: 'bg-gray-100 text-gray-700'
};

const ChunkNotebookPage: React.FC = () => {
  const { chunks, statistics, deleteChunk, isLoading } = useChunks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChunkCategory | 'all'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filter chunks
  const filteredChunks = useMemo(() => {
    return chunks.filter(chunk => {
      const matchesSearch = searchQuery === '' ||
        chunk.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chunk.translation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || chunk.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [chunks, searchQuery, selectedCategory]);

  const handleDelete = async (id: string) => {
    try {
      await deleteChunk(id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete chunk:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-32">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                我的语块本
              </h1>
              <p className="text-gray-500 mt-1">Collection of phrases and expressions</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{statistics.totalCollected}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">Total Chunks</div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{statistics.masteredCount}</div>
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Mastered</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="text-2xl font-bold text-orange-700">{statistics.dueForReview}</div>
              <div className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Due for Review</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {Object.values(statistics.byCategory).reduce((a, b) => Math.max(a, b), 0)}
              </div>
              <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Top Category</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search phrases or translations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ChunkCategory | 'all')}
                className="pl-10 pr-8 py-3 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Categories</option>
                {Object.values(ChunkCategory).map(cat => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]} ({statistics.byCategory[cat]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chunk List */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {filteredChunks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No chunks found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start collecting phrases in Flow mode!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChunks.map((chunk) => (
              <motion.div
                key={chunk.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${CATEGORY_COLORS[chunk.category]}`}>
                        {CATEGORY_LABELS[chunk.category]}
                      </span>
                      {chunk.sourceTitle && (
                        <span className="text-xs text-gray-400">
                          from {chunk.sourceTitle}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-relaxed">
                      {chunk.text}
                    </h3>

                    {chunk.translation && (
                      <p className="text-gray-600 text-base mb-3">
                        {chunk.translation}
                      </p>
                    )}

                    {(chunk.contextBefore || chunk.contextAfter) && (
                      <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3 mt-2">
                        {chunk.contextBefore && <span>...{chunk.contextBefore} </span>}
                        <span className="font-semibold text-indigo-600">{chunk.text}</span>
                        {chunk.contextAfter && <span> {chunk.contextAfter}...</span>}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center space-x-6 mt-4 text-xs text-gray-500">
                      <div>
                        <span className="font-semibold">Collected:</span>{' '}
                        {new Date(chunk.collectedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-semibold">Practiced:</span>{' '}
                        {chunk.practiceCount}x
                      </div>
                      <div>
                        <span className="font-semibold">Mastery:</span>{' '}
                        {Math.round(chunk.masteryLevel * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {showDeleteConfirm === chunk.id ? (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDelete(chunk.id)}
                        className="px-3 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(chunk.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-4"
                      title="Delete chunk"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChunkNotebookPage;
