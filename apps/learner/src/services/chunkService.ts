/**
 * Chunk Service - Unified chunk management across all three modes
 *
 * Provides the public API for chunk operations including:
 * - CRUD operations for SavedChunks
 * - Auto-classification using keyword patterns
 * - Spaced Repetition System using SuperMemo-2 algorithm
 * - Statistics and duplicate detection
 *
 * This service acts as a facade over the database layer and utilities,
 * maintaining backward compatibility with the original API.
 *
 * @module services/chunkService
 */

import {
  SavedChunk,
  ChunkCategory,
  DB_STORES
} from '../types/mode';

// Database layer
import {
  openDatabase,
  getChunkById as dbGetChunkById,
  getAllChunks as dbGetAllChunks,
  getChunksByCategory as dbGetChunksByCategory,
  getChunksDueForReview as dbGetChunksDueForReview,
  saveChunk as dbSaveChunk,
  deleteChunk as dbDeleteChunk,
  DatabaseError
} from './db/index.ts';

// Error utilities
import {
  ValidationError,
  NotFoundError,
  logError,
  safeAsync,
  getErrorMessage,
} from './errors';

// Utilities
import { classifyCategory } from './utils/chunkClassifier';
import {
  applySuperMemo,
  createInitialState,
  type RecallQuality
} from './utils/superMemo';
import { ensureUUID } from './utils/uuid';

/**
 * Statistics summary for the chunk collection.
 */
export interface ChunkStatistics {
  /** Total number of collected chunks */
  totalCollected: number;
  /** Number of chunks with mastery level >= 0.8 */
  masteredCount: number;
  /** Number of chunks due for review now */
  dueForReview: number;
  /** Chunk count per category */
  byCategory: Record<ChunkCategory, number>;
}

/**
 * Partial chunk type for creation/update operations.
 */
export type PartialChunk = Partial<SavedChunk> & Pick<SavedChunk, 'text'>;

/**
 * Normalizes text for comparison (case-insensitive, trimmed).
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Creates a new SavedChunk with all required fields initialized.
 */
function createSavedChunk(partial: Partial<SavedChunk>): SavedChunk {
  const now = Date.now();
  const initialState = createInitialState();

  return {
    id: ensureUUID(partial.id),
    text: partial.text ?? '',
    translation: partial.translation ?? '',
    startTime: partial.startTime ?? 0,
    duration: partial.duration ?? 0,
    sourceId: partial.sourceId ?? '',
    sourceTitle: partial.sourceTitle,
    contextBefore: partial.contextBefore ?? '',
    contextAfter: partial.contextAfter ?? '',
    category: partial.category ?? ChunkCategory.DAILY_LIFE,
    collectedAt: partial.collectedAt ?? now,
    practiceCount: 0,
    masteryLevel: initialState.masteryLevel,
    nextReview: now,
    interval: initialState.interval,
    easeFactor: initialState.easeFactor,
    tags: partial.tags ?? [],
    notes: partial.notes
  };
}

/**
 * Chunk Service - Public API
 *
 * All methods maintain the original API for backward compatibility.
 */
export const chunkService = {
  /**
   * Saves a new chunk or updates an existing one.
   *
   * Auto-classifies the chunk if no category is provided.
   * Initializes SRS state for new chunks.
   *
   * @param chunk - Partial chunk data (must include text)
   * @returns Promise resolving to the saved chunk ID
   * @throws {ValidationError} If chunk text is missing
   * @throws {DatabaseError} If the database operation fails
   *
   * @example
   * ```ts
   * const id = await chunkService.saveChunk({
   *   text: "Hello, world!",
   *   translation: "你好，世界！",
   *   sourceId: "video-123"
   * });
   * ```
   */
  async saveChunk(chunk: Partial<SavedChunk>): Promise<string> {
    if (!chunk.text) {
      throw new ValidationError('Chunk text is required');
    }

    try {
      const db = await openDatabase();

      // Auto-classify if not provided
      const category = chunk.category ?? classifyCategory(chunk.text);

      const newChunk = createSavedChunk({ ...chunk, category });
      return dbSaveChunk(db, newChunk);
    } catch (error) {
      logError(error, 'chunkService.saveChunk');
      throw error;
    }
  },

  /**
   * Retrieves all chunks from the database.
   *
   * @returns Promise resolving to array of all chunks, sorted by collection date (newest first)
   * @throws {DatabaseError} If the database operation fails
   */
  async getAllChunks(): Promise<SavedChunk[]> {
    try {
      const db = await openDatabase();
      return dbGetAllChunks(db);
    } catch (error) {
      logError(error, 'chunkService.getAllChunks');
      throw error;
    }
  },

  /**
   * Retrieves all chunks matching a specific category.
   *
   * @param category - The category to filter by
   * @returns Promise resolving to array of matching chunks
   * @throws {DatabaseError} If the database operation fails
   */
  async getChunksByCategory(category: ChunkCategory): Promise<SavedChunk[]> {
    try {
      const db = await openDatabase();
      return dbGetChunksByCategory(db, category);
    } catch (error) {
      logError(error, 'chunkService.getChunksByCategory');
      throw error;
    }
  },

  /**
   * Retrieves all chunks due for review.
   *
   * A chunk is due if its nextReview timestamp is in the past.
   * Results are sorted by urgency (most overdue first).
   *
   * @returns Promise resolving to array of chunks due for review
   * @throws {DatabaseError} If the database operation fails
   */
  async getDueForReview(): Promise<SavedChunk[]> {
    try {
      const db = await openDatabase();
      const now = Date.now();
      return dbGetChunksDueForReview(db, now);
    } catch (error) {
      logError(error, 'chunkService.getDueForReview');
      throw error;
    }
  },

  /**
   * Retrieves a single chunk by its ID.
   *
   * @param id - The chunk identifier
   * @returns Promise resolving to the chunk, or null if not found
   * @throws {DatabaseError} If the database operation fails
   */
  async getChunkById(id: string): Promise<SavedChunk | null> {
    try {
      const db = await openDatabase();
      return dbGetChunkById(db, id);
    } catch (error) {
      logError(error, 'chunkService.getChunkById');
      throw error;
    }
  },

  /**
   * Updates a chunk's mastery state after a practice session.
   *
   * Applies the SuperMemo-2 algorithm to calculate the next review date
   * based on the user's recall quality rating.
   *
   * @param chunkId - The chunk identifier
   * @param quality - Recall quality rating (0-5, where 5 is perfect recall)
   * @returns Promise that resolves when the update is complete
   * @throws {ValidationError} If quality is not a valid number between 0-5
   * @throws {NotFoundError} If the chunk is not found
   * @throws {DatabaseError} If the database operation fails
   *
   * @example
   * ```ts
   * // After a good practice session
   * await chunkService.updateMastery('chunk-123', 4);
   *
   * // After forgetting the chunk
   * await chunkService.updateMastery('chunk-123', 1);
   * ```
   */
  async updateMastery(chunkId: string, quality: number): Promise<void> {
    if (typeof quality !== 'number' || quality < 0 || quality > 5) {
      throw new ValidationError(`Quality must be a number between 0 and 5, got ${quality}`);
    }

    try {
      const chunk = await this.getChunkById(chunkId);
      if (!chunk) {
        throw new NotFoundError(`Chunk not found: ${chunkId}`);
      }

      const db = await openDatabase();

      // Apply SuperMemo-2 algorithm
      const result = applySuperMemo(
        {
          interval: chunk.interval ?? 0,
          easeFactor: chunk.easeFactor ?? 2.5,
          masteryLevel: chunk.masteryLevel ?? 0
        },
        quality as RecallQuality
      );

      // Update the chunk
      const updatedChunk: SavedChunk = {
        ...chunk,
        interval: result.interval,
        easeFactor: result.easeFactor,
        nextReview: result.nextReviewTime,
        masteryLevel: result.masteryLevel,
        practiceCount: (chunk.practiceCount ?? 0) + 1
      };

      await dbSaveChunk(db, updatedChunk);
    } catch (error) {
      logError(error, 'chunkService.updateMastery');
      throw error;
    }
  },

  /**
   * Deletes a chunk from the database.
   *
   * @param id - The chunk identifier
   * @returns Promise that resolves when the deletion is complete
   * @throws {DatabaseError} If the database operation fails
   */
  async deleteChunk(id: string): Promise<void> {
    try {
      const db = await openDatabase();
      await dbDeleteChunk(db, id);
    } catch (error) {
      logError(error, 'chunkService.deleteChunk');
      throw error;
    }
  },

  /**
   * Calculates statistics across all chunks.
   *
   * @returns Promise resolving to statistics summary
   * @throws {DatabaseError} If the database operation fails
   */
  async getStatistics(): Promise<ChunkStatistics> {
    try {
      const allChunks = await this.getAllChunks();
      const now = Date.now();

      // Initialize category counts
      const byCategory = Object.fromEntries(
        Object.values(ChunkCategory).map((cat) => [cat, 0])
      ) as Record<ChunkCategory, number>;

      // Count by category
      for (const chunk of allChunks) {
        byCategory[chunk.category]++;
      }

      // Count mastered chunks (mastery >= 0.8)
      const masteredCount = allChunks.filter((c) => (c.masteryLevel ?? 0) >= 0.8).length;

      // Count chunks due for review
      const dueForReview = allChunks.filter((c) => (c.nextReview ?? 0) <= now).length;

      return {
        totalCollected: allChunks.length,
        masteredCount,
        dueForReview,
        byCategory
      };
    } catch (error) {
      logError(error, 'chunkService.getStatistics');
      throw error;
    }
  },

  /**
   * Checks if a chunk with the same text already exists.
   *
   * Comparison is case-insensitive and ignores surrounding whitespace.
   *
   * @param text - The text to check for duplicates
   * @returns Promise resolving to true if a duplicate exists
   * @throws {DatabaseError} If the database operation fails
   */
  async isDuplicate(text: string): Promise<boolean> {
    try {
      const allChunks = await this.getAllChunks();
      const normalizedText = normalizeText(text);

      return allChunks.some((chunk) => normalizeText(chunk.text) === normalizedText);
    } catch (error) {
      logError(error, 'chunkService.isDuplicate');
      throw error;
    }
  }
};
