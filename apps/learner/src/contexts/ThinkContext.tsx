/**
 * Think Context - Global state management for Think Mode exercises
 *
 * Manages state for:
 * - Exercise selection and phase navigation
 * - Chunk activation exercises
 * - Video retelling exercises
 * - Logic rewriting exercises
 * - Feedback and results
 *
 * Provides a unified state management layer for all Think mode components.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { chunkService } from '../services/chunkService';
import { thinkService, type ChunkActivationFormat } from '../services/thinkService';
import type {
  SavedChunk,
  ExerciseType,
  LogicRewritingExercise as LogicRewritingExerciseType,
  RetellingEvaluation,
} from '../types/mode';
import { THINK_VIDEOS } from '../components/Think/videoData';

// ============================================================================
// Types
// ============================================================================

/**
 * Think mode phases
 */
export type ThinkPhase =
  | 'exercise-selection'
  | 'chunk-activation'
  | 'video-retelling'
  | 'logic-rewriting'
  | 'feedback';

/**
 * Exercise result type
 */
export interface ExerciseResult {
  type: ExerciseType;
  timestamp: number;
  score: number;
  feedback: string;
  timeSpent: number;
}

/**
 * Chunk activation state
 */
interface ChunkActivationState {
  chunks: SavedChunk[];
  currentIndex: number;
  currentFormat: ChunkActivationFormat;
  currentPrompt: string;
  userAnswer: string;
  feedback: { score: number; feedback: string } | null;
  startTime: number;
}

/**
 * Video retelling state
 */
interface VideoRetellingState {
  currentVideoIndex: number;
  question: string;
  isGeneratingQuestion: boolean;
  userAnswer: string;
  evaluation: RetellingEvaluation | null;
  showTranscript: boolean;
  startTime: number;
}

/**
 * Logic rewriting state
 */
interface LogicRewritingState {
  challenge: LogicRewritingExerciseType | null;
  isLoading: boolean;
  userAttempt: string;
  result: { score: number; feedback: string } | null;
  completedCount: number;
  startTime: number;
}

/**
 * Main Think state
 */
interface ThinkState {
  phase: ThinkPhase;
  currentExerciseType: ExerciseType | null;
  sessionResults: ExerciseResult[];
  chunkActivationState: ChunkActivationState;
  videoRetellingState: VideoRetellingState;
  logicRewritingState: LogicRewritingState;
  isLoading: boolean;
  error: string | null;
}

/**
 * Context value interface
 */
interface ThinkContextValue {
  // State
  state: ThinkState;

  // Navigation
  goToPhase: (phase: ThinkPhase) => void;
  selectExercise: (type: ExerciseType) => void;
  restartSession: () => void;

  // Chunk activation actions
  loadChunksForReview: () => Promise<void>;
  generateChunkPrompt: (chunk: SavedChunk, format: ChunkActivationFormat) => Promise<void>;
  submitChunkAnswer: (answer: string) => Promise<void>;
  advanceToNextChunk: () => void;

  // Video retelling actions
  selectVideo: (index: number) => void;
  toggleTranscript: () => void;
  generateVideoQuestion: () => Promise<void>;
  submitVideoAnswer: (answer: string) => Promise<void>;
  advanceToNextVideo: () => void;

  // Logic rewriting actions
  generateLogicChallenge: () => Promise<void>;
  submitLogicAnswer: (answer: string) => Promise<void>;
  retryLogicChallenge: () => void;
  advanceToNextChallenge: () => void;

  // Session management
  completeExercise: (result: ExerciseResult) => void;
  clearError: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ThinkContext = createContext<ThinkContextValue | undefined>(undefined);

export const useThink = (): ThinkContextValue => {
  const context = useContext(ThinkContext);
  if (!context) {
    throw new Error('useThink must be used within ThinkProvider');
  }
  return context;
};

// ============================================================================
// Initial States
// ============================================================================

const initialChunkActivationState: ChunkActivationState = {
  chunks: [],
  currentIndex: 0,
  currentFormat: 'sentence-creation',
  currentPrompt: '',
  userAnswer: '',
  feedback: null,
  startTime: Date.now(),
};

const initialVideoRetellingState: VideoRetellingState = {
  currentVideoIndex: 0,
  question: '',
  isGeneratingQuestion: false,
  userAnswer: '',
  evaluation: null,
  showTranscript: false,
  startTime: Date.now(),
};

const initialLogicRewritingState: LogicRewritingState = {
  challenge: null,
  isLoading: false,
  userAttempt: '',
  result: null,
  completedCount: 0,
  startTime: Date.now(),
};

const initialThinkState: ThinkState = {
  phase: 'exercise-selection',
  currentExerciseType: null,
  sessionResults: [],
  chunkActivationState: initialChunkActivationState,
  videoRetellingState: initialVideoRetellingState,
  logicRewritingState: initialLogicRewritingState,
  isLoading: false,
  error: null,
};

// ============================================================================
// Provider
// ============================================================================

interface ThinkProviderProps {
  children: ReactNode;
}

export const ThinkProvider: React.FC<ThinkProviderProps> = ({ children }) => {
  const [state, setState] = useState<ThinkState>(initialThinkState);

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  const goToPhase = useCallback((phase: ThinkPhase) => {
    setState((prev) => ({
      ...prev,
      phase,
    }));
  }, []);

  const selectExercise = useCallback((type: ExerciseType) => {
    setState((prev) => ({
      ...prev,
      phase: type === 'chunk-activation' ? 'chunk-activation' :
           type === 'video-retelling' ? 'video-retelling' :
           'logic-rewriting',
      currentExerciseType: type,
      isLoading: true,
      error: null,
    }));
  }, []);

  const restartSession = useCallback(() => {
    setState({
      ...initialThinkState,
      chunkActivationState: {
        ...initialChunkActivationState,
        startTime: Date.now(),
      },
      videoRetellingState: {
        ...initialVideoRetellingState,
        startTime: Date.now(),
      },
      logicRewritingState: {
        ...initialLogicRewritingState,
        startTime: Date.now(),
      },
    });
  }, []);

  // ============================================================================
  // Chunk Activation Actions
  // ============================================================================

  const loadChunksForReview = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const dueChunks = await chunkService.getDueForReview();
      setState((prev) => ({
        ...prev,
        chunkActivationState: {
          ...prev.chunkActivationState,
          chunks: dueChunks,
          currentIndex: 0,
          startTime: Date.now(),
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load chunks:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '加载语块失败，请稍后重试',
      }));
    }
  }, []);

  const generateChunkPrompt = useCallback(async (chunk: SavedChunk, format: ChunkActivationFormat) => {
    try {
      const prompt = await thinkService.generateChunkPrompt(chunk, format);
      setState((prev) => ({
        ...prev,
        chunkActivationState: {
          ...prev.chunkActivationState,
          currentFormat: format,
          currentPrompt: prompt,
        },
      }));
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setState((prev) => ({
        ...prev,
        error: '生成练习提示失败',
      }));
    }
  }, []);

  const submitChunkAnswer = useCallback(async (answer: string) => {
    const { chunkActivationState } = state;
    const { chunks, currentIndex, currentFormat } = chunkActivationState;
    const currentChunk = chunks[currentIndex];

    if (!currentChunk || !answer.trim()) return;

    setState((prev) => ({
      ...prev,
      chunkActivationState: {
        ...prev.chunkActivationState,
        userAnswer: answer,
      },
      isLoading: true,
    }));

    try {
      const result = await thinkService.evaluateChunkActivation(
        currentChunk,
        answer,
        currentFormat
      );

      // Update SRS
      const quality = Math.round(result.score);
      await chunkService.updateMastery(currentChunk.id, quality);

      setState((prev) => ({
        ...prev,
        chunkActivationState: {
          ...prev.chunkActivationState,
          feedback: result,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Evaluation failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '评估答案失败',
      }));
    }
  }, [state]);

  const advanceToNextChunk = useCallback(() => {
    const { chunkActivationState } = state;
    const { chunks, currentIndex } = chunkActivationState;

    if (currentIndex < chunks.length - 1) {
      setState((prev) => ({
        ...prev,
        chunkActivationState: {
          ...prev.chunkActivationState,
          currentIndex: prev.chunkActivationState.currentIndex + 1,
          feedback: null,
          userAnswer: '',
        },
      }));
    } else {
      // Exercise complete - trigger completion
      const totalTime = (Date.now() - state.chunkActivationState.startTime) / 1000;
      const lastFeedback = state.chunkActivationState.feedback;
      completeExercise({
        type: 'chunk-activation',
        timestamp: Date.now(),
        score: lastFeedback?.score ?? 0,
        feedback: lastFeedback?.feedback ?? '',
        timeSpent: totalTime,
      });
    }
  }, [state]);

  // ============================================================================
  // Video Retelling Actions
  // ============================================================================

  const selectVideo = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      videoRetellingState: {
        ...prev.videoRetellingState,
        currentVideoIndex: index,
        evaluation: null,
        userAnswer: '',
      },
    }));
  }, []);

  const toggleTranscript = useCallback(() => {
    setState((prev) => ({
      ...prev,
      videoRetellingState: {
        ...prev.videoRetellingState,
        showTranscript: !prev.videoRetellingState.showTranscript,
      },
    }));
  }, []);

  const generateVideoQuestion = useCallback(async () => {
    const { videoRetellingState } = state;
    const currentVideo = THINK_VIDEOS[videoRetellingState.currentVideoIndex];

    setState((prev) => ({
      ...prev,
      videoRetellingState: {
        ...prev.videoRetellingState,
        isGeneratingQuestion: true,
      },
    }));

    try {
      const question = await thinkService.generateRetellingQuestion(currentVideo.transcript);
      setState((prev) => ({
        ...prev,
        videoRetellingState: {
          ...prev.videoRetellingState,
          question,
          isGeneratingQuestion: false,
        },
      }));
    } catch (error) {
      console.error('Failed to generate question:', error);
      setState((prev) => ({
        ...prev,
        videoRetellingState: {
          ...prev.videoRetellingState,
          question: 'What is the main idea of this video? Please explain in your own words.',
          isGeneratingQuestion: false,
        },
      }));
    }
  }, [state.videoRetellingState.currentVideoIndex]);

  const submitVideoAnswer = useCallback(async (answer: string) => {
    const { videoRetellingState } = state;
    const { currentVideoIndex, question } = videoRetellingState;
    const currentVideo = THINK_VIDEOS[currentVideoIndex];

    if (!answer.trim()) return;

    setState((prev) => ({
      ...prev,
      videoRetellingState: {
        ...prev.videoRetellingState,
        userAnswer: answer,
      },
      isLoading: true,
    }));

    try {
      const evaluation = await thinkService.evaluateVideoRetelling(
        currentVideo.transcript,
        question,
        answer
      );

      setState((prev) => ({
        ...prev,
        videoRetellingState: {
          ...prev.videoRetellingState,
          evaluation,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Evaluation failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '评估答案失败',
      }));
    }
  }, [state]);

  const advanceToNextVideo = useCallback(() => {
    const { videoRetellingState } = state;

    if (videoRetellingState.currentVideoIndex < THINK_VIDEOS.length - 1) {
      setState((prev) => ({
        ...prev,
        videoRetellingState: {
          ...prev.videoRetellingState,
          currentVideoIndex: prev.videoRetellingState.currentVideoIndex + 1,
          evaluation: null,
          userAnswer: '',
        },
      }));
    } else {
      const totalTime = (Date.now() - state.videoRetellingState.startTime) / 1000;
      const avgScore = videoRetellingState.evaluation
        ? (videoRetellingState.evaluation.contentScore +
           videoRetellingState.evaluation.languageScore) / 2
        : 0.5;

      completeExercise({
        type: 'video-retelling',
        timestamp: Date.now(),
        score: avgScore * 5,
        feedback: videoRetellingState.evaluation
          ? `${videoRetellingState.evaluation.feedback.content} ${videoRetellingState.evaluation.feedback.language}`
          : 'Video retelling exercise completed',
        timeSpent: totalTime,
      });
    }
  }, [state]);

  // ============================================================================
  // Logic Rewriting Actions
  // ============================================================================

  const generateLogicChallenge = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      logicRewritingState: {
        ...prev.logicRewritingState,
        isLoading: true,
      },
    }));

    try {
      const challenge = await thinkService.generateLogicChallenge();
      setState((prev) => ({
        ...prev,
        logicRewritingState: {
          ...prev.logicRewritingState,
          challenge,
          userAttempt: '',
          result: null,
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error('Failed to generate challenge:', error);
      setState((prev) => ({
        ...prev,
        logicRewritingState: {
          ...prev.logicRewritingState,
          isLoading: false,
        },
        error: '生成挑战失败',
      }));
    }
  }, []);

  const submitLogicAnswer = useCallback(async (answer: string) => {
    const { logicRewritingState } = state;
    const { challenge } = logicRewritingState;

    if (!challenge || !answer.trim()) return;

    setState((prev) => ({
      ...prev,
      logicRewritingState: {
        ...prev.logicRewritingState,
        userAttempt: answer,
      },
      isLoading: true,
    }));

    try {
      const evaluation = await thinkService.evaluateLogicRewriting(
        challenge.originalAnswer,
        challenge.challengeType,
        challenge.targetElement,
        answer
      );

      setState((prev) => ({
        ...prev,
        logicRewritingState: {
          ...prev.logicRewritingState,
          result: evaluation,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Evaluation failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: '评估答案失败',
      }));
    }
  }, [state]);

  const retryLogicChallenge = useCallback(() => {
    setState((prev) => ({
      ...prev,
      logicRewritingState: {
        ...prev.logicRewritingState,
        result: null,
        userAttempt: '',
      },
    }));
  }, []);

  const advanceToNextChallenge = useCallback(() => {
    const { logicRewritingState } = state;
    const newCount = logicRewritingState.completedCount + 1;

    if (newCount >= 3) {
      const totalTime = (Date.now() - state.logicRewritingState.startTime) / 1000;
      const avgScore = logicRewritingState.result?.score ?? 3;

      completeExercise({
        type: 'logic-rewriting',
        timestamp: Date.now(),
        score: avgScore,
        feedback: logicRewritingState.result?.feedback ?? 'Logic rewriting exercise completed',
        timeSpent: totalTime,
      });
    } else {
      setState((prev) => ({
        ...prev,
        logicRewritingState: {
          ...prev.logicRewritingState,
          completedCount: newCount,
        },
      }));
      generateLogicChallenge();
    }
  }, [state, generateLogicChallenge]);

  // ============================================================================
  // Session Management
  // ============================================================================

  const completeExercise = useCallback((result: ExerciseResult) => {
    setState((prev) => ({
      ...prev,
      sessionResults: [...prev.sessionResults, result],
      phase: 'feedback',
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ============================================================================
  // Auto-generate video question when video changes
  // ============================================================================

  useEffect(() => {
    if (state.phase === 'video-retelling') {
      generateVideoQuestion();
    }
  }, [state.videoRetellingState.currentVideoIndex, state.phase, generateVideoQuestion]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ThinkContextValue = {
    state,
    // Navigation
    goToPhase,
    selectExercise,
    restartSession,
    // Chunk activation
    loadChunksForReview,
    generateChunkPrompt,
    submitChunkAnswer,
    advanceToNextChunk,
    // Video retelling
    selectVideo,
    toggleTranscript,
    generateVideoQuestion,
    submitVideoAnswer,
    advanceToNextVideo,
    // Logic rewriting
    generateLogicChallenge,
    submitLogicAnswer,
    retryLogicChallenge,
    advanceToNextChallenge,
    // Session
    completeExercise,
    clearError,
  };

  return (
    <ThinkContext.Provider value={value}>
      {children}
    </ThinkContext.Provider>
  );
};
