import { GoogleGenAI, Type } from '@google/genai';
import type { TranscriptLine } from '@echospeak/types';
import type { AIProvider, GenerateOptions, ModelInfo, ConnectionResult } from './base';

const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';

/**
 * Gemini 提供商实现
 */
export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  type = 'gemini' as const;

  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * 生成发音谱标注
   */
  async generateProsody(sentence: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: options?.model ?? DEFAULT_GEMINI_MODEL,
        contents: `Annotate this English sentence for oral shadowing practice:
        - **BOLD CAPS**: Primary sentence stress (Nuclear stress).
        - *Italics*: Secondary stress.
        - [ə]: Vowel reduction (Schwa).
        - _: Liaison/Linking between words.
        - ↘/↗: Falling/Rising intonation.
        - |/||: Short/Long pause.

        Input: "${sentence}"
        Output: Return ONLY the annotated string.`,
        config: { temperature: options?.temperature ?? 0.1 },
      });

      return response.text || sentence;
    } catch (error) {
      console.error('Gemini prosody generation failed:', error);
      throw error;
    }
  }

  /**
   * 将文本转换为双语字幕
   */
  async bilingualizeText(text: string, options?: GenerateOptions): Promise<TranscriptLine[]> {
    try {
      const response = await this.client.models.generateContent({
        model: options?.model ?? DEFAULT_GEMINI_MODEL,
        contents: `You are a script formatter for an English learning app.
        The user will provide text that could be English-only, Chinese-only, or a mix of both.

        Your task:
        1. Identify the language(s).
        2. If English-only: Provide natural Chinese translations for each sentence.
        3. If Chinese-only: Translate to high-quality, natural English (suitable for oral practice).
        4. If Mixed: Pair the correct English sentence with its Chinese translation.
        5. Break the text into natural segments (sentences or thought groups).

        Input Text:
        """
        ${text}
        """

        Output: A JSON array of objects with fields: id, text (English), translation (Chinese).
        Assign dummy startTime/endTime (e.g., 5-second intervals starting from 0) if not provided.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                translation: { type: Type.STRING },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
              },
              required: ['id', 'text', 'translation', 'startTime', 'endTime'],
            },
          },
        },
      });

      return this.parseTranscriptResponse(response.text);
    } catch (error) {
      console.error('Gemini bilingualize failed:', error);
      throw error;
    }
  }

  /**
   * 转写媒体文件
   */
  async transcribeMedia(
    base64Data: string,
    mimeType: string,
    options?: GenerateOptions
  ): Promise<TranscriptLine[]> {
    try {
      const response = await this.client.models.generateContent({
        model: options?.model ?? DEFAULT_GEMINI_MODEL,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            {
              text: `You are an expert transcription tool. The video may have subtitles in various formats:
              1. **Bilingual (EN/CN)**: Extract both exactly as they appear.
              2. **English Only**: Extract English and provide a natural Chinese translation.
              3. **Chinese Only**: Extract Chinese, listen to the audio to transcribe the English original, and match them.
              4. **No Subtitles**: Listen to audio to transcribe English and translate to Chinese.

              GOAL: Produce a high-quality shadowing script.
              OUTPUT: A JSON array of objects: [{ "id", "startTime", "endTime", "text" (English), "translation" (Chinese) }].
              Set precise timecodes based on the audio/visual segments.`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
                text: { type: Type.STRING },
                translation: { type: Type.STRING },
              },
              required: ['id', 'startTime', 'endTime', 'text', 'translation'],
            },
          },
        },
      });

      return this.parseTranscriptResponse(response.text);
    } catch (error) {
      console.error('Gemini transcription failed:', error);
      throw error;
    }
  }

  /**
   * 获取可用模型列表
   */
  async fetchModels(): Promise<ModelInfo[]> {
    // Gemini API 不提供公开的模型列表端点，返回已知模型
    return [
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash (Preview)',
        description: '快速轻量级模型，适合简单任务',
        contextLength: 1000000,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: '新一代快速模型',
        contextLength: 1000000,
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: '新一代专业模型，质量更高',
        contextLength: 1000000,
      },
    ];
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now();

    try {
      // 发送一个简单的测试请求
      const response = await this.client.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        contents: 'Hello',
      });

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
   * Gemini 定价: Flash $0.000075/1K tokens (input), $0.0003/1K tokens (output)
   */
  estimateCost(operation: string, tokens: number): number {
    // 假设 70% input, 30% output
    const inputTokens = tokens * 0.7;
    const outputTokens = tokens * 0.3;

    const inputCost = (inputTokens / 1000) * 0.000075;
    const outputCost = (outputTokens / 1000) * 0.0003;

    return inputCost + outputCost;
  }

  /**
   * 解析转录响应
   */
  private parseTranscriptResponse(raw?: string): TranscriptLine[] {
    if (!raw) {
      return [];
    }

    const normalized = this.sanitizeJsonPayload(raw);
    try {
      return JSON.parse(normalized);
    } catch (error) {
      console.error('Gemini JSON parse error:', error);
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
