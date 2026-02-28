/**
 * Think Service - AI evaluation and question generation for Think mode
 *
 * Provides:
 * - Chunk activation exercise generation and evaluation
 * - Video retelling question generation and evaluation
 * - Logic rewriting challenge generation and evaluation
 *
 * @module services/thinkService
 */

import { generateProsodyNotationAI } from '@echospeak/services';
import type {
  SavedChunk,
  RetellingEvaluation,
  LogicRewritingExercise,
} from '../types/mode';

import { logError, ServiceError } from './errors';

/**
 * Custom error class for Think service operations.
 */
export class ThinkServiceError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'THINK_SERVICE_ERROR', cause, false);
  }
}

/**
 * Formats for chunk activation exercises
 */
export type ChunkActivationFormat =
  | 'sentence-creation'
  | 'scenario-application'
  | 'translation';

/**
 * Result type for chunk activation evaluation
 */
export interface ChunkActivationResult {
  score: number; // 0-5
  feedback: string;
}

/**
 * Result type for video retelling evaluation
 */
export interface VideoRetellingResult {
  contentScore: number; // 0-1
  languageScore: number; // 0-1
  feedback: {
    content: string;
    language: string;
    improvement: string;
  };
}

/**
 * Result type for logic rewriting evaluation
 */
export interface LogicRewritingResult {
  score: number; // 0-5
  feedback: string;
}

/**
 * Sanitizes JSON payload from AI responses
 * Handles markdown code blocks and edge cases
 */
function sanitizeJsonPayload(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    const lastBackticks = cleaned.lastIndexOf('```');
    if (firstNewline !== -1 && lastBackticks !== -1) {
      cleaned = cleaned.substring(firstNewline + 1, lastBackticks).trim();
    }
  }

  return cleaned;
}

/**
 * Think Service - Public API
 */
export const thinkService = {
  /**
   * Generates a prompt for chunk activation exercise
   *
   * @param chunk - The chunk to generate a prompt for
   * @param format - The exercise format
   * @returns Promise resolving to the generated prompt
   */
  async generateChunkPrompt(
    chunk: SavedChunk,
    format: ChunkActivationFormat
  ): Promise<string> {
    try {
      const prompts = {
        'sentence-creation': `Create a natural English sentence using "${chunk.text}".`,
        'scenario-application': `Scenario: You are in a business meeting. Use "${chunk.text}" appropriately in this context.`,
        'translation': `Translate to English: "${chunk.translation}"`,
      };
      return prompts[format];
    } catch (error) {
      logError(error, 'thinkService.generateChunkPrompt');
      throw new ThinkServiceError('Failed to generate chunk prompt', error);
    }
  },

  /**
   * Evaluates a user's answer for chunk activation exercise
   *
   * @param chunk - The chunk being practiced
   * @param userAnswer - The user's answer
   * @param format - The exercise format
   * @returns Promise resolving to evaluation result
   */
  async evaluateChunkActivation(
    chunk: SavedChunk,
    userAnswer: string,
    format: ChunkActivationFormat
  ): Promise<ChunkActivationResult> {
    const prompt = `
Evaluate this English learning exercise:

Chunk: "${chunk.text}" (${chunk.translation})
User Answer: "${userAnswer}"
Format: ${format}

Scoring (0-5):
- 5: Perfect usage, natural context, grammatically correct
- 4: Very good, minor issues
- 3: Acceptable, some errors
- 2: Poor, significant errors
- 1: Incorrect usage
- 0: Irrelevant or gibberish

Return JSON only: { "score": 0-5, "feedback": "specific feedback in Chinese" }
`;

    try {
      const result = await generateProsodyNotationAI(prompt);
      const cleaned = sanitizeJsonPayload(result);
      const parsed = JSON.parse(cleaned) as ChunkActivationResult;
      return parsed;
    } catch (error) {
      logError(error, 'thinkService.evaluateChunkActivation');
      // Fallback response
      return {
        score: 3,
        feedback: 'AI 服务暂时不可用，练习已记录！',
      };
    }
  },

  /**
   * Generates a comprehension question for video retelling
   *
   * @param transcript - The video transcript
   * @returns Promise resolving to the generated question
   */
  async generateRetellingQuestion(transcript: string): Promise<string> {
    const prompt = `
Based on the following transcript, generate ONE comprehension question that tests understanding:

Transcript: ${transcript}

Generate a question that requires the viewer to understand and explain the content in their own words.
Return just the question text, no JSON.
`;

    try {
      const result = await generateProsodyNotationAI(prompt);
      return result.trim();
    } catch (error) {
      logError(error, 'thinkService.generateRetellingQuestion');
      throw new ThinkServiceError('Failed to generate retelling question', error);
    }
  },

  /**
   * Evaluates a user's answer for video retelling exercise
   *
   * @param transcript - The video transcript
   * @param question - The question asked
   * @param userAnswer - The user's answer
   * @returns Promise resolving to evaluation result
   */
  async evaluateVideoRetelling(
    transcript: string,
    question: string,
    userAnswer: string
  ): Promise<VideoRetellingResult> {
    const prompt = `
Evaluate this video retelling exercise:

Transcript: ${transcript}
Question: ${question}
User Answer: "${userAnswer}"

Evaluate on two dimensions:
1. Content Score (0-1): Does the answer demonstrate understanding of the video content?
2. Language Score (0-1): Is the language natural, grammatically correct, and well-structured?

Return JSON only:
{
  "contentScore": 0.0-1.0,
  "languageScore": 0.0-1.0,
  "feedback": {
    "content": "content feedback in Chinese",
    "language": "language feedback in Chinese",
    "improvement": "suggestion for improvement in Chinese"
  }
}
`;

    try {
      const result = await generateProsodyNotationAI(prompt);
      const cleaned = sanitizeJsonPayload(result);
      const parsed = JSON.parse(cleaned) as VideoRetellingResult;
      return parsed;
    } catch (error) {
      logError(error, 'thinkService.evaluateVideoRetelling');
      // Fallback response
      return {
        contentScore: 0.5,
        languageScore: 0.5,
        feedback: {
          content: 'AI 服务暂时不可用',
          language: 'AI 服务暂时不可用',
          improvement: '练习已记录！',
        },
      };
    }
  },

  /**
   * Generates a logic rewriting challenge
   *
   * @returns Promise resolving to the generated challenge
   */
  async generateLogicChallenge(): Promise<LogicRewritingExercise> {
    const challengeTypes = [
      'vocabulary-upgrade',
      'grammar-structure',
      'logic-extension',
      'style-transformation',
    ] as const;

    const sampleSentences = [
      'The movie was good.',
      'I went to the store.',
      'She is happy.',
      'They worked hard.',
      'He likes reading books.',
    ];

    const challenges = {
      'vocabulary-upgrade': {
        original: 'The movie was good.',
        target: 'Replace "good" with more sophisticated vocabulary',
      },
      'grammar-structure': {
        original: 'I went to the store.',
        target: 'Transform into passive voice',
      },
      'logic-extension': {
        original: 'She is happy.',
        target: 'Extend with a reason clause',
      },
      'style-transformation': {
        original: 'They worked hard.',
        target: 'Transform into formal business language',
      },
    };

    // Randomly select a challenge type
    const randomType =
      challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    const challenge = challenges[randomType];

    const prompt = `
Generate a logic rewriting challenge:

Type: ${randomType}
Original Sentence: "${challenge.original}"
Target: ${challenge.target}

Return JSON only:
{
  "id": "unique-id",
  "type": "${randomType}",
  "originalAnswer": "${challenge.original}",
  "challengeType": "${randomType}",
  "targetElement": "${challenge.target}",
  "hint": "optional hint for the user",
  "difficulty": 2,
  "completed": false
}
`;

    try {
      const result = await generateProsodyNotationAI(prompt);
      const cleaned = sanitizeJsonPayload(result);
      const parsed = JSON.parse(cleaned) as LogicRewritingExercise;

      // Ensure all required fields are present
      return {
        id: parsed.id || `challenge-${Date.now()}`,
        type: parsed.type || randomType,
        originalAnswer: parsed.originalAnswer || challenge.original,
        challengeType: parsed.challengeType || randomType,
        targetElement: parsed.targetElement || challenge.target,
        hint: parsed.hint,
        difficulty: parsed.difficulty || 2,
        completed: false,
      };
    } catch (error) {
      logError(error, 'thinkService.generateLogicChallenge');
      // Fallback challenge
      return {
        id: `challenge-${Date.now()}`,
        type: randomType,
        originalAnswer: challenge.original,
        challengeType: randomType,
        targetElement: challenge.target,
        hint: 'Try to use more sophisticated vocabulary',
        difficulty: 2,
        completed: false,
      };
    }
  },

  /**
   * Evaluates a user's attempt at logic rewriting
   *
   * @param originalAnswer - The original sentence
   * @param challengeType - The type of challenge
   * @param targetElement - What was being targeted
   * @param userAttempt - The user's attempt
   * @returns Promise resolving to evaluation result
   */
  async evaluateLogicRewriting(
    originalAnswer: string,
    challengeType: string,
    targetElement: string,
    userAttempt: string
  ): Promise<LogicRewritingResult> {
    const prompt = `
Evaluate this logic rewriting exercise:

Original Sentence: "${originalAnswer}"
Challenge Type: ${challengeType}
Target: ${targetElement}
User Attempt: "${userAttempt}"

Scoring (0-5):
- 5: Excellent transformation, perfectly meets the challenge
- 4: Very good, minor improvements possible
- 3: Good attempt, meets basic requirements
- 2: Fair, partially meets requirements
- 1: Poor, does not meet requirements
- 0: Unrelated or unintelligible

Return JSON only: { "score": 0-5, "feedback": "specific feedback in Chinese" }
`;

    try {
      const result = await generateProsodyNotationAI(prompt);
      const cleaned = sanitizeJsonPayload(result);
      const parsed = JSON.parse(cleaned) as LogicRewritingResult;
      return parsed;
    } catch (error) {
      logError(error, 'thinkService.evaluateLogicRewriting');
      // Fallback response
      return {
        score: 3,
        feedback: 'AI 服务暂时不可用，练习已记录！',
      };
    }
  },
};
