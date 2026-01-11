// 旧的 Gemini 客户端（保留向后兼容）
export * from './gemini';

// 新的 AI 服务客户端（支持多提供商）
// 使用命名导出避免与 gemini.ts 冲突
export {
  generateProsodyNotation as generateProsodyNotationAI,
  bilingualizeText as bilingualizeTextAI,
  transcribeMedia as transcribeMediaAI,
  fetchModels,
  testProviderConnection,
  streamGenerate,
} from './ai-client';
export type { AIClientConfig } from './ai-client';

// 翻译服务客户端
export * from './google-translate';
export * from './tencent-translate';
export * from './baidu-translate';

export * from './youtube';
export * from './quota';
export * from './contentLibrary';
export * from './processingQueue';
export * from './costTracking';
export * from './basicAnnotator';
export * from './aiModeration';
export * from './cacheManager';
export * from './p0Features';
