import type { TranscriptLine } from '@echospeak/types';
import type { AIProvider, GenerateOptions, ModelInfo, ConnectionResult } from './base';

// 文本模型
const DEFAULT_ZHIPU_TEXT_MODEL = 'glm-4-flash';
// 视觉模型（用于视频/图片理解）
const DEFAULT_ZHIPU_VISION_MODEL = 'glm-4.6v';
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

/**
 * 智谱 GLM 提供商实现
 */
export class ZhipuProvider implements AIProvider {
  name = '智谱 GLM';
  type = 'zhipu' as const;

  constructor(private apiKey: string) {}

  /**
   * 生成发音谱标注
   */
  async generateProsody(sentence: string, options?: GenerateOptions): Promise<string> {
    try {
      const model = options?.model || DEFAULT_ZHIPU_TEXT_MODEL;

      const response = await this.callChatAPI(
        [
          {
            role: 'user',
            content: `为以下句子标注发音谱：
            - **BOLD CAPS**: 主重音
            - *Italics*: 次重音
            - [ə]: 元音弱读
            - _: 连读
            - ↘/↗: 语调
            - |/||: 短暂停/长暂停

            句子："${sentence}"

            只返回标注后的句子，不要其他内容。`,
          },
        ],
        model
      );

      return this.extractContent(response) || sentence;
    } catch (error) {
      console.error('Zhipu prosody generation failed:', error);
      throw error;
    }
  }

  /**
   * 将文本转换为双语字幕
   */
  async bilingualizeText(text: string, options?: GenerateOptions): Promise<TranscriptLine[]> {
    try {
      const model = options?.model || DEFAULT_ZHIPU_TEXT_MODEL;

      const response = await this.callChatAPI(
        [
          {
            role: 'system',
            content: '你是一个英语学习应用的脚本格式化助手。',
          },
          {
            role: 'user',
            content: `将以下文本转换为双语字幕格式。文本可能是纯英文、纯中文或混合的。

规则：
1. 纯英文：提供自然的中文翻译
2. 纯中文：翻译为高质量的英文（适合口语练习）
3. 混合：配对正确的英文和中文
4. 将文本拆分为自然片段（句子或意群）

文本：
"""
${text}
"""

输出 JSON 数组，包含字段：id, text (英文), translation (中文), startTime, endTime (从0开始，每段5秒)。`,
          },
        ],
        model,
        {
          response_format: { type: 'json_object' },
        }
      );

      const content = this.extractContent(response);
      return this.parseJSONContent(content);
    } catch (error) {
      console.error('Zhipu bilingualize failed:', error);
      throw error;
    }
  }

  /**
   * 转写媒体文件
   * 使用 GLM-4.6V 视觉模型进行视频理解
   * 支持视频和图片（base64 格式）
   */
  async transcribeMedia(
    base64Data: string,
    mimeType: string,
    options?: GenerateOptions
  ): Promise<TranscriptLine[]> {
    try {
      // 使用视觉模型（默认 GLM-4.6V）
      const model = options?.model || DEFAULT_ZHIPU_VISION_MODEL;

      // 判断媒体类型
      const isVideo = mimeType.startsWith('video/');
      const mediaType = isVideo ? 'video_url' : 'image_url';

      const response = await this.callMultimodalAPI(
        [
          {
            role: 'user',
            content: [
              {
                type: mediaType,
                [mediaType]: {
                  url: `data:${mimeType};base64,${base64Data}`,
                },
              },
              {
                type: 'text',
                text: `你是一个专业的视频/图片转写助手。任务：

1. 如果有英文字幕/文字：提取英文原文，并提供自然中文翻译
2. 如果没有字幕：根据画面内容推断可能的英文解说，并提供中文翻译
3. 识别场景切换和节奏，合理切分字幕片段
4. 为每个字幕片段设置合理的时间轴（假设视频从 0:00 开始）

输出格式：JSON 数组
[
  {
    "id": "1",
    "text": "英文字幕文本",
    "translation": "中文翻译",
    "startTime": 0.0,
    "endTime": 3.5
  }
]

只返回 JSON 数组，不要其他内容。`,
              },
            ],
          },
        ],
        model
      );

      const content = this.extractContent(response);
      return this.parseJSONContent(content);
    } catch (error) {
      console.error('Zhipu media transcription failed:', error);
      throw error;
    }
  }

  /**
   * 获取可用模型列表
   */
  async fetchModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${ZHIPU_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => ({
        id: model.id,
        name: model.id,
        description: model.description,
        contextLength: model.context_length,
      }));
    } catch (error) {
      console.error('Failed to fetch Zhipu models:', error);
      // 返回已知模型
      return this.getKnownModels();
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now();

    try {
      await this.callChatAPI(
        [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        DEFAULT_ZHIPU_TEXT_MODEL
      );

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
   * 智谱 GLM 定价（2025年12月降价后）:
   * - 文本模型 (glm-4-flash): ¥0.0001/1K tokens
   * - 视觉模型 (glm-4.6v): ¥1/百万 tokens (input), ¥3/百万 tokens (output)
   * - 视觉模型 (glm-4.6v-flash): 免费
   * 汇率假设: 1 USD ≈ 7.2 CNY
   */
  estimateCost(operation: string, tokens: number): number {
    // 根据任务类型判断使用哪个模型
    const isMultimodal = operation === 'transcribe';

    if (isMultimodal) {
      // 视觉模型定价（假设使用 glm-4.6v）
      // 输入 70%, 输出 30%
      const inputTokens = tokens * 0.7;
      const outputTokens = tokens * 0.3;

      const yuanCost =
        (inputTokens / 1_000_000) * 1 + (outputTokens / 1_000_000) * 3;
      const usdCost = yuanCost / 7.2; // 转换为美元

      return usdCost;
    } else {
      // 文本模型定价
      const yuanCost = (tokens / 1000) * 0.0001;
      const usdCost = yuanCost / 7.2; // 转换为美元

      return usdCost;
    }
  }

  /**
   * 调用智谱聊天 API（带重试）
   */
  private async callChatAPI(
    messages: Array<{ role: string; content: string }>,
    model: string = DEFAULT_ZHIPU_TEXT_MODEL,
    extraOptions: Record<string, unknown> = {}
  ): Promise<unknown> {
    return this.retryOperation(
      async () => {
        const response = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.1,
            ...extraOptions,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Zhipu API error: ${error}`);
        }

        return response.json();
      },
      'callChatAPI'
    );
  }

  /**
   * 调用智谱多模态 API（支持图片/视频，带重试）
   */
  private async callMultimodalAPI(
    messages: Array<{
      role: string;
      content: Array<
        | { type: string; text?: string; image_url?: { url: string } }
        | { type: string; video_url?: { url: string } }
      >;
    }>,
    model: string = DEFAULT_ZHIPU_VISION_MODEL,
    extraOptions: Record<string, unknown> = {}
  ): Promise<unknown> {
    return this.retryOperation(
      async () => {
        const response = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.1,
            ...extraOptions,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Zhipu multimodal API error: ${error}`);
        }

        return response.json();
      },
      'callMultimodalAPI'
    );
  }

  /**
   * 重试操作（网络错误自动重试）
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('fetch failed') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('UND_ERR_SOCKET') ||
            error.message.includes('Socket'));

        const isLastAttempt = attempt === maxRetries;

        if (isNetworkError && !isLastAttempt) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避: 1s, 2s, 4s
          console.warn(
            `[Zhipu] ${operationName} 网络错误，${delay}ms 后重试 (${attempt}/${maxRetries}):`,
            error instanceof Error ? error.message : error
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // 最后一次尝试或非网络错误，直接抛出
        throw error;
      }
    }

    throw new Error(`${operationName} 重试次数耗尽`);
  }

  /**
   * 从响应中提取内容
   */
  private extractContent(response: unknown): string {
    const data = response as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
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
      return JSON.parse(normalized);
    } catch (error) {
      console.error('Zhipu JSON parse error:', error);
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

  /**
   * 获取已知模型列表（fallback）
   */
  private getKnownModels(): ModelInfo[] {
    return [
      // 文本模型
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash',
        description: '快速轻量级模型，性价比高（文本）',
        contextLength: 128000,
      },
      {
        id: 'glm-4-flashx',
        name: 'GLM-4 FlashX',
        description: '超快速模型（文本）',
        contextLength: 128000,
      },
      {
        id: 'glm-4-air',
        name: 'GLM-4 Air',
        description: '均衡型模型（文本）',
        contextLength: 128000,
      },
      {
        id: 'glm-4-plus',
        name: 'GLM-4 Plus',
        description: '高质量模型（文本）',
        contextLength: 128000,
      },
      // 视觉模型
      {
        id: 'glm-4.6v',
        name: 'GLM-4.6V',
        description: '旗舰视觉推理模型，支持视频理解',
        contextLength: 128000,
      },
      {
        id: 'glm-4.5v',
        name: 'GLM-4.5V',
        description: '视觉推理模型，覆盖视频理解',
        contextLength: 64000,
      },
      {
        id: 'glm-4v-flash',
        name: 'GLM-4V Flash',
        description: '免费图像理解模型',
        contextLength: 16000,
      },
      {
        id: 'glm-4.6v-flash',
        name: 'GLM-4.6V Flash',
        description: '免费视觉推理模型',
        contextLength: 128000,
      },
    ];
  }
}
