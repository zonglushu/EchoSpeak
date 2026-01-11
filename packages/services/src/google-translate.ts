/**
 * Google Cloud Translation API 客户端
 * 专用翻译 API，速度远快于 AI 大模型
 * 
 * 优势：
 * - 响应时间：200-800ms（比智谱 GLM 快 5-10 倍）
 * - 成本：$20/百万字符（比 AI 模型便宜）
 * - 支持 100+ 语言
 * - 批量翻译优化
 */

interface TranslateRequest {
  q: string | string[];
  target: string;
  source?: string;
  format?: 'text' | 'html';
  model?: 'nmt' | 'base';
}

interface TranslateResponse {
  data: {
    translations: Array<{
      translatedText: string;
      detectedSourceLanguage?: string;
    }>;
  };
}

/**
 * Google Translate API 客户端
 */
export class GoogleTranslateClient {
  private apiKey: string;
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 批量翻译文本（支持一次翻译多条）
   * @param texts 要翻译的文本数组
   * @param targetLang 目标语言 ('zh-CN' 或 'en')
   * @param sourceLang 源语言（可选，会自动检测）
   * @returns 翻译结果数组
   */
  async translateBatch(
    texts: string[],
    targetLang: 'zh-CN' | 'en',
    sourceLang?: string
  ): Promise<string[]> {
    if (texts.length === 0) return [];

    const startTime = Date.now();
    
    try {
      const request: TranslateRequest = {
        q: texts,
        target: targetLang === 'zh-CN' ? 'zh' : 'en',
        format: 'text',
        model: 'nmt', // 神经网络翻译模型（更好的质量）
      };

      if (sourceLang) {
        request.source = sourceLang === 'zh-CN' ? 'zh' : 'en';
      }

      const url = `${this.baseUrl}?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Translate API error: ${error}`);
      }

      const data: TranslateResponse = await response.json();
      const latency = Date.now() - startTime;

      console.warn(`[Google Translate] 翻译 ${texts.length} 条文本, 耗时: ${latency}ms, 平均: ${Math.round(latency / texts.length)}ms/条`);

      return data.data.translations.map(t => t.translatedText);
    } catch (error) {
      console.error('[Google Translate] 翻译失败:', error);
      throw error;
    }
  }

  /**
   * 翻译单条文本
   */
  async translate(
    text: string,
    targetLang: 'zh-CN' | 'en',
    sourceLang?: string
  ): Promise<string> {
    const results = await this.translateBatch([text], targetLang, sourceLang);
    return results[0];
  }

  /**
   * 检测文本语言
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/detect?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: text }),
      });

      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language;
    } catch (error) {
      console.error('[Google Translate] 语言检测失败:', error);
      throw error;
    }
  }
}

/**
 * DeepL API 客户端（备选方案，翻译质量更高）
 */
export class DeepLClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, useFreeApi = false) {
    this.apiKey = apiKey;
    // Free API 和 Pro API 有不同的端点
    this.baseUrl = useFreeApi
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2';
  }

  /**
   * 批量翻译文本（支持最多 50 条）
   * 
   * @param texts 待翻译文本数组（最多 50 条）
   * @param targetLang 目标语言
   * @param sourceLang 源语言（可选，自动检测）
   * @param options 翻译选项
   */
  async translateBatch(
    texts: string[],
    targetLang: 'ZH' | 'EN',
    sourceLang?: string,
    options?: {
      modelType?: 'latency_optimized' | 'quality_optimized' | 'prefer_quality_optimized';
      splitSentences?: '0' | '1' | 'nonewlines';
      preserveFormatting?: boolean;
    }
  ): Promise<string[]> {
    if (texts.length === 0) return [];
    
    // DeepL 限制：单次最多 50 条
    if (texts.length > 50) {
      console.warn(`[DeepL] 警告：单次请求超过 50 条（${texts.length}），将被截断`);
      texts = texts.slice(0, 50);
    }

    const startTime = Date.now();

    try {
      // 使用 JSON 格式（推荐）
      const requestBody: Record<string, unknown> = {
        text: texts,
        target_lang: targetLang,
      };

      if (sourceLang) {
        requestBody.source_lang = sourceLang;
      }

      // 可选参数
      if (options?.modelType) {
        requestBody.model_type = options.modelType;
      }
      if (options?.splitSentences) {
        requestBody.split_sentences = options.splitSentences;
      }
      if (options?.preserveFormatting !== undefined) {
        requestBody.preserve_formatting = options.preserveFormatting;
      }

      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepL API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      console.warn(
        `[DeepL] 翻译 ${texts.length} 条文本, ` +
        `耗时: ${latency}ms, ` +
        `平均: ${Math.round(latency / texts.length)}ms/条`
      );

      return data.translations.map((t: { text: string }) => t.text);
    } catch (error) {
      console.error('[DeepL] 翻译失败:', error);
      throw error;
    }
  }

  /**
   * 翻译单条文本
   */
  async translate(
    text: string,
    targetLang: 'ZH' | 'EN',
    sourceLang?: string
  ): Promise<string> {
    const results = await this.translateBatch([text], targetLang, sourceLang);
    return results[0];
  }
}
