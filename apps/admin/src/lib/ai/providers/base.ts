import type { TranscriptLine } from '@echospeak/types';

/**
 * 生成选项
 */
export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * 模型信息
 */
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
}

/**
 * 连接测试结果
 */
export interface ConnectionResult {
  success: boolean;
  message: string;
  models?: ModelInfo[];
  latency?: number;
}

/**
 * 用量日志
 */
export interface UsageLog {
  provider: string;
  task: 'prosody' | 'bilingualize' | 'transcribe';
  model: string;
  latency: number;
  tokens?: number;
  status: 'success' | 'error';
  error?: string;
  cost?: number;
  timestamp?: string;
}

/**
 * AI 提供商基础接口
 * 所有 AI 提供商（Gemini、智谱、OpenAI 兼容）都必须实现此接口
 */
export interface AIProvider {
  /** 提供商名称 */
  name: string;

  /** 提供商类型 */
  type: 'gemini' | 'zhipu' | 'openai';

  /**
   * 生成发音谱标注
   * @param sentence 要标注的句子
   * @param options 生成选项
   * @returns 标注后的文本
   */
  generateProsody(sentence: string, options?: GenerateOptions): Promise<string>;

  /**
   * 将文本转换为双语字幕
   * @param text 原始文本
   * @param options 生成选项
   * @returns 双语字幕数组
   */
  bilingualizeText(text: string, options?: GenerateOptions): Promise<TranscriptLine[]>;

  /**
   * 转写媒体文件
   * @param base64Data Base64 编码的媒体数据
   * @param mimeType MIME 类型
   * @param options 生成选项
   * @returns 双语字幕数组
   */
  transcribeMedia(base64Data: string, mimeType: string, options?: GenerateOptions): Promise<TranscriptLine[]>;

  /**
   * 获取可用模型列表
   * @returns 模型信息数组
   */
  fetchModels(): Promise<ModelInfo[]>;

  /**
   * 测试连接
   * @returns 连接测试结果
   */
  testConnection(): Promise<ConnectionResult>;

  /**
   * 估算成本
   * @param operation 操作类型
   * @param tokens Token 数量
   * @returns 估算成本（美元）
   */
  estimateCost(operation: string, tokens: number): number;
}
