/**
 * Basic Annotation Service (Layer 2)
 *
 * Lightweight, rule-based annotation system with minimal AI usage.
 * Cost-effective alternative to full AI processing.
 */

import type { TranscriptLine } from '@echospeak/types';

/**
 * Basic annotation result
 */
export interface BasicAnnotationResult {
  annotatedLine: TranscriptLine;
  confidence: number; // 0-1
  method: 'rule' | 'ai' | 'hybrid';
}

/**
 * Word stress patterns (simplified)
 */
const STRESS_PATTERNS = {
  nouns: ['time', 'year', 'people', 'way', 'day', 'man', 'world', 'life', 'hand'],
  verbs: ['say', 'go', 'get', 'make', 'see', 'know', 'take', 'come', 'think'],
  adjectives: ['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own'],
  adverbs: ['now', 'then', 'there', 'more', 'here', 'out', 'away', 'back'],
};

/**
 * Function words (usually unstressed)
 */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
]);

/**
 * Detect stressed syllables in a word
 */
function detectStress(word: string): { stressed: boolean; level: 'primary' | 'secondary' | 'none' } {
  const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');

  // Check if it's a content word
  const isContentWord =
    STRESS_PATTERNS.nouns.includes(lowerWord) ||
    STRESS_PATTERNS.verbs.includes(lowerWord) ||
    STRESS_PATTERNS.adjectives.includes(lowerWord) ||
    STRESS_PATTERNS.adverbs.includes(lowerWord);

  // Check if it's a function word
  if (FUNCTION_WORDS.has(lowerWord)) {
    return { stressed: false, level: 'none' };
  }

  // Long words (more than 1 syllable) get primary stress
  if (word.length > 6) {
    return { stressed: true, level: 'primary' };
  }

  // Content words get secondary stress
  if (isContentWord) {
    return { stressed: true, level: 'secondary' };
  }

  // Default: moderate stress
  return { stressed: true, level: 'secondary' };
}

/**
 * Detect intonation pattern from punctuation
 */
function detectIntonation(text: string): { pattern: 'rising' | 'falling' | 'neutral'; marker: string } {
  const trimmed = text.trim();

  if (trimmed.endsWith('?')) {
    return { pattern: 'rising', marker: ' ↗' };
  }

  if (trimmed.endsWith('!')) {
    return { pattern: 'falling', marker: ' ↘' };
  }

  if (trimmed.endsWith('.')) {
    return { pattern: 'falling', marker: ' ↘' };
  }

  return { pattern: 'neutral', marker: ' →' };
}

/**
 * Detect liaison/linking opportunities
 */
function detectLiaison(words: string[]): { index: number; marker: string }[] {
  const liaisons: { index: number; marker: string }[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const current = words[i].toLowerCase();
    const next = words[i + 1].toLowerCase();

    // Consonant + vowel: link them
    const endsWithConsonant = /[bcdfghjklmnpqrstvwxyz]$/.test(current);
    const startsWithVowel = /^[aeiou]/.test(next);

    if (endsWithConsonant && startsWithVowel) {
      liaisons.push({ index: i, marker: '_' });
    }
  }

  return liaisons;
}

/**
 * Apply basic annotation rules to a single line
 */
export function applyBasicAnnotation(line: string): BasicAnnotationResult {
  const words = line.split(/\s+/);
  const annotatedWords: string[] = [];
  let ruleCount = 0;

  // Detect intonation
  const { marker: intonationMarker } = detectIntonation(line);

  // Detect liaison points
  const liaisons = detectLiaison(words);
  const liaisonSet = new Set(liaisons.map(l => l.index));

  // Process each word
  words.forEach((word, index) => {
    const { stressed, level } = detectStress(word);

    if (stressed && level === 'primary') {
      // Primary stress: BOLD CAPS
      annotatedWords.push(`**${word.toUpperCase()}**`);
      ruleCount++;
    } else if (stressed && level === 'secondary') {
      // Secondary stress: *Italics*
      annotatedWords.push(`*${word}*`);
      ruleCount++;
    } else {
      // No stress
      annotatedWords.push(word);
    }

    // Add liaison marker if applicable
    if (liaisonSet.has(index)) {
      annotatedWords[annotatedWords.length - 1] += '_';
    }
  });

  // Add pause markers for punctuation
  let result = annotatedWords.join(' ');

  // Replace punctuation with pause markers
  result = result.replace(/,/g, ' |'); // Short pause
  result = result.replace(/\./g, ' ||'); // Long pause
  result = result.replace(/!/g, ' ||');
  result = result.replace(/\?/g, '');

  // Add intonation marker
  result = result.trim() + intonationMarker;

  // Calculate confidence based on how many rules were applied
  const confidence = Math.min(1, ruleCount / (words.length * 0.3));

  return {
    annotatedLine: {
      id: `basic-${Date.now()}-${Math.random()}`,
      text: result,
      translation: '', // No translation in basic annotation
      startTime: 0,
      endTime: 0,
    },
    confidence,
    method: 'rule',
  };
}

/**
 * Apply basic annotation to multiple lines
 */
export function batchAnnotate(lines: string[], options: {
  onProgress?: (progress: number) => void;
} = {}): BasicAnnotationResult[] {
  const results: BasicAnnotationResult[] = [];

  for (let i = 0; i < lines.length; i++) {
    const result = applyBasicAnnotation(lines[i]);
    results.push(result);

    // Update progress
    if (options.onProgress) {
      options.onProgress(Math.round(((i + 1) / lines.length) * 100));
    }

    // Small delay to avoid overwhelming
    if (i % 10 === 0) {
      // Sleep for 10ms every 10 lines
    }
  }

  return results;
}

/**
 * Estimate cost for basic annotation
 */
export function estimateBasicAnnotationCost(lineCount: number): number {
  // Basic annotation is almost free (rule-based)
  // Small overhead for processing time
  return Math.max(0.001, lineCount * 0.0001); // $0.0001 per line
}

/**
 * Get annotation statistics
 */
export function getAnnotationStats(results: BasicAnnotationResult[]): {
  totalLines: number;
  avgConfidence: number;
  ruleBasedCount: number;
  avgProcessingTimeMs: number;
} {
  const totalLines = results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalLines;
  const ruleBasedCount = results.filter(r => r.method === 'rule').length;
  const avgProcessingTimeMs = totalLines * 2; // Estimate: 2ms per line

  return {
    totalLines,
    avgConfidence,
    ruleBasedCount,
    avgProcessingTimeMs,
  };
}
