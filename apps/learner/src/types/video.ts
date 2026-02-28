/**
 * Video type with mode compatibility scoring
 */

export type VideoDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LearningMode = 'flow' | 'battle' | 'think';

export interface ModeCompatibility {
  flow: {
    score: number; // 0-100
    reason?: string;
  };
  battle: {
    score: number;
    reason?: string;
  };
  think: {
    score: number;
    reason?: string;
  };
}

export interface Video {
  id: string;
  title: string;
  thumbnail: React.ComponentType<{ className?: string }>;
  duration: string;
  difficulty: VideoDifficulty;
  category: string;
  students: number;

  // Mode compatibility
  modeCompatibility: ModeCompatibility;
}

// Helper type for recommended video from constants
export interface RecommendedVideo {
  id: string;
  title: string;
  thumbnail: React.ComponentType<{ className?: string }>;
  duration: string;
  difficulty: VideoDifficulty;
  students: number;
  category?: string;
}

/**
 * Convert RecommendedVideo to Video with default mode compatibility
 */
export function toVideoWithCompatibility(
  recommendedVideo: RecommendedVideo,
  compatibilityOverrides?: Partial<ModeCompatibility>
): Video {
  // Default compatibility scores based on difficulty
  const getDefaultCompatibility = (difficulty: VideoDifficulty): ModeCompatibility => {
    switch (difficulty) {
      case 'beginner':
        return {
          flow: { score: 95, reason: '适合初学者轻松跟读' },
          battle: { score: 65, reason: '难度较低，对战挑战有限' },
          think: { score: 70, reason: '适合基础复述练习' },
        };
      case 'intermediate':
        return {
          flow: { score: 80, reason: '适合流利度训练' },
          battle: { score: 85, reason: '适合实战对话练习' },
          think: { score: 90, reason: '适合深度思考和理解' },
        };
      case 'advanced':
        return {
          flow: { score: 70, reason: '适合高级流利度提升' },
          battle: { score: 95, reason: '高难度实战挑战' },
          think: { score: 95, reason: '适合深度思维训练' },
        };
    }
  };

  const defaultCompatibility = getDefaultCompatibility(recommendedVideo.difficulty);

  return {
    ...recommendedVideo,
    category: recommendedVideo.category || 'general',
    modeCompatibility: {
      flow: { ...defaultCompatibility.flow, ...compatibilityOverrides?.flow },
      battle: { ...defaultCompatibility.battle, ...compatibilityOverrides?.battle },
      think: { ...defaultCompatibility.think, ...compatibilityOverrides?.think },
    },
  };
}
