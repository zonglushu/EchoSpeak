/**
 * Dialogue Service - Manages AI-powered dialogue interactions
 *
 * Provides dialogue analysis and response generation using Gemini AI:
 * - Response analysis (pronunciation, grammar, pragmatics, content)
 * - AI response generation for branching dialogue
 * - Battle result calculation
 *
 * @module services/dialogueService
 */

import type {
  ResponseAnalysis,
  DialogueNode,
  DialogueBranch,
  EvaluationCriteria,
  DialogueTurn,
  BattleResult
} from '../types/mode';
import { logError, ServiceError } from './errors';
import { generateProsodyNotationAI } from '@echospeak/services';

/**
 * Custom error class for dialogue service operations.
 */
export class DialogueServiceError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'DIALOGUE_SERVICE_ERROR', cause, false);
  }
}

/**
 * Sanitizes JSON payload from LLM responses
 * Handles markdown-wrapped JSON and common formatting issues
 */
function sanitizeJsonPayload(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    const lastBackticks = cleaned.lastIndexOf('```');
    if (firstNewline !== -1 && lastBackticks !== -1) {
      cleaned = cleaned.substring(firstNewline + 1, lastBackticks).trim();
    }
  }

  // Handle common LLM quirks
  cleaned = cleaned
    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
    .replace(/'/g, '"')      // Replace single quotes with double quotes
    .replace(/\\"/g, '"');   // Fix escaped quotes

  return cleaned;
}

/**
 * Analyzes user response using AI
 *
 * @param userText - User's spoken/written response
 * @param aiMessage - AI's previous message for context
 * @returns Promise resolving to response analysis
 */
export async function analyzeResponse(
  userText: string,
  aiMessage: string
): Promise<ResponseAnalysis> {
  const prompt = `
Analyze this English response in a conversation context:

AI said: "${aiMessage}"
User replied: "${userText}"

Rate each category from 0 to 1 (be critical but fair):
- pronunciationScore: Based on likely pronunciation (estimated from text clarity)
- grammarScore: Grammatical correctness
- pragmaticScore: Appropriateness for the context (politeness, tone)
- contentRelevance: How well it addresses the AI's message

Also provide:
- feedback: One specific, actionable improvement tip (2-3 sentences)
- suggestedReply: A better alternative response (natural English)

Return ONLY valid JSON in this exact format:
{
  "pronunciationScore": 0.8,
  "grammarScore": 0.7,
  "pragmaticScore": 0.6,
  "contentRelevance": 0.9,
  "feedback": "Good job, but try to use more professional language.",
  "suggestedReply": "I understand your concern. Let me explain the situation."
}
`;

  try {
    // Try to use AI service
    const result = await generateProsodyNotationAI(prompt, {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
    });

    const cleaned = sanitizeJsonPayload(result);
    const parsed = JSON.parse(cleaned) as ResponseAnalysis;

    // Validate and normalize scores
    return {
      pronunciationScore: Math.min(1, Math.max(0, parsed.pronunciationScore)),
      grammarScore: Math.min(1, Math.max(0, parsed.grammarScore)),
      pragmaticScore: Math.min(1, Math.max(0, parsed.pragmaticScore)),
      contentRelevance: Math.min(1, Math.max(0, parsed.contentRelevance)),
      feedback: parsed.feedback || 'Keep practicing!',
      suggestedReply: parsed.suggestedReply || userText,
    };
  } catch (error) {
    logError(error, 'dialogueService.analyzeResponse');

    // Fallback to simple rule-based scoring
    return fallbackAnalysis(userText, aiMessage);
  }
}

/**
 * Fallback analysis when AI is unavailable
 * Uses simple heuristics to score responses
 */
function fallbackAnalysis(userText: string, aiMessage: string): ResponseAnalysis {
  const wordCount = userText.split(/\s+/).length;
  const hasCommonWords = /\b(the|is|at|which|on)\b/i.test(userText);
  const isTooShort = wordCount < 3;
  const isTooLong = wordCount > 50;

  // Simple heuristic scoring
  const grammarScore = isTooShort ? 0.4 : hasCommonWords ? 0.6 : 0.5;
  const contentRelevance = isTooShort ? 0.3 : wordCount > 5 ? 0.6 : 0.5;
  const pragmaticScore = 0.5; // Neutral when we can't assess tone
  const pronunciationScore = 0.7; // Assume decent if we can't check

  return {
    pronunciationScore,
    grammarScore,
    pragmaticScore,
    contentRelevance,
    feedback: isTooShort
      ? 'Try to provide a longer response with more detail.'
      : isTooLong
      ? 'Keep your response more concise.'
      : 'Good effort! Keep practicing to improve.',
    suggestedReply: userText,
  };
}

/**
 * Finds the next dialogue node based on user response analysis
 *
 * @param currentNode - Current dialogue node
 * @param analysis - User's response analysis
 * @returns Next node ID or 'end' if dialogue should finish
 */
export function findNextNode(
  currentNode: DialogueNode,
  analysis: ResponseAnalysis
): string {
  // Find first matching branch
  for (const branch of currentNode.branches) {
    try {
      if (branch.condition(analysis)) {
        return branch.nextNodeId;
      }
    } catch (error) {
      logError(error, 'dialogueService.findNextNode');
      continue;
    }
  }

  // If no branch matches, end the dialogue
  return 'end';
}

/**
 * Generates AI response for the next dialogue node
 * For MVP, this returns the node's text directly
 *
 * @param nextNodeId - Next node ID to generate response for
 * @param dialogueScript - Current dialogue script (simplified, just returns first node)
 * @returns AI response text
 */
export function generateAIResponse(
  nextNodeId: string,
  currentNode: DialogueNode
): string {
  // For MVP simplified implementation: return a generic response
  // In a full implementation, this would traverse the dialogue tree

  const responses: Record<string, string> = {
    'node-2a': 'That sounds reasonable. Can you tell me more about what happened?',
    'node-2b': 'Hmm, I see. Could you be more specific?',
    'node-3a': 'Good to know. What\'s your plan to fix this?',
    'node-3b': 'I see. So what are the next steps?',
    'end': 'Thank you for the conversation. Good luck!',
  };

  return responses[nextNodeId] || 'I see. Tell me more.';
}

/**
 * Calculates final battle result from dialogue history
 *
 * @param dialogueHistory - Array of dialogue turns
 * @param criteria - Evaluation criteria from the mission
 * @returns Final battle result
 */
export function calculateBattleResult(
  dialogueHistory: DialogueTurn[],
  criteria: EvaluationCriteria
): BattleResult {
  const userTurns = dialogueHistory.filter(turn => turn.character === 'user' && turn.analysis);

  if (userTurns.length === 0) {
    return {
      overallScore: 0,
      pronunciationScore: 0,
      fluencyScore: 0,
      contentScore: 0,
      passed: false,
      feedback: [{ category: 'general', message: 'No responses recorded.' }],
      timestamp: Date.now(),
    };
  }

  // Calculate average scores
  const avgPronunciation = userTurns.reduce((sum, turn) => sum + (turn.analysis?.pronunciationScore || 0), 0) / userTurns.length;
  const avgGrammar = userTurns.reduce((sum, turn) => sum + (turn.analysis?.grammarScore || 0), 0) / userTurns.length;
  const avgPragmatic = userTurns.reduce((sum, turn) => sum + (turn.analysis?.pragmaticScore || 0), 0) / userTurns.length;
  const avgContent = userTurns.reduce((sum, turn) => sum + (turn.analysis?.contentRelevance || 0), 0) / userTurns.length;

  // Calculate weighted scores
  const pronunciationScore = avgPronunciation;
  const fluencyScore = (avgGrammar + avgPragmatic) / 2;
  const contentScore = avgContent;

  const overallScore =
    (pronunciationScore * criteria.pronunciationWeight) +
    (avgGrammar * criteria.grammarWeight) +
    (avgPragmatic * criteria.pragmaticWeight) +
    (contentScore * criteria.contentWeight);

  const passed = overallScore >= criteria.passingScore;

  // Generate feedback
  const feedback: Array<{ category: string; message: string }> = [];

  if (avgPronunciation < 0.7) {
    feedback.push({ category: 'pronunciation', message: 'Work on pronouncing words more clearly.' });
  }
  if (avgGrammar < 0.7) {
    feedback.push({ category: 'grammar', message: 'Review basic grammar structures.' });
  }
  if (avgPragmatic < 0.7) {
    feedback.push({ category: 'pragmatics', message: 'Try to use more appropriate tone and politeness.' });
  }
  if (avgContent < 0.7) {
    feedback.push({ category: 'content', message: 'Make sure your responses directly address the question.' });
  }

  if (feedback.length === 0) {
    feedback.push({ category: 'general', message: 'Great job! Your performance was solid.' });
  }

  return {
    overallScore,
    pronunciationScore,
    fluencyScore,
    contentScore,
    passed,
    feedback,
    timestamp: Date.now(),
  };
}

/**
 * Dialogue Service - Public API
 */
export const dialogueService = {
  analyzeResponse,
  findNextNode,
  generateAIResponse,
  calculateBattleResult,
};
