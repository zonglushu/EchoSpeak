/**
 * Chunk Classification Module
 *
 * Automatically categorizes text chunks into semantic categories
 * using keyword-based pattern matching.
 *
 * @module utils/chunkClassifier
 */

import { ChunkCategory } from '../../types/mode';

/**
 * Keyword patterns for each category.
 * Defined as constant arrays for easy extension and maintenance.
 */
const KEYWORD_PATTERNS = {
  /**
   * Business/Corporate vocabulary
   */
  BUSINESS: [
    'align', 'schedule', 'deliverable', 'bandwidth', 'touch base',
    'loop in', 'deadline', 'milestone', 'stakeholder', 'kpi',
    'roi', 'synergy', 'leverage', 'scalable', 'workflow',
    'quarter', 'fiscal', 'presentation', 'meeting', 'agenda',
    'action item', 'follow up', 'calendar', 'delegate', 'prioritize'
  ] as const,

  /**
   * Academic/Research vocabulary
   */
  ACADEMIC: [
    'hypothesis', 'methodology', 'analysis', 'thesis', 'research',
    'significant', 'correlation', 'variable', 'qualitative', 'quantitative',
    'framework', 'paradigm', 'empirical', 'theoretical', 'abstract',
    'citation', 'reference', 'peer review', 'journal', 'publication',
    'experiment', 'control group', 'statistical', 'methodology'
  ] as const,

  /**
   * Travel/Transportation vocabulary
   */
  TRAVEL: [
    'reservation', 'check-in', 'departure', 'destination', 'itinerary',
    'passport', 'customs', 'boarding', 'luggage', 'accommodation',
    'flight', 'hotel', 'booking', 'ticket', 'terminal', 'gate',
    'visa', 'immigration', 'transit', 'layover', 'currency'
  ] as const,

  /**
   * Idiomatic expressions and phrases
   */
  IDIOM: [
    'break the ice', 'cut corners', 'hit the nail', 'once in a blue moon',
    'piece of cake', 'under the weather', 'cost an arm', 'spill the beans',
    'let the cat out', 'barking up wrong', 'bite the bullet', 'call it a day',
    'get out of hand', 'go Dutch', 'hang in there', 'in the blink'
  ] as const

  // Note: DAILY_LIFE and CUSTOM are not detected via keywords
  // DAILY_LIFE is the default fallback
  // CUSTOM is user-assigned only
} satisfies Record<string, readonly string[]>;

/**
 * Classification result with confidence score.
 */
export interface ClassificationResult {
  /** The assigned category */
  category: ChunkCategory;
  /** Confidence score (0-1), based on keyword match count */
  confidence: number;
  /** The keywords that were matched */
  matchedKeywords: string[];
}

/**
 * Normalizes text for keyword matching.
 *
 * @param text - The text to normalize
 * @returns Lowercase, trimmed text
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Counts how many keywords from a pattern appear in the text.
 *
 * @param text - The normalized text to search
 * @param keywords - Array of keywords to search for
 * @returns Array of matched keywords
 */
function findMatches(text: string, keywords: readonly string[]): string[] {
  const matches: string[] = [];

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      matches.push(keyword);
    }
  }

  return matches;
}

/**
 * Calculates confidence based on the number of keyword matches.
 *
 * @param matchCount - Number of keywords matched
 * @param maxExpected - Maximum expected matches for high confidence
 * @returns Confidence score between 0 and 1
 */
function calculateConfidence(matchCount: number, maxExpected: number = 3): number {
  return Math.min(1, matchCount / maxExpected);
}

/**
 * Classifies text into a category using keyword matching.
 *
 * The algorithm checks categories in priority order:
 * 1. Business
 * 2. Academic
 * 3. Travel
 * 4. Idiom
 * 5. Daily Life (default fallback)
 *
 * The first category with at least one matching keyword is selected.
 *
 * @param text - The text to classify
 * @returns Classification result with category and confidence
 *
 * @example
 * ```ts
 * const result = classifyChunk("Let's touch base on the deliverable.");
 * // Returns: { category: ChunkCategory.BUSINESS, confidence: 0.67, matchedKeywords: ['touch base', 'deliverable'] }
 * ```
 */
export function classifyChunk(text: string): ClassificationResult {
  const normalized = normalizeText(text);

  // Check each category in priority order
  const businessMatches = findMatches(normalized, KEYWORD_PATTERNS.BUSINESS);
  if (businessMatches.length > 0) {
    return {
      category: ChunkCategory.BUSINESS,
      confidence: calculateConfidence(businessMatches.length),
      matchedKeywords: businessMatches
    };
  }

  const academicMatches = findMatches(normalized, KEYWORD_PATTERNS.ACADEMIC);
  if (academicMatches.length > 0) {
    return {
      category: ChunkCategory.ACADEMIC,
      confidence: calculateConfidence(academicMatches.length),
      matchedKeywords: academicMatches
    };
  }

  const travelMatches = findMatches(normalized, KEYWORD_PATTERNS.TRAVEL);
  if (travelMatches.length > 0) {
    return {
      category: ChunkCategory.TRAVEL,
      confidence: calculateConfidence(travelMatches.length),
      matchedKeywords: travelMatches
    };
  }

  const idiomMatches = findMatches(normalized, KEYWORD_PATTERNS.IDIOM);
  if (idiomMatches.length > 0) {
    return {
      category: ChunkCategory.IDIOM,
      confidence: calculateConfidence(idiomMatches.length),
      matchedKeywords: idiomMatches
    };
  }

  // Default fallback: Daily Life
  return {
    category: ChunkCategory.DAILY_LIFE,
    confidence: 0,
    matchedKeywords: []
  };
}

/**
 * Simplified classification that returns only the category.
 * Use this when you don't need confidence scoring.
 *
 * @param text - The text to classify
 * @returns The assigned category
 */
export function classifyCategory(text: string): ChunkCategory {
  return classifyChunk(text).category;
}

/**
 * Checks if text contains keywords from a specific category.
 *
 * @param text - The text to check
 * @param category - The category to check for
 * @returns True if the text contains keywords from the category
 */
export function hasCategoryKeywords(text: string, category: ChunkCategory): boolean {
  const normalized = normalizeText(text);

  switch (category) {
    case ChunkCategory.BUSINESS:
      return findMatches(normalized, KEYWORD_PATTERNS.BUSINESS).length > 0;
    case ChunkCategory.ACADEMIC:
      return findMatches(normalized, KEYWORD_PATTERNS.ACADEMIC).length > 0;
    case ChunkCategory.TRAVEL:
      return findMatches(normalized, KEYWORD_PATTERNS.TRAVEL).length > 0;
    case ChunkCategory.IDIOM:
      return findMatches(normalized, KEYWORD_PATTERNS.IDIOM).length > 0;
    default:
      return false;
  }
}

/**
 * Gets all available keyword patterns.
 * Useful for testing or displaying classification rules.
 *
 * @returns Readonly record of category to keywords
 */
export function getKeywordPatterns(): Readonly<typeof KEYWORD_PATTERNS> {
  return KEYWORD_PATTERNS;
}
