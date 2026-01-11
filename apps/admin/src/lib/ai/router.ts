import type { AIProvider, GenerateOptions, ModelInfo } from './providers';
import { GeminiProvider } from './providers/gemini';
import { ZhipuProvider } from './providers/zhipu';
import { OpenAICompatibleProvider } from './providers/openai-compatible';
import { logAIUsage } from '../db/ai-usage';

export type { TranscriptLine } from '@echospeak/types';

/**
 * 路由配置
 */
export interface RouterConfig {
  providers: Map<string, AIProvider>;
  defaultProvider?: string;
  fallbackProvider?: string;
  enableLogging?: boolean;
}

/**
 * 任务类型
 */
export type TaskType = 'prosody' | 'bilingualize' | 'transcribe';

/**
 * 路由执行结果
 */
export interface RouterResult<T> {
  data: T;
  provider: string;
  model: string;
  latency: number;
  tokens?: number;
  cost?: number;
}

/**
 * AI 提供商路由器
 * 负责选择最优提供商、执行任务、记录用量
 */
export class AIProviderRouter {
  private providers: Map<string, AIProvider>;
  private defaultProvider: string;
  private fallbackProvider: string;
  private enableLogging: boolean;

  constructor(config?: Partial<RouterConfig>) {
    this.providers = config?.providers || this.initializeDefaultProviders();
    this.defaultProvider = config?.defaultProvider || 'zhipu';
    this.fallbackProvider = config?.fallbackProvider || 'gemini';
    this.enableLogging = config?.enableLogging !== false;
  }

  /**
   * 初始化默认提供商
   */
  private initializeDefaultProviders(): Map<string, AIProvider> {
    const providers = new Map<string, AIProvider>();

    // 从环境变量初始化 Gemini
    if (process.env.GEMINI_API_KEY) {
      providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
    }

    // 从环境变量初始化智谱
    if (process.env.ZHIPU_API_KEY) {
      providers.set('zhipu', new ZhipuProvider(process.env.ZHIPU_API_KEY));
    }

    // 从环境变量初始化 OpenAI 兼容提供商
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL) {
      providers.set(
        'openai',
        new OpenAICompatibleProvider({
          name: process.env.OPENAI_NAME || 'OpenAI',
          baseUrl: process.env.OPENAI_BASE_URL,
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL,
        })
      );
    }

    return providers;
  }

  /**
   * 执行任务
   */
  async execute<T>(
    task: TaskType,
    input: unknown,
    options?: {
      provider?: string;
      model?: string;
      [key: string]: unknown;
    }
  ): Promise<RouterResult<T>> {
    // 1. 选择提供商
    const providerKey = options?.provider || this.selectBestProvider(task);
    const provider = this.providers.get(providerKey);

    if (!provider) {
      throw new Error(`Provider "${providerKey}" not found. Available: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    // 2. 执行任务
    const startTime = Date.now();
    let result: T;
    let model = options?.model as string || this.getDefaultModel(providerKey);
    let tokens = 0;

    try {
      switch (task) {
        case 'prosody':
          result = await provider.generateProsody(input as string, options as GenerateOptions) as T;
          break;
        case 'bilingualize':
          result = await provider.bilingualizeText(input as string, options as GenerateOptions) as T;
          // 估算 token 数量 (粗略估计: 字符数 / 4)
          tokens = Math.ceil((input as string).length / 4);
          break;
        case 'transcribe':
          result = await provider.transcribeMedia(
            (input as { data: string }).data,
            (input as { mimeType: string }).mimeType,
            options as GenerateOptions
          ) as T;
          // 转写任务通常 token 较多
          tokens = 1000;
          break;
        default:
          throw new Error(`Unknown task: ${task}`);
      }

      const latency = Date.now() - startTime;
      const cost = provider.estimateCost(task, tokens);

      // 3. 记录日志
      if (this.enableLogging) {
        await logAIUsage({
          provider: provider.name,
          task,
          model,
          latency,
          tokens,
          status: 'success',
          cost,
        });
      }

      return {
        data: result,
        provider: provider.name,
        model,
        latency,
        tokens,
        cost,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      // 记录失败日志
      if (this.enableLogging) {
        await logAIUsage({
          provider: provider.name,
          task,
          model,
          latency,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // 4. 尝试降级到备用提供商
      if (!options?.provider && providerKey !== this.fallbackProvider) {
        console.warn(`${provider.name} 失败，降级到备用提供商 ${this.fallbackProvider}`);
        return this.execute<T>(task, input, { ...options, provider: this.fallbackProvider });
      }

      throw error;
    }
  }

  /**
   * 选择最优提供商
   * 默认使用智谱 GLM（性价比高、支持视频理解）
   * 如果用户明确指定了提供商，则使用用户的选择
   */
  private selectBestProvider(task: TaskType): string {
    // 检查智谱是否可用
    const hasZhipu = this.providers.has('zhipu');
    const hasGemini = this.providers.has('gemini');

    // 默认策略：优先使用智谱 GLM
    if (hasZhipu) {
      return 'zhipu';
    }

    // 降级策略：智谱不可用时使用 Gemini
    if (hasGemini) {
      return 'gemini';
    }

    // 最后降级：返回第一个可用的提供商
    const firstProvider = Array.from(this.providers.keys())[0];
    if (!firstProvider) {
      throw new Error('No AI providers available. Please configure at least one provider.');
    }

    return firstProvider;
  }

  /**
   * 获取提供商的默认模型
   */
  private getDefaultModel(providerKey: string): string {
    switch (providerKey) {
      case 'gemini':
        return 'gemini-3-flash-preview';
      case 'zhipu':
        return 'glm-4-flash';
      case 'openai':
        return process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      default:
        return 'default';
    }
  }

  /**
   * 获取所有可用提供商
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取提供商信息
   */
  async getProviderInfo(providerKey: string): Promise<{
    name: string;
    type: string;
    models: ModelInfo[];
    connectionTest: Awaited<ReturnType<AIProvider['testConnection']>>;
  } | null> {
    const provider = this.providers.get(providerKey);

    if (!provider) {
      return null;
    }

    const [models, connectionTest] = await Promise.all([
      provider.fetchModels(),
      provider.testConnection(),
    ]);

    return {
      name: provider.name,
      type: provider.type,
      models,
      connectionTest,
    };
  }

  /**
   * 获取所有提供商信息
   */
  async getAllProvidersInfo(): Promise<
    Array<{
      key: string;
      name: string;
      type: string;
      models: ModelInfo[];
      connectionTest: Awaited<ReturnType<AIProvider['testConnection']>>;
    }>
  > {
    const providersInfo = await Promise.all(
      Array.from(this.providers.entries()).map(async ([key, provider]) => {
        const [models, connectionTest] = await Promise.all([
          provider.fetchModels(),
          provider.testConnection(),
        ]);

        return {
          key,
          name: provider.name,
          type: provider.type,
          models,
          connectionTest,
        };
      })
    );

    return providersInfo;
  }

  /**
   * 添加自定义提供商
   */
  addProvider(key: string, provider: AIProvider): void {
    this.providers.set(key, provider);
  }

  /**
   * 移除提供商
   */
  removeProvider(key: string): boolean {
    return this.providers.delete(key);
  }

  /**
   * 设置默认提供商
   */
  setDefaultProvider(providerKey: string): void {
    if (!this.providers.has(providerKey)) {
      throw new Error(`Provider "${providerKey}" not found`);
    }
    this.defaultProvider = providerKey;
  }

  /**
   * 设置备用提供商
   */
  setFallbackProvider(providerKey: string): void {
    if (!this.providers.has(providerKey)) {
      throw new Error(`Provider "${providerKey}" not found`);
    }
    this.fallbackProvider = providerKey;
  }
}

// 创建单例实例
let routerInstance: AIProviderRouter | null = null;

/**
 * 获取路由器单例
 */
export function getRouter(): AIProviderRouter {
  if (!routerInstance) {
    routerInstance = new AIProviderRouter();
  }
  return routerInstance;
}

/**
 * 重置路由器实例（主要用于测试）
 */
export function resetRouter(): void {
  routerInstance = null;
}
