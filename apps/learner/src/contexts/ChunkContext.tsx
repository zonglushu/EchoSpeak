/**
 * Chunk Context - Global state management for SavedChunks
 *
 * Provides:
 * - Chunk CRUD operations
 * - Category filtering
 * - SRS review queue
 * - Statistics
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SavedChunk, ChunkCategory } from '../types/mode';
import { chunkService } from '../services/chunkService';

interface ChunkContextValue {
  // Data
  chunks: SavedChunk[];
  dueForReview: SavedChunk[];
  statistics: {
    totalCollected: number;
    masteredCount: number;
    dueForReview: number;
    byCategory: Record<ChunkCategory, number>;
  };

  // Loading state
  isLoading: boolean;

  // Operations
  saveChunk: (chunk: Partial<SavedChunk>) => Promise<string>;
  deleteChunk: (id: string) => Promise<void>;
  updateMastery: (chunkId: string, quality: number) => Promise<void>;
  refreshChunks: () => Promise<void>;

  // Filtering
  getChunksByCategory: (category: ChunkCategory) => Promise<SavedChunk[]>;
}

const ChunkContext = createContext<ChunkContextValue | undefined>(undefined);

export const useChunks = () => {
  const context = useContext(ChunkContext);
  if (!context) {
    throw new Error('useChunks must be used within ChunkProvider');
  }
  return context;
};

interface ChunkProviderProps {
  children: ReactNode;
}

export const ChunkProvider: React.FC<ChunkProviderProps> = ({ children }) => {
  const [chunks, setChunks] = useState<SavedChunk[]>([]);
  const [dueForReview, setDueForReview] = useState<SavedChunk[]>([]);
  const [statistics, setStatistics] = useState({
    totalCollected: 0,
    masteredCount: 0,
    dueForReview: 0,
    byCategory: {} as Record<ChunkCategory, number>
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  const refreshChunks = async () => {
    try {
      setIsLoading(true);
      const [allChunks, dueChunks, stats] = await Promise.all([
        chunkService.getAllChunks(),
        chunkService.getDueForReview(),
        chunkService.getStatistics()
      ]);

      setChunks(allChunks);
      setDueForReview(dueChunks);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load chunks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshChunks();
  }, []);

  // Save a new chunk
  const saveChunk = async (chunk: Partial<SavedChunk>): Promise<string> => {
    try {
      const id = await chunkService.saveChunk(chunk);
      // Refresh all data
      await refreshChunks();
      return id;
    } catch (error) {
      console.error('Failed to save chunk:', error);
      throw error;
    }
  };

  // Delete a chunk
  const deleteChunk = async (id: string) => {
    try {
      await chunkService.deleteChunk(id);
      await refreshChunks();
    } catch (error) {
      console.error('Failed to delete chunk:', error);
      throw error;
    }
  };

  // Update mastery (SRS)
  const updateMastery = async (chunkId: string, quality: number) => {
    try {
      await chunkService.updateMastery(chunkId, quality);
      await refreshChunks();
    } catch (error) {
      console.error('Failed to update mastery:', error);
      throw error;
    }
  };

  // Get chunks by category
  const getChunksByCategory = async (category: ChunkCategory): Promise<SavedChunk[]> => {
    return await chunkService.getChunksByCategory(category);
  };

  const value: ChunkContextValue = {
    chunks,
    dueForReview,
    statistics,
    isLoading,
    saveChunk,
    deleteChunk,
    updateMastery,
    refreshChunks,
    getChunksByCategory
  };

  return (
    <ChunkContext.Provider value={value}>
      {children}
    </ChunkContext.Provider>
  );
};
