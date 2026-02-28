/**
 * IndexedDB Database Layer for Chunk Storage
 *
 * Provides a low-level abstraction over IndexedDB operations for chunk storage.
 * Handles database opening, schema management, and CRUD operations.
 *
 * @module db/chunkDatabase
 */

import {
  SavedChunk,
  DB_CONFIG,
  DB_STORES,
  BattleResult
} from '../../types/mode';

/**
 * Database connection cache to avoid opening multiple connections.
 * The database connection is kept open for the lifetime of the app.
 */
let cachedDatabase: IDBDatabase | null = null;

/**
 * Custom error class for database-related errors.
 */
export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Type-safe event handler for IndexedDB upgrade events.
 */
interface IDBVersionChangeEvent extends Event {
  target: IDBOpenDBRequest;
  oldVersion: number;
  newVersion: number | null;
}

/**
 * Schema definition for each object store.
 */
interface StoreSchema {
  name: keyof typeof DB_STORES;
  keyPath: string | string[] | null;
  autoIncrement?: boolean;
  indexes: Array<{ name: string; keyPath: string; unique: boolean }>;
}

/**
 * Store schemas for database initialization.
 */
const STORE_SCHEMAS: readonly StoreSchema[] = [
  {
    name: 'CHUNKS',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'category', keyPath: 'category', unique: false },
      { name: 'collectedAt', keyPath: 'collectedAt', unique: false },
      { name: 'nextReview', keyPath: 'nextReview', unique: false }
    ]
  },
  {
    name: 'PRACTICE_SESSIONS',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'mode', keyPath: 'mode', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false }
    ]
  },
  {
    name: 'REVIEWS',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'chunkId', keyPath: 'chunkId', unique: false },
      { name: 'reviewedAt', keyPath: 'reviewedAt', unique: false }
    ]
  },
  {
    name: 'YOUTUBE_LIBRARY',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'updatedAt', keyPath: 'updatedAt', unique: false }
    ]
  }
] as const;

/**
 * Creates object stores and indexes during database upgrade.
 */
function createObjectStore(
  db: IDBDatabase,
  schema: StoreSchema
): void {
  if (db.objectStoreNames.contains(DB_STORES[schema.name])) {
    return;
  }

  const store = db.createObjectStore(DB_STORES[schema.name], {
    keyPath: schema.keyPath,
    autoIncrement: schema.autoIncrement
  });

  for (const index of schema.indexes) {
    store.createIndex(index.name, index.keyPath, { unique: index.unique });
  }
}

/**
 * Opens the IndexedDB database and initializes the schema.
 *
 * @returns Promise that resolves to the opened database connection
 * @throws {DatabaseError} If the database cannot be opened
 */
export function openDatabase(): Promise<IDBDatabase> {
  // Return cached connection if available
  if (cachedDatabase) {
    return Promise.resolve(cachedDatabase);
  }

  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(
      DB_CONFIG.NAME,
      DB_CONFIG.VERSION
    );

    request.onupgradeneeded = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event as IDBVersionChangeEvent).oldVersion;

      // Handle database migration
      if (transaction < 1) {
        // Initial database creation
        for (const schema of STORE_SCHEMAS) {
          createObjectStore(db, schema);
        }
      } else {
        // Migration: Delete old stores and recreate with new schema
        // This is a simple approach for development - in production you'd
        // want to migrate data instead of deleting it
        const existingStores = Array.from(db.objectStoreNames);

        // Delete old object stores
        for (const storeName of existingStores) {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }
        }

        // Create new object stores with current schema
        for (const schema of STORE_SCHEMAS) {
          createObjectStore(db, schema);
        }
      }
    };

    request.onsuccess = () => {
      cachedDatabase = request.result;
      resolve(cachedDatabase);
    };

    request.onerror = () => {
      reject(new DatabaseError(
        `Failed to open database: ${request.error?.message ?? 'Unknown error'}`,
        request.error
      ));
    };

    request.onblocked = () => {
      reject(new DatabaseError(
        'Database request blocked. Another tab may be using the database.'
      ));
    };
  });
}

/**
 * Closes the cached database connection.
 * Useful for testing or cleanup.
 */
export function closeDatabase(): void {
  if (cachedDatabase) {
    cachedDatabase.close();
    cachedDatabase = null;
  }
}

/**
 * Deletes the entire database. Useful for development/testing or schema changes.
 *
 * @returns Promise that resolves when the database is deleted
 * @throws {DatabaseError} If the deletion fails
 */
export function deleteDatabase(): Promise<void> {
  closeDatabase();

  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_CONFIG.NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new DatabaseError(
        `Failed to delete database: ${request.error?.message ?? 'Unknown error'}`,
        request.error
      ));
    };

    request.onblocked = () => {
      reject(new DatabaseError(
        'Database deletion blocked. Close all tabs that might be using the database.'
      ));
    };
  });
}

/**
 * Generic IndexedDB transaction wrapper with proper error handling.
 *
 * @template T - The result type of the transaction callback
 * @param db - The database connection
 * @param storeName - The object store name
 * @param mode - Transaction mode ('readonly' or 'readwrite')
 * @param callback - Function to execute within the transaction
 * @returns Promise that resolves with the callback result
 * @throws {DatabaseError} If the transaction fails
 */
function withTransaction<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DatabaseError(
      `Transaction failed: ${request.error?.message ?? 'Unknown error'}`,
      request.error
    ));
  });
}

/**
 * Retrieves a single chunk by its ID.
 *
 * @param id - The chunk identifier
 * @returns The chunk if found, null otherwise
 * @throws {DatabaseError} If the read operation fails
 */
export function getChunkById(db: IDBDatabase, id: string): Promise<SavedChunk | null> {
  return withTransaction(db, DB_STORES.CHUNKS, 'readonly', (store) =>
    store.get(id)
  ).then((result) => result ?? null);
}

/**
 * Retrieves all chunks from the database.
 *
 * @returns Array of all chunks, sorted by collection date (newest first)
 * @throws {DatabaseError} If the read operation fails
 */
export function getAllChunks(db: IDBDatabase): Promise<SavedChunk[]> {
  return withTransaction(db, DB_STORES.CHUNKS, 'readonly', (store) =>
    store.getAll()
  ).then((chunks) => {
    // Sort by collectedAt descending (newest first)
    return chunks.sort((a, b) => b.collectedAt - a.collectedAt);
  });
}

/**
 * Retrieves all chunks matching a specific category.
 *
 * @param category - The chunk category filter
 * @returns Array of matching chunks, sorted by collection date (newest first)
 * @throws {DatabaseError} If the query operation fails
 */
export function getChunksByCategory(
  db: IDBDatabase,
  category: string
): Promise<SavedChunk[]> {
  return withTransaction(db, DB_STORES.CHUNKS, 'readonly', (store) => {
    const index = store.index('category');
    return index.getAll(category);
  }).then((chunks) => {
    return chunks.sort((a, b) => b.collectedAt - a.collectedAt);
  });
}

/**
 * Retrieves all chunks due for review before a given timestamp.
 *
 * @param timestamp - The upper bound timestamp for next review
 * @returns Array of due chunks, sorted by next review time (most urgent first)
 * @throws {DatabaseError} If the query operation fails
 */
export function getChunksDueForReview(
  db: IDBDatabase,
  timestamp: number
): Promise<SavedChunk[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORES.CHUNKS, 'readonly');
    const store = transaction.objectStore(DB_STORES.CHUNKS);
    const index = store.index('nextReview');
    const request = index.openCursor(IDBKeyRange.upperBound(timestamp));

    const chunks: SavedChunk[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        chunks.push(cursor.value);
        cursor.continue();
      } else {
        // Sort by nextReview ascending (most urgent first)
        chunks.sort((a, b) => (a.nextReview ?? 0) - (b.nextReview ?? 0));
        resolve(chunks);
      }
    };

    request.onerror = () => reject(new DatabaseError(
      `Failed to query due chunks: ${request.error?.message ?? 'Unknown error'}`,
      request.error
    ));
  });
}

/**
 * Saves a chunk to the database (inserts or updates).
 *
 * @param chunk - The chunk to save
 * @returns The ID of the saved chunk
 * @throws {DatabaseError} If the write operation fails
 */
export function saveChunk(db: IDBDatabase, chunk: SavedChunk): Promise<string> {
  return withTransaction(db, DB_STORES.CHUNKS, 'readwrite', (store) =>
    store.put(chunk)
  ).then(() => chunk.id);
}

/**
 * Deletes a chunk from the database by its ID.
 *
 * @param id - The chunk identifier
 * @throws {DatabaseError} If the delete operation fails
 */
export function deleteChunk(db: IDBDatabase, id: string): Promise<void> {
  return withTransaction(db, DB_STORES.CHUNKS, 'readwrite', (store) =>
    store.delete(id)
  ).then(() => undefined);
}

/**
 * Bulk operation to save multiple chunks in a single transaction.
 *
 * @param chunks - Array of chunks to save
 * @returns Array of saved chunk IDs
 * @throws {DatabaseError} If the bulk write operation fails
 */
export function saveChunks(db: IDBDatabase, chunks: SavedChunk[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORES.CHUNKS, 'readwrite');
    const store = transaction.objectStore(DB_STORES.CHUNKS);
    const ids: string[] = [];

    transaction.oncomplete = () => resolve(ids);
    transaction.onerror = () => reject(new DatabaseError(
      `Bulk save failed: ${transaction.error?.message ?? 'Unknown error'}`,
      transaction.error
    ));

    for (const chunk of chunks) {
      const request = store.put(chunk);
      request.onsuccess = () => ids.push(chunk.id);
    }
  });
}

/**
 * Practice session record type for Battle mode sessions.
 */
export interface PracticeSession {
  id?: number; // Auto-incremented
  mode: 'flow' | 'battle' | 'think';
  timestamp: number;
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  contentScore: number;
  passed: boolean;
  feedback: Array<{ category: string; message: string }>;
}

/**
 * Saves a practice session to the database.
 *
 * @param session - The practice session to save
 * @returns Promise that resolves when the save is complete
 * @throws {DatabaseError} If the write operation fails
 */
export async function savePracticeSession(
  session: PracticeSession
): Promise<number> {
  const db = await openDatabase();
  return withTransaction(db, DB_STORES.PRACTICE_SESSIONS, 'readwrite', (store) =>
    store.add(session)
  ).then((key) => key as number);
}

/**
 * Retrieves all practice sessions for a specific mode.
 *
 * @param mode - The learning mode to filter by ('flow' | 'battle' | 'think')
 * @returns Array of practice sessions, sorted by timestamp (newest first)
 * @throws {DatabaseError} If the query operation fails
 */
export async function getPracticeSessionsByMode(
  mode: 'flow' | 'battle' | 'think'
): Promise<PracticeSession[]> {
  const db = await openDatabase();
  return withTransaction(db, DB_STORES.PRACTICE_SESSIONS, 'readonly', (store) => {
    const index = store.index('mode');
    return index.getAll(mode);
  }).then((sessions) => {
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  });
}

/**
 * Retrieves all practice sessions within a date range.
 *
 * @param startTime - Start timestamp (inclusive)
 * @param endTime - End timestamp (inclusive)
 * @returns Array of practice sessions in the date range
 * @throws {DatabaseError} If the query operation fails
 */
export async function getPracticeSessionsByDateRange(
  startTime: number,
  endTime: number
): Promise<PracticeSession[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORES.PRACTICE_SESSIONS, 'readonly');
    const store = transaction.objectStore(DB_STORES.PRACTICE_SESSIONS);
    const index = store.index('timestamp');
    const request = index.openCursor(
      IDBKeyRange.bound(startTime, endTime)
    );

    const sessions: PracticeSession[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        sessions.push(cursor.value);
        cursor.continue();
      } else {
        resolve(sessions.sort((a, b) => b.timestamp - a.timestamp));
      }
    };

    request.onerror = () => reject(new DatabaseError(
      `Failed to query practice sessions: ${request.error?.message ?? 'Unknown error'}`,
      request.error
    ));
  });
}

/**
 * Converts a BattleResult to a PracticeSession for storage.
 *
 * @param result - The battle result to convert
 * @returns A practice session object
 */
export function battleResultToPracticeSession(result: BattleResult): PracticeSession {
  return {
    mode: 'battle',
    timestamp: result.timestamp,
    overallScore: result.overallScore,
    pronunciationScore: result.pronunciationScore,
    fluencyScore: result.fluencyScore,
    contentScore: result.contentScore,
    passed: result.passed,
    feedback: result.feedback,
  };
}

/**
 * Think mode exercise result type
 */
export interface ThinkExerciseResult {
  type: 'chunk-activation' | 'video-retelling' | 'logic-rewriting';
  timestamp: number;
  score: number; // 0-5
  feedback: string;
  timeSpent: number;
}

/**
 * Saves a Think mode exercise result to the database.
 *
 * @param result - The exercise result to save
 * @returns Promise that resolves to the session ID
 * @throws {DatabaseError} If the write operation fails
 */
export async function saveThinkExerciseResult(
  result: ThinkExerciseResult
): Promise<number> {
  const db = await openDatabase();

  const session: PracticeSession = {
    mode: 'think',
    timestamp: result.timestamp,
    overallScore: result.score,
    pronunciationScore: 0, // Not applicable for Think mode
    fluencyScore: 0, // Not applicable for Think mode
    contentScore: result.score,
    passed: result.score >= 3, // Consider passed if score >= 3
    feedback: [
      {
        category: result.type,
        message: result.feedback,
      },
    ],
  };

  return withTransaction(db, DB_STORES.PRACTICE_SESSIONS, 'readwrite', (store) =>
    store.add(session)
  ).then((key) => key as number);
}

/**
 * Retrieves all Think mode exercise results.
 *
 * @returns Promise resolving to array of Think exercise results
 * @throws {DatabaseError} If the query operation fails
 */
export async function getThinkExerciseResults(): Promise<PracticeSession[]> {
  return getPracticeSessionsByMode('think');
}
