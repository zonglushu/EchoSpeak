/**
 * AI Content Moderation Service
 *
 * Automated content moderation using AI to detect:
 * - NSFW content
 * - Violence
 * - Hate speech
 * - Spam
 * - Inappropriate content
 */

import { getClient } from './gemini';

/**
 * Moderation categories
 */
export type ModerationCategory =
  | 'nsfw'
  | 'violence'
  | 'hate'
  | 'spam'
  | 'inappropriate'
  | 'safe';

/**
 * Moderation result
 */
export interface ModerationResult {
  category: ModerationCategory;
  confidence: number; // 0-1
  flags: string[];
  shouldAutoApprove: boolean;
  shouldAutoReject: boolean;
  needsHumanReview: boolean;
  reasoning: string;
}

/**
 * Content to moderate
 */
export interface ContentToModerate {
  title?: string;
  text: string;
  language?: string;
}

/**
 * Analyze content for moderation
 */
export async function moderateContent(
  content: ContentToModerate,
  options: {
    apiKey?: string;
    strictMode?: boolean;
  } = {}
): Promise<ModerationResult> {
  try {
    const ai = getClient(options.apiKey);

    if (!ai) {
      // Fallback: basic keyword-based moderation
      return basicKeywordModeration(content);
    }

    const prompt = `You are a content moderation AI. Analyze the following content and determine if it is appropriate for an educational language learning platform.

Content to analyze:
Title: "${content.title || 'N/A'}"
Text: "${content.text}"
Language: ${content.language || 'unknown'}

Evaluate the content for:
1. NSFW/Sexual content (0-1)
2. Violence/Gore (0-1)
3. Hate speech/Discrimination (0-1)
4. Spam/Misleading content (0-1)
5. General appropriateness for education (0-1)

Respond in JSON format:
{
  "category": "safe" | "nsfw" | "violence" | "hate" | "spam" | "inappropriate",
  "confidence": 0.0-1.0,
  "flags": ["list of specific issues found"],
  "reasoning": "brief explanation"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const aiResult = JSON.parse(response.text || '{}');

    // Determine action based on confidence
    const confidence = aiResult.confidence || 0;
    const strictMode = options.strictMode ?? true;

    let shouldAutoApprove = false;
    let shouldAutoReject = false;
    let needsHumanReview = false;

    if (aiResult.category === 'safe' && confidence >= 0.95) {
      shouldAutoApprove = true;
    } else if (confidence >= 0.9) {
      shouldAutoReject = true;
    } else if (aiResult.category !== 'safe' && confidence >= 0.5) {
      shouldAutoReject = strictMode;
      needsHumanReview = !strictMode;
    } else {
      needsHumanReview = true;
    }

    return {
      category: aiResult.category || 'safe',
      confidence,
      flags: aiResult.flags || [],
      shouldAutoApprove,
      shouldAutoReject,
      needsHumanReview,
      reasoning: aiResult.reasoning || 'AI analysis completed',
    };
  } catch (error) {
    console.error('AI moderation failed:', error);
    // Fallback to basic moderation
    return basicKeywordModeration(content);
  }
}

/**
 * Basic keyword-based moderation (fallback)
 */
function basicKeywordModeration(content: ContentToModerate): ModerationResult {
  const text = content.text.toLowerCase();
  const title = (content.title || '').toLowerCase();
  const combined = `${title} ${text}`;

  // NSFW keywords (basic list)
  const nsfwKeywords = ['porn', 'sex', 'nude', 'naked'];
  // Violence keywords
  const violenceKeywords = ['kill', 'murder', 'blood', 'gore', 'violence'];
  // Hate speech keywords
  const hateKeywords = ['hate', 'racist', 'discrimination'];

  const flags: string[] = [];
  let category: ModerationCategory = 'safe';
  let confidence = 0;

  for (const keyword of nsfwKeywords) {
    if (combined.includes(keyword)) {
      flags.push(`NSFW keyword: ${keyword}`);
      category = 'nsfw';
      confidence = Math.max(confidence, 0.7);
    }
  }

  for (const keyword of violenceKeywords) {
    if (combined.includes(keyword)) {
      flags.push(`Violence keyword: ${keyword}`);
      if (category === 'safe') category = 'violence';
      confidence = Math.max(confidence, 0.6);
    }
  }

  for (const keyword of hateKeywords) {
    if (combined.includes(keyword)) {
      flags.push(`Hate speech keyword: ${keyword}`);
      if (category === 'safe') category = 'hate';
      confidence = Math.max(confidence, 0.8);
    }
  }

  return {
    category,
    confidence,
    flags,
    shouldAutoApprove: category === 'safe' && confidence < 0.3,
    shouldAutoReject: category !== 'safe' && confidence > 0.7,
    needsHumanReview: category !== 'safe' || confidence >= 0.3,
    reasoning: flags.length > 0
      ? `Flagged for: ${flags.join(', ')}`
      : 'No issues found (keyword-based check)',
  };
}

/**
 * Batch moderate multiple content items
 */
export async function batchModerate(
  contents: ContentToModerate[],
  options: {
    apiKey?: string;
    strictMode?: boolean;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<ModerationResult[]> {
  const results: ModerationResult[] = [];

  for (let i = 0; i < contents.length; i++) {
    const result = await moderateContent(contents[i], options);
    results.push(result);

    if (options.onProgress) {
      options.onProgress(Math.round(((i + 1) / contents.length) * 100));
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get moderation statistics
 */
export function getModerationStats(results: ModerationResult[]): {
  total: number;
  safe: number;
  nsfw: number;
  violence: number;
  hate: number;
  spam: number;
  inappropriate: number;
  autoApproved: number;
  autoRejected: number;
  humanReview: number;
  avgConfidence: number;
} {
  const stats = {
    total: results.length,
    safe: 0,
    nsfw: 0,
    violence: 0,
    hate: 0,
    spam: 0,
    inappropriate: 0,
    autoApproved: 0,
    autoRejected: 0,
    humanReview: 0,
    avgConfidence: 0,
  };

  let totalConfidence = 0;

  for (const result of results) {
    stats[result.category]++;
    stats.avgConfidence += result.confidence;

    if (result.shouldAutoApprove) stats.autoApproved++;
    if (result.shouldAutoReject) stats.autoRejected++;
    if (result.needsHumanReview) stats.humanReview++;
  }

  stats.avgConfidence = results.length > 0 ? totalConfidence / results.length : 0;

  return stats;
}
