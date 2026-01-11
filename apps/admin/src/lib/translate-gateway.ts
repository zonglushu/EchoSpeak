/**
 * 翻译网关 - 统一管理所有翻译服务
 * 
 * 支持的翻译服务：
 * - 国内：腾讯云 TMT、百度翻译、阿里云翻译、火山翻译
 * - 国际：Google Translate、DeepL
 * - AI：智谱 GLM、Google Gemini
 * 
 * 配置文件：.env.local
 */

import { GoogleTranslateClient, DeepLClient } from '@echospeak/services/google-translate';
import { TencentTranslateClient } from '@echospeak/services/tencent-translate';
import { BaiduTranslateClient, BaiduLLMTranslateClient } from '@echospeak/services/baidu-translate';

/**
 * 翻译提供商类型
 */
export type TranslateProvider = 
  | 'tencent'       // 腾讯云 TMT（推荐：速度最快）
  | 'baidu'         // 百度翻译（推荐：质量好）
  | 'baidu-llm'     // 百度大模型翻译（质量最高）
  | 'google'        // Google Translate
  | 'deepl'         // DeepL（质量顶级）
  | 'ai-zhipu'      // 智谱 GLM（AI理解上下文）
  | 'ai-gemini';    // Google Gemini（AI）

/**
 * 翻译策略
 */
export type TranslateStrategy = 
  | 'speed'     // 速度优先：腾讯云 > 百度 > Google
  | 'quality'   // 质量优先：百度大模型 > DeepL > 有道
  | 'cost'      // 成本优先：免费额度 > 最便宜
  | 'balanced'; // 平衡：速度、质量、成本综合考虑

/**
 * 翻译选项
 */
export interface TranslateOptions {
  provider?: TranslateProvider;
  strategy?: TranslateStrategy;
  customPrompt?: string; // 仅用于 AI 翻译
  enableFallback?: boolean; // 失败时是否自动切换
  enableCache?: boolean; // 是否启用缓存
}

/**
 * 翻译提供商接口（统一所有翻译服务的调用方式）
 */
export interface ITranslateProvider {
  translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang?: string
  ): Promise<string[]>;
  
  // 可选：单条翻译（用于百度大模型等不支持批量的服务）
  translate?(
    text: string,
    targetLang: string,
    sourceLang?: string,
    customPrompt?: string
  ): Promise<string>;
}

/**
 * 翻译结果
 */
export interface TranslateResult {
  translations: string[];
  provider: string;
  latency: number;
  cached?: boolean;
  cost?: number;
}

/**
 * 翻译网关配置
 */
export interface TranslateGatewayConfig {
  // 腾讯云
  tencentSecretId?: string;
  tencentSecretKey?: string;

  // 百度翻译
  baiduAppId?: string;
  baiduAppKey?: string;

  // Google Translate
  googleTranslateApiKey?: string;

  // DeepL
  deeplApiKey?: string;
  deeplUseFree?: boolean;

  // 默认提供商
  defaultProvider?: TranslateProvider;
  defaultStrategy?: TranslateStrategy;

  // 是否启用日志
  enableLogging?: boolean;
}

/**
 * 翻译网关 - 统一管理所有翻译服务
 */
export class TranslateGateway {
  private config: TranslateGatewayConfig;
  private cache: Map<string, string>;
  private providers: Map<TranslateProvider, ITranslateProvider>;

  constructor(config?: TranslateGatewayConfig) {
    this.config = this.initializeConfig(config);
    this.cache = new Map();
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * 初始化配置（从环境变量读取）
   */
  private initializeConfig(config?: TranslateGatewayConfig): TranslateGatewayConfig {
    return {
      // 腾讯云
      tencentSecretId: config?.tencentSecretId || process.env.TENCENT_SECRET_ID,
      tencentSecretKey: config?.tencentSecretKey || process.env.TENCENT_SECRET_KEY,

      // 百度翻译
      baiduAppId: config?.baiduAppId || process.env.BAIDU_TRANSLATE_APP_ID,
      baiduAppKey: config?.baiduAppKey || process.env.BAIDU_TRANSLATE_APP_KEY,

      // Google Translate
      googleTranslateApiKey: config?.googleTranslateApiKey || process.env.GOOGLE_TRANSLATE_API_KEY,

      // DeepL
      deeplApiKey: config?.deeplApiKey || process.env.DEEPL_API_KEY,
      deeplUseFree: config?.deeplUseFree ?? true,

      // 默认配置
      defaultProvider: config?.defaultProvider || 'tencent',
      defaultStrategy: config?.defaultStrategy || 'balanced',
      enableLogging: config?.enableLogging !== false,
    };
  }

  /**
   * 初始化翻译提供商
   */
  private initializeProviders(): void {
    // 腾讯云
    if (this.config.tencentSecretId && this.config.tencentSecretKey) {
      this.providers.set('tencent', new TencentTranslateClient(
        this.config.tencentSecretId,
        this.config.tencentSecretKey
      ));
    }

    // 百度翻译
    if (this.config.baiduAppId && this.config.baiduAppKey) {
      this.providers.set('baidu', new BaiduTranslateClient(
        this.config.baiduAppId,
        this.config.baiduAppKey
      ));
      this.providers.set('baidu-llm', new BaiduLLMTranslateClient(
        this.config.baiduAppId,
        this.config.baiduAppKey
      ));
    }

    // Google Translate
    if (this.config.googleTranslateApiKey) {
      this.providers.set('google', new GoogleTranslateClient(
        this.config.googleTranslateApiKey
      ));
    }

    // DeepL
    if (this.config.deeplApiKey) {
      this.providers.set('deepl', new DeepLClient(
        this.config.deeplApiKey,
        this.config.deeplUseFree
      ));
    }
  }

  /**
   * 根据策略选择最佳提供商
   */
  private selectProvider(strategy: TranslateStrategy): TranslateProvider {
    const available = Array.from(this.providers.keys());

    if (available.length === 0) {
      throw new Error('没有可用的翻译服务！请配置至少一个翻译 API。');
    }

    switch (strategy) {
      case 'speed':
        // 速度优先：腾讯云 > 百度 > Google > DeepL
        for (const provider of ['tencent', 'baidu', 'google', 'deepl'] as TranslateProvider[]) {
          if (available.includes(provider)) return provider;
        }
        break;

      case 'quality':
        // 质量优先：百度大模型 > DeepL > 百度 > 腾讯云
        for (const provider of ['baidu-llm', 'deepl', 'baidu', 'tencent'] as TranslateProvider[]) {
          if (available.includes(provider)) return provider;
        }
        break;

      case 'cost':
        // 成本优先：使用免费额度最大的
        // 腾讯云（500万/月免费） > DeepL（50万/月免费） > 百度（5万/月免费）
        for (const provider of ['tencent', 'deepl', 'baidu'] as TranslateProvider[]) {
          if (available.includes(provider)) return provider;
        }
        break;

      case 'balanced':
      default:
        // 平衡模式：腾讯云（速度+免费额度） > 百度（质量+成本） > Google
        for (const provider of ['tencent', 'baidu', 'google', 'deepl'] as TranslateProvider[]) {
          if (available.includes(provider)) return provider;
        }
        break;
    }

    // 兜底：返回第一个可用的
    return available[0];
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(text: string, targetLang: string, sourceLang?: string): string {
    return `${sourceLang || 'auto'}:${targetLang}:${text}`;
  }

  /**
   * 翻译单条文本
   */
  async translate(
    text: string,
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en',
    options?: TranslateOptions
  ): Promise<string> {
    const results = await this.translateBatch([text], targetLang, sourceLang, options);
    return results.translations[0];
  }

  /**
   * 批量翻译文本（支持大批量并发处理）
   * 
   * @param texts 待翻译文本数组
   * @param targetLang 目标语言
   * @param sourceLang 源语言
   * @param options 翻译选项
   * @param maxConcurrent 最大并发数（默认 5）
   * @param batchSize 每批大小（默认 50）
   */
  async translateBatchWithConcurrency(
    texts: string[],
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en',
    options?: TranslateOptions,
    maxConcurrent = 5,
    batchSize = 50
  ): Promise<TranslateResult> {
    if (texts.length === 0) {
      return { translations: [], provider: 'none', latency: 0 };
    }

    const startTime = Date.now();

    // 选择提供商
    const strategy = options?.strategy || this.config.defaultStrategy || 'balanced';
    const provider = options?.provider || this.selectProvider(strategy);

    console.warn(
      `[翻译网关] 并发翻译: 共 ${texts.length} 条, ` +
      `批次大小: ${batchSize}, ` +
      `并发数: ${maxConcurrent}, ` +
      `提供商: ${provider}`
    );

    // 分批
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    // 并发翻译（控制并发数）
    const results: string[] = [];
    for (let i = 0; i < batches.length; i += maxConcurrent) {
      const currentBatches = batches.slice(i, i + maxConcurrent);
      
      const batchPromises = currentBatches.map(async (batch, idx) => {
        const batchIndex = i + idx;
        const batchStartTime = Date.now();
        
        console.warn(
          `[翻译网关] 批次 ${batchIndex + 1}/${batches.length} 开始, ` +
          `数量: ${batch.length}`
        );

        const result = await this.translateBatch(
          batch,
          targetLang,
          sourceLang,
          { ...options, provider }
        );

        const batchLatency = Date.now() - batchStartTime;
        console.warn(
          `[翻译网关] 批次 ${batchIndex + 1}/${batches.length} 完成, ` +
          `耗时: ${batchLatency}ms`
        );

        return result.translations;
      });

      // 等待当前这组并发请求完成
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(translations => results.push(...translations));
    }

    const totalLatency = Date.now() - startTime;
    const avgPerText = Math.round(totalLatency / texts.length);

    console.warn(
      `[翻译网关] 并发翻译完成! ` +
      `总耗时: ${totalLatency}ms, ` +
      `平均: ${avgPerText}ms/条, ` +
      `提速: ${Math.round((texts.length * 500) / totalLatency * 10) / 10}x`
    );

    return {
      translations: results,
      provider,
      latency: totalLatency,
    };
  }

  /**
   * 批量翻译文本
   */
  async translateBatch(
    texts: string[],
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en',
    options?: TranslateOptions
  ): Promise<TranslateResult> {
    if (texts.length === 0) {
      return { translations: [], provider: 'none', latency: 0 };
    }

    const startTime = Date.now();
    const enableCache = options?.enableCache !== false;
    const enableFallback = options?.enableFallback !== false;

    // 1. 检查缓存
    const cachedResults: string[] = [];
    const textsToTranslate: string[] = [];
    const textIndices: number[] = [];

    if (enableCache) {
      texts.forEach((text, index) => {
        const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
          cachedResults[index] = cached;
        } else {
          textsToTranslate.push(text);
          textIndices.push(index);
        }
      });

      if (textsToTranslate.length === 0) {
        console.warn('[翻译网关] 全部命中缓存');
        return {
          translations: cachedResults,
          provider: 'cache',
          latency: Date.now() - startTime,
          cached: true,
        };
      }
    } else {
      textsToTranslate.push(...texts);
      textIndices.push(...texts.map((_, i) => i));
    }

    // 2. 选择翻译提供商
    const strategy = options?.strategy || this.config.defaultStrategy || 'balanced';
    const provider = options?.provider || this.selectProvider(strategy);

    console.warn(`[翻译网关] 选择提供商: ${provider}, 策略: ${strategy}, 待翻译: ${textsToTranslate.length}/${texts.length}`);

    // 3. 执行翻译
    try {
      const translations = await this.executeTranslation(
        provider,
        textsToTranslate,
        targetLang,
        sourceLang,
        options
      );

      // 4. 填充结果并更新缓存
      const results = [...cachedResults];
      translations.forEach((translation, idx) => {
        const originalIndex = textIndices[idx];
        results[originalIndex] = translation;

        // 更新缓存
        if (enableCache) {
          const cacheKey = this.getCacheKey(textsToTranslate[idx], targetLang, sourceLang);
          this.cache.set(cacheKey, translation);
        }
      });

      const latency = Date.now() - startTime;

      // 5. 记录日志
      if (this.config.enableLogging) {
        await this.logUsage(provider, texts.length, latency, 'success');
      }

      return {
        translations: results,
        provider,
        latency,
        cached: cachedResults.length > 0,
      };

    } catch (error) {
      console.error(`[翻译网关] ${provider} 翻译失败:`, error);

      // 6. 失败时尝试降级
      if (enableFallback) {
        return await this.translateWithFallback(
          textsToTranslate,
          textIndices,
          cachedResults,
          targetLang,
          sourceLang,
          provider,
          options
        );
      }

      throw error;
    }
  }

  /**
   * 执行翻译（调用具体的翻译服务）
   */
  private async executeTranslation(
    provider: TranslateProvider,
    texts: string[],
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en',
    options?: TranslateOptions
  ): Promise<string[]> {
    const client = this.providers.get(provider);

    if (!client) {
      throw new Error(`翻译提供商 ${provider} 未配置或不可用`);
    }

    // AI 翻译（需要特殊处理）
    if (provider.startsWith('ai-')) {
      // TODO: 集成 AI 路由器
      throw new Error('AI 翻译暂未实现，请使用传统翻译服务');
    }

    // 传统翻译服务
    // 适配不同服务商的 API 格式
    switch (provider) {
      case 'tencent':
      case 'baidu':
      case 'google':
        return await client.translateBatch(texts, targetLang, sourceLang);

      case 'deepl':
        // DeepL 使用不同的语言代码
        const deeplTarget = targetLang === 'zh' ? 'ZH' : 'EN';
        const deeplSource = sourceLang === 'zh' ? 'ZH' : (sourceLang === 'en' ? 'EN' : undefined);
        return await client.translateBatch(texts, deeplTarget, deeplSource);

      case 'baidu-llm':
        // 百度大模型需要逐条翻译（不支持批量）
        if (!client.translate) {
          throw new Error('百度大模型不支持批量翻译');
        }
        const results: string[] = [];
        for (const text of texts) {
          const result = await client.translate(
            text,
            targetLang,
            sourceLang,
            options?.customPrompt
          );
          results.push(result);
        }
        return results;

      default:
        throw new Error(`未知的翻译提供商: ${provider}`);
    }
  }

  /**
   * 降级翻译（失败时自动切换到备用服务）
   */
  private async translateWithFallback(
    textsToTranslate: string[],
    textIndices: number[],
    cachedResults: string[],
    targetLang: 'zh' | 'en',
    sourceLang?: 'zh' | 'en',
    failedProvider?: TranslateProvider,
    options?: TranslateOptions
  ): Promise<TranslateResult> {
    console.warn('[翻译网关] 开始降级翻译...');

    // 降级顺序：速度优先
    const fallbackOrder: TranslateProvider[] = [
      'tencent',
      'baidu',
      'google',
      'deepl',
      'baidu-llm',
    ];

    // 移除已失败的提供商
    const availableFallbacks = fallbackOrder.filter(
      p => p !== failedProvider && this.providers.has(p)
    );

    if (availableFallbacks.length === 0) {
      throw new Error('所有翻译服务均不可用');
    }

    // 尝试每个备用服务
    for (const fallbackProvider of availableFallbacks) {
      try {
        console.warn(`[翻译网关] 尝试降级到: ${fallbackProvider}`);
        
        const translations = await this.executeTranslation(
          fallbackProvider,
          textsToTranslate,
          targetLang,
          sourceLang,
          options
        );

        // 填充结果
        const results = [...cachedResults];
        translations.forEach((translation, idx) => {
          const originalIndex = textIndices[idx];
          results[originalIndex] = translation;
        });

        console.warn(`[翻译网关] 降级成功: ${fallbackProvider}`);

        return {
          translations: results,
          provider: fallbackProvider,
          latency: 0, // 降级翻译不统计延迟
        };

      } catch (error) {
        console.error(`[翻译网关] ${fallbackProvider} 也失败了:`, error);
        continue;
      }
    }

    throw new Error('所有翻译服务（包括降级）均失败');
  }

  /**
   * 记录使用日志
   */
  private async logUsage(
    provider: string,
    textCount: number,
    latency: number,
    status: 'success' | 'error'
  ): Promise<void> {
    try {
      // TODO: 集成日志记录
      // await logAIUsage({
      //   provider: `translate-${provider}`,
      //   task: 'translate',
      //   model: provider,
      //   latency,
      //   tokens: textCount * 50, // 估算 token 数
      //   status,
      //   cost: this.estimateCost(provider, textCount),
      // });
      console.warn(
        `[翻译网关] 日志记录: provider=${provider}, ` +
        `count=${textCount}, latency=${latency}ms, status=${status}`
      );
    } catch (error) {
      console.error('[翻译网关] 日志记录失败:', error);
    }
  }

  /**
   * 估算成本
   */
  private estimateCost(provider: string, textCount: number): number {
    const avgCharsPerText = 50;
    const totalChars = textCount * avgCharsPerText;

    // 成本（美元/百万字符）
    const costs: Record<string, number> = {
      'tencent': 0.008,  // ¥58/百万 ≈ $0.008/百万
      'baidu': 0.007,    // ¥49/百万 ≈ $0.007/百万
      'baidu-llm': 0.01, // 大模型更贵
      'google': 0.02,    // $20/百万
      'deepl': 0.02,     // €20/百万 ≈ $0.02/百万
    };

    const costPerMillion = costs[provider] || 0.01;
    return (totalChars / 1_000_000) * costPerMillion;
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.warn('[翻译网关] 缓存已清空');
  }

  /**
   * 获取可用的翻译提供商列表
   */
  getAvailableProviders(): TranslateProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 测试翻译服务是否可用
   */
  async testProvider(provider: TranslateProvider): Promise<boolean> {
    try {
      const result = await this.translate('Hello', 'zh', 'en', { provider });
      console.warn(`[翻译网关] ${provider} 测试成功: ${result}`);
      return true;
    } catch (error) {
      console.error(`[翻译网关] ${provider} 测试失败:`, error);
      return false;
    }
  }
}

/**
 * 获取全局翻译网关实例（单例）
 */
let globalGateway: TranslateGateway | null = null;

export function getTranslateGateway(config?: TranslateGatewayConfig): TranslateGateway {
  if (!globalGateway) {
    globalGateway = new TranslateGateway(config);
  }
  return globalGateway;
}
