/**
 * Database module exports.
 *
 * Provides a clean public API for the database layer.
 */

export {
  openDatabase,
  closeDatabase,
  getChunkById,
  getAllChunks,
  getChunksByCategory,
  getChunksDueForReview,
  saveChunk,
  deleteChunk,
  saveChunks
} from './chunkDatabase';

export { DatabaseError } from './chunkDatabase';
