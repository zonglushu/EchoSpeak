import type { TranscriptLine } from '@echospeak/types';

/**
 * AI 服务客户端配置
 */
export interface AIClientConfig {
  baseUrl?: string;
  timeout?: number;
}

/**
 * 默认配置
 */
const defaultConfig: AIClientConfig = {
  baseUrl: process.env.ADMIN_API_URL || 'http://localhost:3000',
  timeout: 120000, // 2 分钟
};

/**
 * 获取 API URL
 */
function getApiUrl(path: string, config: AIClientConfig): string {
  const baseUrl = config.baseUrl || defaultConfig.baseUrl;
  return `${baseUrl}/api/ai${path}`;
}

/**
 * 调用 AI API
 */
async function callAIAPI(
  endpoint: string,
  body: Record<string, unknown>,
  config: AIClientConfig = {}
): Promise<unknown> {
  const url = getApiUrl(endpoint, config);
  const timeout = config.timeout || defaultConfig.timeout;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 生成发音谱标注
 * @param sentence 要标注的句子
 * @param options 选项
 * @returns 标注后的文本
 */
export async function generateProsodyNotation(
  sentence: string,
  options: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    provider?: string;
    config?: AIClientConfig;
  } = {}
): Promise<string> {
  try {
    const result = (await callAIAPI(
      '/generate',
      {
        task: 'prosody',
        input: sentence,
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
      },
      options.config
    )) as {
      data: string;
      provider: string;
      latency: number;
    };

    return result.data;
  } catch (error) {
    console.error('Prosody notation generation failed:', error);
    // 返回原始句子作为降级
    return sentence;
  }
}

/**
 * 将文本转换为双语字幕
 * @param rawText 原始文本
 * @param options 选项
 * @returns 双语字幕数组
 */
export async function bilingualizeText(
  rawText: string,
  options: {
    apiKey?: string;
    model?: string;
    provider?: string;
    config?: AIClientConfig;
  } = {}
): Promise<TranscriptLine[]> {
  try {
    const result = (await callAIAPI(
      '/generate',
      {
        task: 'bilingualize',
        input: rawText,
        provider: options.provider,
        model: options.model,
      },
      options.config
    )) as {
      data: TranscriptLine[];
      provider: string;
      latency: number;
    };

    return result.data;
  } catch (error) {
    console.error('Bilingualize failed:', error);
    throw error;
  }
}

/**
 * 转写媒体文件
 * @param base64Data Base64 编码的媒体数据
 * @param mimeType MIME 类型
 * @param options 选项
 * @returns 双语字幕数组
 */
export async function transcribeMedia(
  base64Data: string,
  mimeType: string,
  options: {
    apiKey?: string;
    model?: string;
    provider?: string;
    config?: AIClientConfig;
  } = {}
): Promise<TranscriptLine[]> {
  try {
    const result = (await callAIAPI(
      '/generate',
      {
        task: 'transcribe',
        input: { data: base64Data, mimeType },
        provider: options.provider,
        model: options.model,
      },
      options.config
    )) as {
      data: TranscriptLine[];
      provider: string;
      latency: number;
    };

    return result.data;
  } catch (error) {
    console.error('Transcription failed:', error);
    throw error;
  }
}

/**
 * 获取可用模型列表
 * @param provider 提供商 key（可选）
 * @param config 配置
 * @returns 模型列表
 */
export async function fetchModels(
  provider?: string,
  config: AIClientConfig = {}
): Promise<
  Array<{
    key: string;
    name: string;
    type: string;
    models: Array<{
      id: string;
      name: string;
      description?: string;
      contextLength?: number;
    }>;
  }>
> {
  try {
    const url = provider ? `/models?provider=${provider}` : '/models';
    const result = (await callAIAPI(url.replace('/generate', '/models'), {}, config)) as any;

    return result.providers || [result];
  } catch (error) {
    console.error('Failed to fetch models:', error);
    throw error;
  }
}

/**
 * 测试提供商连接
 * @param provider 提供商 key（可选）
 * @param config 配置
 * @returns 测试结果
 */
export async function testProviderConnection(
  provider?: string,
  config: AIClientConfig = {}
): Promise<
  Array<{
    key: string;
    name: string;
    test: {
      success: boolean;
      message: string;
      latency?: number;
    };
  }>
> {
  try {
    const result = (await callAIAPI(
      '/test',
      { provider },
      config
    )) as {
      results: Array<{
        key: string;
        name: string;
        test: {
          success: boolean;
          message: string;
          latency?: number;
        };
      }>;
    };

    return result.results;
  } catch (error) {
    console.error('Failed to test provider:', error);
    throw error;
  }
}

/**
 * 使用流式传输生成
 * @param task 任务类型
 * @param input 输入
 * @param callbacks 回调函数
 * @param options 选项
 */
export async function streamGenerate(
  task: 'prosody' | 'bilingualize' | 'transcribe',
  input: unknown,
  callbacks: {
    onStart?: () => void;
    onProgress?: (progress: number) => void;
    onDone?: (result: unknown) => void;
    onError?: (error: string) => void;
  },
  options: {
    provider?: string;
    model?: string;
    temperature?: number;
    config?: AIClientConfig;
  } = {}
): Promise<void> {
  const url = getApiUrl('/generate', options.config || {});

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        task,
        input,
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case 'start':
                callbacks.onStart?.();
                break;
              case 'progress':
                callbacks.onProgress?.(event.progress);
                break;
              case 'done':
                callbacks.onDone?.(event.result);
                break;
              case 'error':
                callbacks.onError?.(event.error);
                break;
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream error:', error);
    callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
