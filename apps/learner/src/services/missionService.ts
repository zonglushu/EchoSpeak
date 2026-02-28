/**
 * Mission Service - Manages Battle mode missions
 *
 * Provides mission data management including:
 * - Mock mission data for MVP
 * - Mission retrieval and filtering
 * - Mission completion tracking
 *
 * @module services/missionService
 */

import type {
  Mission,
  DialogueNode,
  DialogueBranch,
  ResponseAnalysis,
  EvaluationCriteria
} from '../types/mode';

import { logError, ServiceError } from './errors';

/**
 * Custom error class for mission service operations.
 */
export class MissionServiceError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'MISSION_SERVICE_ERROR', cause, false);
  }
}

/**
 * Mock mission data for MVP testing
 */
export const SAMPLE_MISSIONS: Mission[] = [
  {
    id: 'mission-1',
    title: 'Project Delay Explanation',
    description: 'Explain to your boss why the Q3 report is delayed and propose a solution',
    difficulty: 2,
    category: 'business',
    prerequisites: {
      words: ['delay', 'schedule', 'unforeseen', 'deadline', 'postpone'],
      minAccuracy: 0.85
    },
    dialogueScript: {
      id: 'node-1',
      character: 'ai',
      text: "Hi, why is the Q3 report late again? We were supposed to review it yesterday.",
      personality: 'strict',
      branches: [
        {
          condition: (analysis: ResponseAnalysis) => analysis.contentRelevance > 0.7 && analysis.grammarScore > 0.6,
          nextNodeId: 'node-2a',
          feedbackHint: 'Good start! Be specific about the reasons.'
        },
        {
          condition: () => true,
          nextNodeId: 'node-2b',
          feedbackHint: 'Try to be more specific and professional.'
        }
      ]
    },
    evaluationCriteria: {
      pronunciationWeight: 0.4,
      grammarWeight: 0.3,
      pragmaticWeight: 0.2,
      contentWeight: 0.1,
      passingScore: 0.7
    }
  },
  {
    id: 'mission-2',
    title: 'Restaurant Reservation',
    description: 'Make a dinner reservation for 4 people at a popular restaurant',
    difficulty: 1,
    category: 'travel',
    prerequisites: {
      words: ['reservation', 'available', 'table', 'book', 'preferably'],
      minAccuracy: 0.80
    },
    dialogueScript: {
      id: 'node-1',
      character: 'ai',
      text: "Good evening, The Golden Fork. How may I help you tonight?",
      personality: 'friendly',
      branches: [
        {
          condition: (analysis: ResponseAnalysis) => analysis.contentRelevance > 0.6,
          nextNodeId: 'node-2a',
          feedbackHint: 'Great! Remember to mention the time and date.'
        },
        {
          condition: () => true,
          nextNodeId: 'node-2b',
          feedbackHint: 'Be clear about what you need.'
        }
      ]
    },
    evaluationCriteria: {
      pronunciationWeight: 0.3,
      grammarWeight: 0.3,
      pragmaticWeight: 0.3,
      contentWeight: 0.1,
      passingScore: 0.65
    }
  },
  {
    id: 'mission-3',
    title: 'Academic Presentation Question',
    description: 'Handle questions about your research presentation on climate change',
    difficulty: 3,
    category: 'academic',
    prerequisites: {
      words: ['significant', 'correlation', 'methodology', 'hypothesis', 'analysis'],
      minAccuracy: 0.85
    },
    dialogueScript: {
      id: 'node-1',
      character: 'ai',
      text: "Thank you for the presentation. Could you elaborate on the methodology used for data collection?",
      personality: 'skeptical',
      branches: [
        {
          condition: (analysis: ResponseAnalysis) => analysis.contentRelevance > 0.7 && analysis.grammarScore > 0.7,
          nextNodeId: 'node-2a',
          feedbackHint: 'Excellent! Use academic language confidently.'
        },
        {
          condition: () => true,
          nextNodeId: 'node-2b',
          feedbackHint: 'Try to use more precise academic terminology.'
        }
      ]
    },
    evaluationCriteria: {
      pronunciationWeight: 0.3,
      grammarWeight: 0.3,
      pragmaticWeight: 0.2,
      contentWeight: 0.2,
      passingScore: 0.75
    }
  },
  {
    id: 'mission-4',
    title: 'Job Interview - Strengths',
    description: 'Describe your key strengths in a job interview',
    difficulty: 2,
    category: 'business',
    prerequisites: {
      words: ['organized', 'communicate', 'team player', 'detail-oriented', 'experience'],
      minAccuracy: 0.85
    },
    dialogueScript: {
      id: 'node-1',
      character: 'ai',
      text: "So, tell me about yourself. What would you say are your greatest strengths?",
      personality: 'friendly',
      branches: [
        {
          condition: (analysis: ResponseAnalysis) => analysis.contentRelevance > 0.6 && analysis.pragmaticScore > 0.6,
          nextNodeId: 'node-2a',
          feedbackHint: 'Good! Provide specific examples.'
        },
        {
          condition: () => true,
          nextNodeId: 'node-2b',
          feedbackHint: 'Be confident and back up your claims.'
        }
      ]
    },
    evaluationCriteria: {
      pronunciationWeight: 0.35,
      grammarWeight: 0.3,
      pragmaticWeight: 0.25,
      contentWeight: 0.1,
      passingScore: 0.7
    }
  },
  {
    id: 'mission-5',
    title: 'Asking for Directions',
    description: 'Ask a stranger for directions to the train station',
    difficulty: 1,
    category: 'travel',
    prerequisites: {
      words: ['excuse', 'directions', 'station', 'straight', 'corner'],
      minAccuracy: 0.80
    },
    dialogueScript: {
      id: 'node-1',
      character: 'ai',
      text: "Sure, I can help you. Where are you trying to go?",
      personality: 'friendly',
      branches: [
        {
          condition: (analysis: ResponseAnalysis) => analysis.contentRelevance > 0.6,
          nextNodeId: 'node-2a',
          feedbackHint: 'Perfect! Listen carefully to the response.'
        },
        {
          condition: () => true,
          nextNodeId: 'node-2b',
          feedbackHint: 'Be polite and clear.'
        }
      ]
    },
    evaluationCriteria: {
      pronunciationWeight: 0.4,
      grammarWeight: 0.25,
      pragmaticWeight: 0.25,
      contentWeight: 0.1,
      passingScore: 0.65
    }
  }
];

/**
 * Mission Service - Public API
 */
export const missionService = {
  /**
   * Gets all available missions.
   *
   * @returns Promise resolving to array of all missions
   * @throws {MissionServiceError} If the operation fails
   */
  async getAllMissions(): Promise<Mission[]> {
    try {
      // Simulate async operation (e.g., API call)
      await new Promise(resolve => setTimeout(resolve, 100));
      return SAMPLE_MISSIONS;
    } catch (error) {
      logError(error, 'missionService.getAllMissions');
      throw new MissionServiceError('Failed to retrieve missions', error);
    }
  },

  /**
   * Gets missions filtered by category.
   *
   * @param category - The category to filter by ('business' | 'academic' | 'travel')
   * @returns Promise resolving to array of filtered missions
   * @throws {MissionServiceError} If the operation fails
   */
  async getMissionsByCategory(category: 'business' | 'academic' | 'travel'): Promise<Mission[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return SAMPLE_MISSIONS.filter(mission => mission.category === category);
    } catch (error) {
      logError(error, 'missionService.getMissionsByCategory');
      throw new MissionServiceError(`Failed to retrieve missions for category: ${category}`, error);
    }
  },

  /**
   * Gets missions filtered by difficulty.
   *
   * @param difficulty - The difficulty level (1-5)
   * @returns Promise resolving to array of filtered missions
   * @throws {MissionServiceError} If the operation fails
   */
  async getMissionsByDifficulty(difficulty: number): Promise<Mission[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return SAMPLE_MISSIONS.filter(mission => mission.difficulty === difficulty);
    } catch (error) {
      logError(error, 'missionService.getMissionsByDifficulty');
      throw new MissionServiceError(`Failed to retrieve missions for difficulty: ${difficulty}`, error);
    }
  },

  /**
   * Gets a single mission by its ID.
   *
   * @param id - The mission identifier
   * @returns Promise resolving to the mission, or null if not found
   * @throws {MissionServiceError} If the operation fails
   */
  async getMissionById(id: string): Promise<Mission | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return SAMPLE_MISSIONS.find(mission => mission.id === id) || null;
    } catch (error) {
      logError(error, 'missionService.getMissionById');
      throw new MissionServiceError(`Failed to retrieve mission: ${id}`, error);
    }
  },

  /**
   * Gets recommended missions based on user performance.
   * For MVP, returns missions with difficulty 1-2.
   *
   * @returns Promise resolving to array of recommended missions
   * @throws {MissionServiceError} If the operation fails
   */
  async getRecommendedMissions(): Promise<Mission[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return SAMPLE_MISSIONS.filter(mission => mission.difficulty <= 2);
    } catch (error) {
      logError(error, 'missionService.getRecommendedMissions');
      throw new MissionServiceError('Failed to retrieve recommended missions', error);
    }
  }
};
