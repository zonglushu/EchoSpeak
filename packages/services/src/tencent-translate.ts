/**
 * 腾讯云机器翻译 API 客户端
 * 
 * 优势：
 * - 响应时间：300-600ms（国内服务器，最快）
 * - 免费额度：500万字符/月（前3个月）
 * - 成本：¥58/百万字符
 * - 支持 15+ 语种
 * 
 * 文档：https://cloud.tencent.com/document/product/551/15619
 */

import crypto from 'crypto';

interface TencentTranslateRequest {
  SourceText: string;
  Source: string;
  Target: string;
  ProjectId?: number;
  UntranslatedText?: string;
}

interface TencentTranslateResponse {
  Response: {
    TargetText: string;
    Source: string;
    Target: string;
    RequestId: string;
  };
}

/**
 * 腾讯云翻译客户端
 */
export class TencentTranslateClient {
  private secretId: string;
  private secretKey: string;
  private endpoint = 'tmt.tencentcloudapi.com';
  private service = 'tmt';
  private version = '2018-03-21';

  constructor(secretId: string, secretKey: string) {
    this.secretId = secretId;
    this.secretKey = secretKey;
  }

  /**
   * 生成腾讯云 API v3 签名
   */
  private sign(payload: string, timestamp: number): string {
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    
    // 1. 拼接规范请求串
    const canonicalRequest = [
      'POST',
      '/',
      '',
      'content-type:application/json; charset=utf-8',
      `host:${this.endpoint}`,
      '',
      'content-type;host',
      crypto.createHash('sha256').update(payload).digest('hex')
    ].join('\n');

    // 2. 拼接待签名字符串
    const algorithm = 'TC3-HMAC-SHA256';
    const credentialScope = `${date}/${this.service}/tc3_request`;
    const hashedCanonicalRequest = crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex');
    
    const stringToSign = [
      algorithm,
      timestamp,
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');

    // 3. 计算签名
    const secretDate = crypto
      .createHmac('sha256', `TC3${this.secretKey}`)
      .update(date)
      .digest();
    const secretService = crypto
      .createHmac('sha256', secretDate)
      .update(this.service)
      .digest();
    const secretSigning = crypto
      .createHmac('sha256', secretService)
      .update('tc3_request')
      .digest();
    const signature = crypto
      .createHmac('sha256', secretSigning)
      .update(stringToSign)
      .digest('hex');

    // 4. 拼接 Authorization
    return `${algorithm} Credential=${this.secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;
  }

  /**
   * 翻译单条文本
   */
  async translate(
    text: string,
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en'
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const payload: TencentTranslateRequest = {
        SourceText: text,
        Source: sourceLang === 'zh' ? 'zh' : (sourceLang === 'en' ? 'en' : 'auto'),
        Target: targetLang === 'zh' ? 'zh' : 'en',
        ProjectId: 0,
      };

      const payloadStr = JSON.stringify(payload);
      const authorization = this.sign(payloadStr, timestamp);

      const response = await fetch(`https://${this.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json; charset=utf-8',
          'Host': this.endpoint,
          'X-TC-Action': 'TextTranslate',
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Version': this.version,
          'X-TC-Region': 'ap-beijing', // 使用北京节点
        },
        body: payloadStr,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Tencent Translate API error: ${error}`);
      }

      const data: TencentTranslateResponse = await response.json();
      const latency = Date.now() - startTime;

      console.warn(`[腾讯云翻译] 耗时: ${latency}ms`);

      return data.Response.TargetText;
    } catch (error) {
      console.error('[腾讯云翻译] 翻译失败:', error);
      throw error;
    }
  }

  /**
   * 批量翻译（串行调用，因为腾讯云不支持批量接口）
   */
  async translateBatch(
    texts: string[],
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en'
  ): Promise<string[]> {
    if (texts.length === 0) return [];

    const startTime = Date.now();
    const results: string[] = [];

    console.warn(`[腾讯云翻译] 开始批量翻译: ${texts.length} 条`);

    // 腾讯云不支持批量接口，需要串行调用
    // 但可以通过 Promise.all 并发调用提速
    const maxConcurrent = 5; // 最多5个并发
    const chunks: string[][] = [];
    
    for (let i = 0; i < texts.length; i += maxConcurrent) {
      chunks.push(texts.slice(i, i + maxConcurrent));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(text => this.translate(text, targetLang, sourceLang))
      );
      results.push(...chunkResults);
    }

    const latency = Date.now() - startTime;
    console.warn(`[腾讯云翻译] 批量翻译完成: ${texts.length} 条, 总耗时: ${latency}ms, 平均: ${Math.round(latency / texts.length)}ms/条`);

    return results;
  }
}
