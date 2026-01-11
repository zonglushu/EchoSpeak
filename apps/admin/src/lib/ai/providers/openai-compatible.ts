import type { TranscriptLine } from '@echospeak/types';
import type { AIProvider, GenerateOptions, ModelInfo, ConnectionResult } from './base';

/**
 * OpenAI 兼容提供商配置
 */
export interface OpenAICompatibleConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model?: string;
}

/**
 * OpenAI 兼容提供商实现
 * 支持任何使用 OpenAI API 格式的服务（Azure OpenAI、DeepSeek、Qwen、本地 Ollama 等）
 */
export class OpenAICompatibleProvider implements AIProvider {
  name: string;
  type = 'openai' as const;
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(config: OpenAICompatibleConfig) {
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    this.apiKey = config.apiKey;
    this.defaultModel = config.model || 'gpt-3.5-turbo';
  }

  /**
   * 生成发音谱标注
   */
  async generateProsody(sentence: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await this.callChatAPI([
        {
          role: 'user',
          content: `Annotate this English sentence for oral shadowing practice:
          - **BOLD CAPS**: Primary sentence stress (Nuclear stress).
          - *Italics*: Secondary stress.
          - [ə]: Vowel reduction (Schwa).
          - _: Liaison/Linking between words.
          - ↘/↗: Falling/Rising intonation.
          - |/||: Short/Long pause.

          Input: "${sentence}"
          Output: Return ONLY the annotated string.`,
        },
      ]);

      return this.extractContent(response) || sentence;
    } catch (error) {
      console.error(`${this.name} prosody generation failed:`, error);
      throw error;
    }
  }

  /**
   * 将文本转换为双语字幕
   */
  async bilingualizeText(text: string, options?: GenerateOptions): Promise<TranscriptLine[]> {
    try {
      const response = await this.callChatAPI(
        [
          {
            role: 'system',
            content:
              'You are a script formatter for an English learning app. Output valid JSON only.',
          },
          {
            role: 'user',
            content: `Convert the following text into bilingual subtitle format. The text may be English-only, Chinese-only, or mixed.

Rules:
1. English-only: Provide natural Chinese translations
2. Chinese-only: Translate to high-quality English (suitable for oral practice)
3. Mixed: Pair correct English with Chinese
4. Break into natural segments (sentences or thought groups)

Text:
"""
${text}
"""

Output a JSON array with fields: id, text (English), translation (Chinese), startTime, endTime (start from 0, 5-second intervals).`,
          },
        ],
        {
          response_format: { type: 'json_object' },
        }
      );

      const content = this.extractContent(response);
      return this.parseJSONContent(content);
    } catch (error) {
      console.error(`${this.name} bilingualize failed:`, error);
      throw error;
    }
  }

  /**
   * 转写媒体文件
   * 注意：此实现假设模型支持多模态输入，实际支持取决于具体的提供商
   */
  async transcribeMedia(
    base64Data: string,
    mimeType: string,
    options?: GenerateOptions
  ): Promise<TranscriptLine[]> {
    try {
      const response = await this.callChatAPI(
        [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert transcription tool. Transcribe this media and provide bilingual subtitles.

Output a JSON array with fields: id, startTime, endTime, text (English), translation (Chinese).`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        {
          response_format: { type: 'json_object' },
        }
      );

      const content = this.extractContent(response);
      return this.parseJSONContent(content);
    } catch (error) {
      console.error(`${this.name} transcription failed:`, error);
      throw new Error(
        `${this.name} may not support media transcription. Check provider documentation.`
      );
    }
  }

  /**
   * 获取可用模型列表
   */
  async fetchModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        // 某些提供商可能不支持 /models 端点
        console.warn(`${this.name} does not support model listing`);
        return [];
      }

      const data = await response.json();
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        description: model.description || '',
        contextLength: model.context_length || model.max_tokens,
      }));
    } catch (error) {
      console.error(`Failed to fetch ${this.name} models:`, error);
      return [];
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now();

    try {
      await this.callChatAPI([
        {
          role: 'user',
          content: 'Hello',
        },
      ]);

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: '连接成功',
        models: await this.fetchModels(),
        latency,
      };
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * 估算成本
   * 默认使用 GPT-3.5-turbo 定价: $0.0005/1K tokens (input), $0.0015/1K tokens (output)
   * 子类可以重写此方法以提供更准确的定价
   */
  estimateCost(operation: string, tokens: number): number {
    // 假设 70% input, 30% output
    const inputTokens = tokens * 0.7;
    const outputTokens = tokens * 0.3;

    const inputCost = (inputTokens / 1000) * 0.0005;
    const outputCost = (outputTokens / 1000) * 0.0015;

    return inputCost + outputCost;
  }

  /**
   * 调用 OpenAI 兼容的聊天 API
   */
  private async callChatAPI(
    messages: Array<
      | { role: string; content: string }
      | { role: string; content: Array<{ type: string; text?: string; image_url?: { url: string } }> }
    >,
    extraOptions: Record<string, unknown> = {}
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages,
        temperature: 0.1,
        ...extraOptions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${this.name} API error: ${error}`);
    }

    return response.json();
  }

  /**
   * 从响应中提取内容
   */
  private extractContent(response: unknown): string {
    const data = response as {
      choices?: Array<{ message?: { content?: string | unknown } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  }

  /**
   * 解析 JSON 内容
   */
  private parseJSONContent(content?: string): TranscriptLine[] {
    if (!content) {
      return [];
    }

    const normalized = this.sanitizeJsonPayload(content);
    try {
      const parsed = JSON.parse(normalized);
      // 如果返回的是 { result: [...] } 格式，提取 result
      if (parsed.result && Array.isArray(parsed.result)) {
        return parsed.result;
      }
      return parsed;
    } catch (error) {
      console.error(`${this.name} JSON parse error:`, error);
      throw error;
    }
  }

  /**
   * 清理 JSON 载荷
   */
  private sanitizeJsonPayload(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith('```')) {
      return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    }
    return trimmed;
  }
}
