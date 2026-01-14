/**
 * SuperMemo-2 Spaced Repetition Algorithm
 *
 * Implementation of the SuperMemo-2 algorithm for spaced repetition scheduling.
 * This algorithm calculates review intervals based on user recall quality.
 *
 * Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * @module utils/superMemo
 */

/**
 * Quality rating scale for user recall performance.
 * Lower values indicate poor recall, higher values indicate good recall.
 */
export type RecallQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Default ease factor for new items.
 * Values typically range from 1.3 (difficult) to 2.5+ (easy).
 */
export const DEFAULT_EASE_FACTOR = 2.5;

/**
 * Minimum allowed ease factor to prevent items from becoming impossible.
 */
export const MIN_EASE_FACTOR = 1.3;

/**
 * Result of applying the SuperMemo-2 algorithm.
 */
export interface SuperMemoResult {
  /** Updated interval in days */
  interval: number;
  /** Updated ease factor */
  easeFactor: number;
  /** Timestamp for the next review (milliseconds since epoch) */
  nextReviewTime: number;
  /** Updated mastery level (0-1) */
  masteryLevel: number;
}

/**
 * SuperMemo-2 algorithm state.
 * Represents the scheduling data for a single chunk.
 */
export interface SuperMemoState {
  /** Current interval in days */
  interval: number;
  /** Ease factor (higher = easier) */
  easeFactor: number;
  /** Current mastery level (0-1) */
  masteryLevel: number;
}

/**
 * Validates that a quality rating is within the valid range.
 *
 * @param quality - The quality rating to validate
 * @returns True if the quality is valid
 */
export function isValidQuality(quality: number): quality is RecallQuality {
  return Number.isInteger(quality) && quality >= 0 && quality <= 5;
}

/**
 * Calculates the new interval based on current interval and quality rating.
 *
 * Rules:
 * - First review (interval = 0): set to 1 day
 * - Second review (interval = 1): set to 6 days
 * - Subsequent reviews: multiply interval by ease factor
 * - Quality < 3: reset to 1 day (forgot the item)
 *
 * @param interval - Current interval in days
 * @param quality - Recall quality rating (0-5)
 * @returns New interval in days
 */
export function calculateInterval(interval: number, quality: RecallQuality): number {
  if (quality < 3) {
    // Incorrect response - reset interval
    return 1;
  }

  // Correct response - advance interval
  if (interval === 0) {
    return 1;
  }
  if (interval === 1) {
    return 6;
  }
  return Math.round(interval * 2.5); // Placeholder, will use actual ease factor
}

/**
 * Calculates the new ease factor based on current ease factor and quality rating.
 *
 * Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *
 * Where:
 * - EF = current ease factor
 * - q = quality rating (0-5)
 *
 * @param easeFactor - Current ease factor
 * @param quality - Recall quality rating (0-5)
 * @returns New ease factor (min 1.3)
 */
export function calculateEaseFactor(
  easeFactor: number,
  quality: RecallQuality
): number {
  const qualityDiff = 5 - quality;
  const adjustment = 0.1 - qualityDiff * (0.08 + qualityDiff * 0.02);
  const newEaseFactor = easeFactor + adjustment;

  return Math.max(MIN_EASE_FACTOR, newEaseFactor);
}

/**
 * Calculates the new mastery level based on current mastery and quality rating.
 *
 * Rules:
 * - Quality >= 3 (correct): increase mastery by 10%
 * - Quality < 3 (incorrect): decrease mastery by 5%
 * - Mastery is clamped between 0 and 1
 *
 * @param currentMastery - Current mastery level (0-1)
 * @param quality - Recall quality rating (0-5)
 * @returns New mastery level (0-1)
 */
export function calculateMasteryLevel(
  currentMastery: number,
  quality: RecallQuality
): number {
  const adjustment = quality >= 3 ? 0.1 : -0.05;
  const newMastery = currentMastery + adjustment;

  return Math.max(0, Math.min(1, newMastery));
}

/**
 * Applies the SuperMemo-2 algorithm to compute the next review schedule.
 *
 * This is the main entry point for the algorithm. It takes the current
 * scheduling state and a quality rating, then returns the updated state.
 *
 * @param state - Current SuperMemo state
 * @param quality - Recall quality rating (0-5)
 * @returns Updated SuperMemo result with next review time
 *
 * @example
 * ```ts
 * const result = applySuperMemo({
 *   interval: 0,
 *   easeFactor: 2.5,
 *   masteryLevel: 0
 * }, 4);
 * // result.interval === 1 (first review, correct)
 * // result.nextReviewTime === tomorrow
 * ```
 */
export function applySuperMemo(
  state: SuperMemoState,
  quality: RecallQuality
): SuperMemoResult {
  if (!isValidQuality(quality)) {
    throw new TypeError(`Quality must be between 0 and 5, got ${quality}`);
  }

  const { interval: currentInterval, easeFactor: currentEase } = state;

  // Calculate new ease factor first (needed for interval calculation)
  const newEaseFactor = calculateEaseFactor(currentEase, quality);

  // Calculate new interval using the updated ease factor
  let newInterval: number;
  if (quality < 3) {
    // Reset interval for incorrect responses
    newInterval = 1;
  } else if (currentInterval === 0) {
    newInterval = 1;
  } else if (currentInterval === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(currentInterval * newEaseFactor);
  }

  // Calculate mastery level
  const masteryLevel = calculateMasteryLevel(state.masteryLevel, quality);

  // Calculate next review timestamp
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextReviewTime = nextDate.getTime();

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    nextReviewTime,
    masteryLevel
  };
}

/**
 * Creates a new SuperMemo state for a newly created chunk.
 *
 * @returns Initial SuperMemo state with default values
 */
export function createInitialState(): SuperMemoState {
  return {
    interval: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    masteryLevel: 0
  };
}
