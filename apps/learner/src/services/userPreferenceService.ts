/**
 * User Preference Service
 *
 * Manages user preferences for learning modes and other settings
 * Uses localStorage for client-side persistence
 */

import type { LearningMode } from '../types/video';

const STORAGE_KEYS = {
  LAST_MODE: 'echospeak:last_mode',
  MODE_PREFERENCES: 'echospeak:mode_preferences',
  ONBOARDING_COMPLETED: 'echospeak:onboarding_completed',
} as const;

interface ModePreferences {
  flow: { clickCount: number; lastAccessed: number };
  battle: { clickCount: number; lastAccessed: number };
  think: { clickCount: number; lastAccessed: number };
}

interface UserPreferences {
  lastMode?: LearningMode;
  modePreferences: ModePreferences;
  onboardingCompleted: boolean;
}

/**
 * Get the last used learning mode
 */
export function getLastMode(): LearningMode | undefined {
  try {
    const lastMode = localStorage.getItem(STORAGE_KEYS.LAST_MODE);
    return lastMode ? (lastMode as LearningMode) : undefined;
  } catch (error) {
    console.warn('Failed to get last mode from localStorage:', error);
    return undefined;
  }
}

/**
 * Set the last used learning mode
 */
export function setLastMode(mode: LearningMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_MODE, mode);
  } catch (error) {
    console.warn('Failed to set last mode in localStorage:', error);
  }
}

/**
 * Get all user preferences
 */
export function getUserPreferences(): UserPreferences {
  try {
    const modePrefsStr = localStorage.getItem(STORAGE_KEYS.MODE_PREFERENCES);
    const onboardingStr = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);

    const modePreferences: ModePreferences = modePrefsStr
      ? JSON.parse(modePrefsStr)
      : {
          flow: { clickCount: 0, lastAccessed: 0 },
          battle: { clickCount: 0, lastAccessed: 0 },
          think: { clickCount: 0, lastAccessed: 0 },
        };

    const onboardingCompleted = onboardingStr === 'true';

    return {
      lastMode: getLastMode(),
      modePreferences,
      onboardingCompleted,
    };
  } catch (error) {
    console.warn('Failed to get user preferences from localStorage:', error);
    return {
      modePreferences: {
        flow: { clickCount: 0, lastAccessed: 0 },
        battle: { clickCount: 0, lastAccessed: 0 },
        think: { clickCount: 0, lastAccessed: 0 },
      },
      onboardingCompleted: false,
    };
  }
}

/**
 * Update mode preferences (track usage)
 */
export function trackModeUsage(mode: LearningMode): void {
  try {
    const prefs = getUserPreferences();
    const now = Date.now();

    prefs.modePreferences[mode] = {
      clickCount: prefs.modePreferences[mode].clickCount + 1,
      lastAccessed: now,
    };

    localStorage.setItem(STORAGE_KEYS.MODE_PREFERENCES, JSON.stringify(prefs.modePreferences));
    setLastMode(mode);
  } catch (error) {
    console.warn('Failed to track mode usage:', error);
  }
}

/**
 * Get recommended mode based on usage patterns
 * Returns the most recently used mode, or the most frequently used if there's a tie
 */
export function getRecommendedMode(): LearningMode {
  const prefs = getUserPreferences();
  const { modePreferences } = prefs;

  // If user has never used any mode, default to flow
  const totalClicks =
    modePreferences.flow.clickCount +
    modePreferences.battle.clickCount +
    modePreferences.think.clickCount;

  if (totalClicks === 0) {
    return 'flow';
  }

  // Sort by last accessed time (most recent first)
  const modesByRecency: Array<{ mode: LearningMode; lastAccessed: number }> = [
    { mode: 'flow', lastAccessed: modePreferences.flow.lastAccessed },
    { mode: 'battle', lastAccessed: modePreferences.battle.lastAccessed },
    { mode: 'think', lastAccessed: modePreferences.think.lastAccessed },
  ].sort((a, b) => b.lastAccessed - a.lastAccessed);

  // Return the most recently accessed mode that has been used
  for (const { mode, lastAccessed } of modesByRecency) {
    if (lastAccessed > 0) {
      return mode;
    }
  }

  return 'flow';
}

/**
 * Mark onboarding as completed
 */
export function setOnboardingCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
  } catch (error) {
    console.warn('Failed to set onboarding completed:', error);
  }
}

/**
 * Check if onboarding is completed
 */
export function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  } catch (error) {
    console.warn('Failed to check onboarding status:', error);
    return false;
  }
}

/**
 * Clear all user preferences (useful for testing or logout)
 */
export function clearUserPreferences(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear user preferences:', error);
  }
}
