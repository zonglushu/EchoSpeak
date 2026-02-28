/**
 * Mode System Type Definitions
 *
 * Defines the core data structures for the 3-mode learning system:
 * - Flow (Companion Input)
 * - Battle (Intensive Interaction)
 * - Think (Reflective Consolidation)
 */

/**
 * Supported chunk categories for classification
 */
export enum ChunkCategory {
  BUSINESS = 'business',
  ACADEMIC = 'academic',
  DAILY_LIFE = 'daily_life',
  TRAVEL = 'travel',
  IDIOM = 'idiom',
  CUSTOM = 'custom'
}

/**
 * A saved phrase/chunk from any mode
 * Core data unit that flows through all three modes
 */
export interface SavedChunk {
  id: string;                    // UUID
  text: string;                  // English phrase
  translation: string;           // Chinese translation
  startTime: number;             // Video timestamp (seconds)
  duration: number;              // Phrase duration (seconds)
  sourceId: string;              // Video/Asset ID
  sourceTitle?: string;          // Video title for context
  contextBefore: string;         // 5s before transcript
  contextAfter: string;          // 5s after transcript
  category: ChunkCategory;       // Auto-classified category
  collectedAt: number;           // Timestamp when saved
  practiceCount: number;         // Times used in Battle/Think
  masteryLevel: number;          // 0-1 score (SRS)
  nextReview?: number;           // Timestamp for next review (SRS)
  interval?: number;             // SRS interval (days)
  easeFactor?: number;           // SRS ease factor (default 2.5)
  tags?: string[];               // User-defined tags
  notes?: string;                // User notes
}

/**
 * Battle Mode - Mission structure
 */
export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: 'business' | 'academic' | 'travel';
  prerequisites: {
    words: string[];             // Key vocabulary
    minAccuracy: number;         // Gate threshold (default 0.85)
  };
  dialogueScript: DialogueNode;
  evaluationCriteria: EvaluationCriteria;
}

/**
 * Dialogue node for branching conversations
 */
export interface DialogueNode {
  id: string;
  character: 'ai' | 'user';
  text: string;
  personality?: string;          // "strict", "friendly", "skeptical"
  branches: DialogueBranch[];
}

/**
 * Branching options based on user response
 */
export interface DialogueBranch {
  condition: (responseAnalysis: ResponseAnalysis) => boolean;
  nextNodeId: string;
  feedbackHint?: string;
}

/**
 * User response analysis from AI
 */
export interface ResponseAnalysis {
  pronunciationScore: number;    // 0-1
  grammarScore: number;          // 0-1
  pragmaticScore: number;        // 0-1
  contentRelevance: number;      // 0-1
  suggestedReply: string;
  feedback: string;
}

/**
 * Evaluation criteria for missions
 */
export interface EvaluationCriteria {
  pronunciationWeight: number;   // Default 0.4
  grammarWeight: number;         // Default 0.3
  pragmaticWeight: number;       // Default 0.2
  contentWeight: number;         // Default 0.1
  passingScore: number;          // Default 0.7
}

/**
 * Battle mode state machine
 */
export type BattlePhase =
  | 'mission-selection'
  | 'drill-phase'
  | 'dialogue-phase'
  | 'feedback'
  | 'mission-complete';

export interface BattleState {
  phase: BattlePhase;
  currentMission: Mission | null;
  drillProgress: Map<string, number>; // wordId → accuracy
  dialogueHistory: DialogueTurn[];
  userAttempts: number;
  unlocked: boolean;             // Passed drill gate
}

export interface DialogueTurn {
  character: 'ai' | 'user';
  text: string;
  timestamp: number;
  analysis?: ResponseAnalysis;
}

/**
 * Battle mode result from completing a mission
 */
export interface BattleResult {
  overallScore: number;          // 0-1
  pronunciationScore: number;    // 0-1
  fluencyScore: number;          // 0-1
  contentScore: number;          // 0-1
  passed: boolean;
  feedback: Array<{ category: string; message: string }>;
  timestamp: number;
}

/**
 * Think Mode - Exercise types
 */
export type ExerciseType =
  | 'chunk-activation'
  | 'video-retelling'
  | 'logic-rewriting';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  chunkId?: string;              // For chunk-activation
  difficulty: 1 | 2 | 3 | 4;
  completed: boolean;
}

/**
 * Chunk activation exercise
 */
export interface ChunkActivationExercise extends BaseExercise {
  type: 'chunk-activation';
  chunkId: string;
  format: 'sentence-creation' | 'scenario-application' | 'translation';
  prompt: string;
  userAnswer?: string;
  feedback?: string;
  score?: number;
}

/**
 * Video retelling exercise
 */
export interface VideoRetellingExercise extends BaseExercise {
  type: 'video-retelling';
  videoId: string;
  videoTranscript: string;
  question: string;
  userAnswer?: string;
  evaluation?: RetellingEvaluation;
}

/**
 * Retelling evaluation
 */
export interface RetellingEvaluation {
  contentScore: number;          // 0-1
  languageScore: number;         // 0-1
  feedback: {
    content: string;
    language: string;
    improvement: string;
  };
}

/**
 * Logic rewriting exercise
 */
export interface LogicRewritingExercise extends BaseExercise {
  type: 'logic-rewriting';
  originalAnswer: string;
  challengeType: 'vocabulary-upgrade' | 'grammar-structure' | 'logic-extension' | 'style-transformation';
  targetElement: string;         // Word/structure to use
  hint?: string;
  userAttempt?: string;
  feedback?: string;
  score?: number;
}

/**
 * Cross-mode bridge suggestions
 */
export interface BridgeSuggestion {
  fromMode: 'flow' | 'battle' | 'think';
  toMode: 'flow' | 'battle' | 'think';
  message: string;
  actionLabel: string;
  contextData: Record<string, unknown>;
}

/**
 * User activity data for bridge suggestions
 */
export interface ActivityData {
  chunksCollected: number;
  todayChunks: SavedChunk[];
  weakPoints: string[];
  masteredChunks: number;
  recentMissions?: string[];
}

/**
 * IndexedDB store names
 */
export const DB_STORES = {
  YOUTUBE_LIBRARY: 'youtube_library',
  CHUNKS: 'chunks',
  PRACTICE_SESSIONS: 'practice_sessions',
  REVIEWS: 'reviews'
} as const;

/**
 * IndexedDB database configuration
 */
export const DB_CONFIG = {
  NAME: 'EchoSpeakStudioDB_v3',
  VERSION: 3
} as const;
