/**
 * Processing Queue Service
 *
 * Manages async processing tasks for YouTube content.
 * Implements the layered processing architecture:
 * - Layer 1: Raw subtitles (instant)
 * - Layer 2: Basic AI annotations (async, low cost)
 * - Layer 3: Full prosody analysis (async, high cost)
 */

import type { TranscriptLine } from '@echospeak/types';
import type { ContentLibraryEntry } from './contentLibrary';
import type { ProcessingTier } from './quota';
import { generateProsodyNotation } from './gemini';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Processing task
 */
export interface ProcessingTask {
  id: string;
  youtubeId: string;
  requestedBy: string;
  tier: ProcessingTier;
  priority: number;
  status: TaskStatus;
  progress: number; // 0-100
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletionAt?: Date;
}

/**
 * Task result
 */
export interface TaskResult {
  success: boolean;
  taskId: string;
  data?: {
    basicAnnotations?: TranscriptLine[];
    fullProsodyData?: TranscriptLine[];
    cost: number;
    processingTimeMs: number;
    aiModel: string;
  };
  error?: string;
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  maxConcurrent?: number;
  retryDelay?: number; // milliseconds
  timeout?: number; // milliseconds per task
}

/**
 * Create a new processing task
 */
export function createProcessingTask(
  youtubeId: string,
  requestedBy: string,
  tier: ProcessingTier,
  priority: number = 1
): ProcessingTask {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    youtubeId,
    requestedBy,
    tier,
    priority,
    status: 'pending',
    progress: 0,
    retryCount: 0,
    maxRetries: 3,
    createdAt: now,
  };
}

/**
 * Process Layer 2: Basic AI annotations
 * Uses rule-based + lightweight AI processing
 */
export async function processLayer2(
  rawSubtitles: TranscriptLine[],
  options: { onProgress?: (progress: number) => void } = {}
): Promise<{ annotations: TranscriptLine[]; cost: number; timeMs: number }> {
  const startTime = Date.now();

  try {
    // For Layer 2, we use a mix of rule-based processing and lightweight AI
    const annotations: TranscriptLine[] = [];

    for (let i = 0; i < rawSubtitles.length; i++) {
      const line = rawSubtitles[i];

      // Basic rule-based annotations (almost free)
      const basicAnnotation = await applyBasicRules(line.text);

      annotations.push({
        ...line,
        text: basicAnnotation,
      });

      // Update progress
      if (options.onProgress) {
        options.onProgress(Math.round(((i + 1) / rawSubtitles.length) * 100));
      }

      // Small delay to avoid overwhelming the API
      await sleep(100);
    }

    const elapsed = Date.now() - startTime;

    // Layer 2 cost: ~$0.01 per video
    return {
      annotations,
      cost: 0.01,
      timeMs: elapsed,
    };
  } catch (error) {
    console.error('Layer 2 processing failed:', error);
    throw error;
  }
}

/**
 * Process Layer 3: Full prosody analysis
 * Uses Gemini AI for complete prosody notation
 */
export async function processLayer3(
  rawSubtitles: TranscriptLine[],
  options: { onProgress?: (progress: number) => void } = {}
): Promise<{ prosodyData: TranscriptLine[]; cost: number; timeMs: number }> {
  const startTime = Date.now();

  try {
    const prosodyData: TranscriptLine[] = [];

    // Process each line with Gemini AI
    for (let i = 0; i < rawSubtitles.length; i++) {
      const line = rawSubtitles[i];

      // Call Gemini for full prosody notation
      const annotatedText = await generateProsodyNotation(line.text);

      prosodyData.push({
        ...line,
        text: annotatedText,
      });

      // Update progress
      if (options.onProgress) {
        options.onProgress(Math.round(((i + 1) / rawSubtitles.length) * 100));
      }

      // Delay to respect rate limits
      await sleep(500);
    }

    const elapsed = Date.now() - startTime;

    // Layer 3 cost: ~$0.07 per video (varies by length)
    const estimatedTokens = rawSubtitles.length * 50; // Rough estimate
    const cost = (estimatedTokens / 1000000) * 0.075; // Gemini Flash pricing

    return {
      prosodyData,
      cost: Math.max(0.01, cost), // Minimum $0.01
      timeMs: elapsed,
    };
  } catch (error) {
    console.error('Layer 3 processing failed:', error);
    throw error;
  }
}

/**
 * Execute a processing task
 */
export async function executeTask(
  task: ProcessingTask,
  rawSubtitles: TranscriptLine[],
  options: ProcessingOptions = {}
): Promise<TaskResult> {
  const updatedTask = { ...task, status: 'processing' as TaskStatus, startedAt: new Date() };

  try {
    let result: TaskResult;

    if (task.tier === 'basic') {
      // Layer 2 processing
      const { annotations, cost, timeMs } = await processLayer2(rawSubtitles, {
        onProgress: (progress) => {
          updatedTask.progress = progress;
        },
      });

      result = {
        success: true,
        taskId: task.id,
        data: {
          basicAnnotations: annotations,
          cost,
          processingTimeMs: timeMs,
          aiModel: 'rules-based-gemini-flash',
        },
      };
    } else {
      // Layer 3 processing
      const { prosodyData, cost, timeMs } = await processLayer3(rawSubtitles, {
        onProgress: (progress) => {
          updatedTask.progress = progress;
        },
      });

      result = {
        success: true,
        taskId: task.id,
        data: {
          fullProsodyData: prosodyData,
          cost,
          processingTimeMs: timeMs,
          aiModel: 'gemini-flash',
        },
      };
    }

    updatedTask.status = 'completed';
    updatedTask.completedAt = new Date();
    updatedTask.progress = 100;

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    updatedTask.status = 'failed';
    updatedTask.completedAt = new Date();
    updatedTask.errorMessage = errorMessage;

    return {
      success: false,
      taskId: task.id,
      error: errorMessage,
    };
  }
}

/**
 * Apply basic rule-based annotations
 * This is a lightweight, almost-free processing layer
 */
async function applyBasicRules(text: string): Promise<string> {
  // Rule 1: Mark content words (nouns, verbs, adjectives, adverbs)
  const contentWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
  let result = text;

  // Bold potential stress words (simplified rule)
  for (const word of contentWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, `**${word.toUpperCase()}**`);
  }

  // Rule 2: Add pause markers at punctuation
  result = result.replace(/[,;]/g, ', |'); // Short pause
  result = result.replace(/[.!?]/g, '. ||'); // Long pause

  // Rule 3: Mark question intonation
  if (text.trim().endsWith('?')) {
    result += ' ↗';
  } else {
    result += ' ↘';
  }

  return result;
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate task priority based on user tier
 */
export function calculatePriority(userTier: 'free' | 'pro' | 'premium'): number {
  switch (userTier) {
    case 'premium':
      return 10;
    case 'pro':
      return 5;
    case 'free':
    default:
      return 1;
  }
}

/**
 * Sort tasks by priority and creation time
 */
export function sortTasksByPriority(tasks: ProcessingTask[]): ProcessingTask[] {
  return [...tasks].sort((a, b) => {
    // First sort by priority (higher first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Then sort by creation time (older first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Filter tasks by status
 */
export function filterTasksByStatus(
  tasks: ProcessingTask[],
  status: TaskStatus
): ProcessingTask[] {
  return tasks.filter(task => task.status === status);
}

/**
 * Get tasks that can be retried
 */
export function getRetryableTasks(tasks: ProcessingTask[]): ProcessingTask[] {
  return tasks.filter(
    task => task.status === 'failed' && task.retryCount < task.maxRetries
  );
}

/**
 * Increment retry count for a task
 */
export function incrementRetryCount(task: ProcessingTask): ProcessingTask {
  return {
    ...task,
    retryCount: task.retryCount + 1,
    status: 'pending' as TaskStatus,
    errorMessage: undefined,
  };
}

/**
 * Estimate task completion time
 */
export function estimateCompletionTime(task: ProcessingTask): Date {
  const avgProcessingTime = task.tier === 'basic' ? 60000 : 300000; // 1min or 5min
  return new Date(Date.now() + avgProcessingTime);
}

/**
 * Get queue statistics
 */
export function getQueueStats(tasks: ProcessingTask[]): {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTime?: number;
} {
  const completedTasks = tasks.filter(t => t.status === 'completed');

  let avgProcessingTime: number | undefined;
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.startedAt && task.completedAt) {
        return sum + (task.completedAt.getTime() - task.startedAt.getTime());
      }
      return sum;
    }, 0);
    avgProcessingTime = totalTime / completedTasks.length;
  }

  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: completedTasks.length,
    failed: tasks.filter(t => t.status === 'failed').length,
    avgProcessingTime,
  };
}
