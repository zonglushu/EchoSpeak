/**
 * Recommendation Service for Learning Modes
 *
 * Provides logic to recommend videos based on mode compatibility scores
 */

import type { Video, RecommendedVideo, LearningMode } from '../types/video';
import { toVideoWithCompatibility } from '../types/video';

/**
 * Get recommended videos for a specific learning mode
 *
 * @param allVideos - All available videos
 * @param mode - The learning mode to filter for
 * @param limit - Maximum number of videos to return (default: 5)
 * @param minScore - Minimum compatibility score required (default: 60)
 * @returns Sorted array of videos compatible with the mode
 */
export function getRecommendedVideosForMode(
  allVideos: Video[],
  mode: LearningMode,
  limit: number = 5,
  minScore: number = 60
): Video[] {
  return allVideos
    .filter((v) => v.modeCompatibility[mode].score >= minScore)
    .sort((a, b) => b.modeCompatibility[mode].score - a.modeCompatibility[mode].score)
    .slice(0, limit);
}

/**
 * Get recommended videos for each mode from a list of recommended videos
 *
 * @param recommendedVideos - Videos from the constants
 * @param compatibilityOverrides - Optional custom compatibility scores
 * @returns Object with video arrays for each mode
 */
export function getModeRecommendationsFromVideos(
  recommendedVideos: RecommendedVideo[],
  compatibilityOverrides?: Record<string, Partial<Video['modeCompatibility']>>
): Record<LearningMode, Video[]> {
  // Convert all recommended videos to Videos with compatibility
  const allVideos: Video[] = recommendedVideos.map((rv) => {
    const overrides = compatibilityOverrides?.[rv.id];
    return toVideoWithCompatibility(rv, overrides);
  });

  return {
    flow: getRecommendedVideosForMode(allVideos, 'flow'),
    battle: getRecommendedVideosForMode(allVideos, 'battle'),
    think: getRecommendedVideosForMode(allVideos, 'think'),
  };
}

/**
 * Get the best mode for a specific video based on compatibility scores
 *
 * @param video - The video to check
 * @returns The mode with the highest compatibility score
 */
export function getBestModeForVideo(video: Video): LearningMode {
  const modes: LearningMode[] = ['flow', 'battle', 'think'];
  const bestMode = modes.reduce((best, current) => {
    const bestScore = video.modeCompatibility[best].score;
    const currentScore = video.modeCompatibility[current].score;
    return currentScore > bestScore ? current : best;
  }, modes[0]);

  return bestMode;
}

/**
 * Get all recommended videos grouped by mode (for homepage)
 *
 * @param recommendedVideos - Videos from the constants
 * @returns Object with video arrays for each mode
 */
export function getAllModeRecommendations(
  recommendedVideos: RecommendedVideo[]
): Record<LearningMode, Video[]> {
  return getModeRecommendationsFromVideos(recommendedVideos);
}

/**
 * Get mode compatibility color class
 *
 * @param score - Compatibility score (0-100)
 * @returns Tailwind color class string
 */
export function getCompatibilityColor(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-teal-600 dark:text-teal-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get compatibility badge text
 *
 * @param score - Compatibility score (0-100)
 * @returns Human-readable compatibility label
 */
export function getCompatibilityLabel(score: number): string {
  if (score >= 90) return '完美匹配';
  if (score >= 70) return '高度推荐';
  if (score >= 50) return '可以尝试';
  return '暂不推荐';
}
