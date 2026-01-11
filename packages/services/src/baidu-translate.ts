/**
 * 百度翻译 API 客户端
 * 
 * 优势：
 * - 响应时间：400-700ms
 * - 免费额度：5万字符/月 + QPS 1
 * - 成本：¥49/百万字符
 * - 支持 200+ 语种
 * - 大模型翻译：翻译质量更高
 * 
 * 文档：https://fanyi-api.baidu.com/doc/21
 */

import crypto from 'crypto';

interface BaiduTranslateResponse {
  from: string;
  to: string;
  trans_result: Array<{
    src: string;
    dst: string;
  }>;
  error_code?: string;
  error_msg?: string;
}

/**
 * 百度翻译客户端
 */
export class BaiduTranslateClient {
  private appId: string;
  private appKey: string;
  private endpoint = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;
  }

  /**
   * 生成签名
   */
  private generateSign(query: string, salt: string): string {
    const str = `${this.appId}${query}${salt}${this.appKey}`;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * 翻译文本
   */
  async translate(
    text: string,
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en'
  ): Promise<string> {
    const results = await this.translateBatch([text], targetLang, sourceLang);
    return results[0];
  }

  /**
   * 批量翻译（百度支持一次翻译多段文本，用换行符分隔）
   */
  async translateBatch(
    texts: string[],
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en'
  ): Promise<string[]> {
    if (texts.length === 0) return [];

    const startTime = Date.now();

    try {
      // 百度翻译支持用换行符分隔多段文本
      const query = texts.join('\n');
      const salt = Date.now().toString();
      const sign = this.generateSign(query, salt);

      const params = new URLSearchParams({
        q: query,
        from: sourceLang === 'zh' ? 'zh' : (sourceLang === 'en' ? 'en' : 'auto'),
        to: targetLang === 'zh' ? 'zh' : 'en',
        appid: this.appId,
        salt,
        sign,
      });

      const response = await fetch(`${this.endpoint}?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Baidu Translate API error: ${error}`);
      }

      const data: BaiduTranslateResponse = await response.json();

      if (data.error_code) {
        throw new Error(`Baidu API Error ${data.error_code}: ${data.error_msg}`);
      }

      const latency = Date.now() - startTime;
      console.warn(`[百度翻译] 翻译 ${texts.length} 条文本, 耗时: ${latency}ms, 平均: ${Math.round(latency / texts.length)}ms/条`);

      return data.trans_result.map(item => item.dst);
    } catch (error) {
      console.error('[百度翻译] 翻译失败:', error);
      throw error;
    }
  }
}

/**
 * 百度大模型翻译客户端（需要单独申请）
 * 翻译质量更高，支持自定义 Prompt
 * 
 * 文档：https://fanyi-api.baidu.com/product/13
 */
export class BaiduLLMTranslateClient {
  private appId: string;
  private appKey: string;
  private endpoint = 'https://fanyi-api.baidu.com/api/trans/vip/v2/llm';

  constructor(appId: string, appKey: string) {
    this.appId = appId;
    this.appKey = appKey;
  }

  /**
   * 生成签名
   */
  private generateSign(query: string, salt: string): string {
    const str = `${this.appId}${query}${salt}${this.appKey}`;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * 大模型翻译（支持自定义 Prompt）
   */
  async translate(
    text: string,
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en',
    customPrompt?: string
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const query = text;
      const salt = Date.now().toString();
      const sign = this.generateSign(query, salt);

      const params = new URLSearchParams({
        q: query,
        from: sourceLang === 'zh' ? 'zh' : (sourceLang === 'en' ? 'en' : 'auto'),
        to: targetLang === 'zh' ? 'zh' : 'en',
        appid: this.appId,
        salt,
        sign,
      });

      // 自定义 Prompt（可选）
      if (customPrompt) {
        params.append('prompt', customPrompt);
      }

      const response = await fetch(`${this.endpoint}?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Baidu LLM Translate API error: ${error}`);
      }

      const data = await response.json();

      if (data.error_code) {
        throw new Error(`Baidu LLM API Error ${data.error_code}: ${data.error_msg}`);
      }

      const latency = Date.now() - startTime;
      console.warn(`[百度大模型翻译] 耗时: ${latency}ms`);

      return data.trans_result[0].dst;
    } catch (error) {
      console.error('[百度大模型翻译] 翻译失败:', error);
      throw error;
    }
  }

  /**
   * 批量翻译（逐条调用）
   * 百度大模型不支持真正的批量翻译，需要逐条翻译
   */
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang?: string,
    customPrompt?: string
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const text of texts) {
      const result = await this.translate(
        text,
        targetLang as 'zh' | 'en',
        sourceLang as 'zh' | 'en' | undefined,
        customPrompt
      );
      results.push(result);
    }
    
    return results;
  }
}
