/**
 * Flow Service - Manages media asset playlist for flow mode
 *
 * Provides methods for retrieving and managing the playlist of
 * saved media assets for continuous playback.
 *
 * @module services/flowService
 */

import { MediaAsset } from '@echospeak/types';
import type { IDBOpenDBRequest, IDBVersionChangeEvent } from '../types/youtube';
import { DB_CONFIG, DB_STORES } from '../types/mode';

import { logError, ServiceError, getErrorMessage } from './errors';

export interface FlowItem extends MediaAsset {
    lastPlayedAt?: number;
}

/**
 * Custom error class for flow service operations.
 */
export class FlowServiceError extends ServiceError {
    constructor(message: string, cause?: unknown) {
        super(message, 'FLOW_SERVICE_ERROR', cause, false);
    }
}

/**
 * Opens the IndexedDB database.
 *
 * @returns Promise that resolves to the database connection
 * @throws {FlowServiceError} If the database cannot be opened
 */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request: IDBOpenDBRequest = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);
        request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(DB_STORES.YOUTUBE_LIBRARY)) {
                db.createObjectStore(DB_STORES.YOUTUBE_LIBRARY, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            const error = new FlowServiceError(
                `Failed to open database: ${request.error?.message ?? 'Unknown error'}`,
                request.error
            );
            logError(error, 'flowService.openDB');
            reject(error);
        };
        request.onblocked = () => {
            const error = new FlowServiceError(
                'Database request blocked. Another tab may be using the database.'
            );
            logError(error, 'flowService.openDB');
            reject(error);
        };
    });
};

export const flowService = {
    /**
     * Gets all saved assets to form a playlist.
     *
     * @returns Promise resolving to array of flow items sorted by timestamp (newest first)
     * @throws {FlowServiceError} If the database operation fails
     */
    getPlaylist: async (): Promise<FlowItem[]> => {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(DB_STORES.YOUTUBE_LIBRARY, 'readonly');
                const request = transaction.objectStore(DB_STORES.YOUTUBE_LIBRARY).getAll();

                request.onsuccess = () => {
                    const results = request.result as FlowItem[];
                    // Sort by timestamp desc (newest first)
                    results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    resolve(results);
                };
                request.onerror = () => {
                    const error = new FlowServiceError(
                        `Failed to get playlist: ${request.error?.message ?? 'Unknown error'}`,
                        request.error
                    );
                    logError(error, 'flowService.getPlaylist');
                    reject(error);
                };
            });
        } catch (error) {
            if (error instanceof FlowServiceError) {
                throw error;
            }
            const serviceError = new FlowServiceError(getErrorMessage(error), error);
            logError(serviceError, 'flowService.getPlaylist');
            throw serviceError;
        }
    },

    /**
     * Gets mock data for testing when the database is empty.
     *
     * @returns Array of demo flow items
     */
    getMockPlaylist: (): FlowItem[] => {
        return [
            {
                id: 'demo_1',
                name: 'Demo: The Art of Small Talk',
                transcript: [
                    { id: '1', startTime: 0, endTime: 5, text: "So, how have you been lately?", translation: "最近过得怎么样？" },
                    { id: '2', startTime: 5, endTime: 10, text: "I've been great, actually. Just busy with work.", translation: "其实挺好的，就是工作有点忙。" },
                    { id: '3', startTime: 10, endTime: 15, text: "Tell me about it. It's that time of the year.", translation: "可不是嘛，每年的这个时候都这样。" }
                ],
                timestamp: Date.now(),
                url: 'mock_url'
            } satisfies FlowItem,
        ];
    }
};
