import { TFunction } from 'i18next';
import type { DifficultyLevel } from '../constants/homeConstants';

/**
 * Get CSS classes for difficulty level badge
 */
export function getDifficultyColorClasses(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'intermediate':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'advanced':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

/**
 * Get formatted difficulty label with emoji
 */
export function getDifficultyLabel(difficulty: DifficultyLevel, t: TFunction): string {
  switch (difficulty) {
    case 'beginner':
      return `🌱 ${t('difficulty.beginner')}`;
    case 'intermediate':
      return `🌿 ${t('difficulty.intermediate')}`;
    case 'advanced':
      return `🌳 ${t('difficulty.advanced')}`;
    default:
      return difficulty;
  }
}

/**
 * Get greeting message based on time of day
 */
export function getGreeting(t: TFunction): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('greeting.morning');
  if (hour < 18) return t('greeting.afternoon');
  return t('greeting.evening');
}

/**
 * Get difficulty color for video card badge (simplified version)
 */
export function getVideoCardBadgeColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-500';
    case 'intermediate':
      return 'text-yellow-500';
    case 'advanced':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Framer motion animation variants for staggered children
 */
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Framer motion animation variants for individual items
 */
export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};
