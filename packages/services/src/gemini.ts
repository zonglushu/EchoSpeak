import { GoogleGenAI, Type } from '@google/genai';
import type { TranscriptLine } from '@echospeak/types';

export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';

let sharedClient: GoogleGenAI | null = null;

const missingKeyError = () =>
  new Error(
    '缺少 Gemini API Key，无法调用 AI 能力。请在根目录的 .env.local 中设置 GEMINI_API_KEY，然后重新启动开发服务器。'
  );

const resolveEnvApiKey = () => {
  if (typeof process !== 'undefined' && process?.env) {
    return process.env.GEMINI_API_KEY || process.env.API_KEY;
  }

  const globalScope = globalThis as Record<string, unknown>;
  const globalKey = globalScope?.GEMINI_API_KEY;
  return typeof globalKey === 'string' ? globalKey : undefined;
};

export const getClient = (apiKey?: string): GoogleGenAI | null => {
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  if (sharedClient) {
    return sharedClient;
  }

  const envKey = resolveEnvApiKey();
  if (!envKey) {
    return null;
  }

  sharedClient = new GoogleGenAI({ apiKey: envKey });
  return sharedClient;
};

export interface GeminiClientConfig {
  apiKey?: string;
  client?: GoogleGenAI | null;
}

export const configureGeminiClient = (config: GeminiClientConfig = {}): GoogleGenAI | null => {
  if (Object.prototype.hasOwnProperty.call(config, 'client')) {
    sharedClient = config.client ?? null;
    return sharedClient;
  }

  if (config.apiKey) {
    sharedClient = new GoogleGenAI({ apiKey: config.apiKey });
    return sharedClient;
  }

  return sharedClient;
};

export interface GeminiProsodyOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface GeminiScriptOptions {
  apiKey?: string;
  model?: string;
}

const sanitizeJsonPayload = (raw?: string) => {
  if (!raw) {
    return '[]';
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  return trimmed;
};

const parseTranscriptResponse = (raw?: string): TranscriptLine[] => {
  const normalized = sanitizeJsonPayload(raw);
  try {
    return JSON.parse(normalized);
  } catch (error) {
    console.error('Gemini JSON parse error:', error);
    throw error;
  }
};

export const generateProsodyNotation = async (
  sentence: string,
  options: GeminiProsodyOptions = {}
): Promise<string> => {
  try {
    const ai = getClient(options.apiKey);
    if (!ai) {
      console.warn('Gemini API Key 未配置，返回原始句子作为占位符。');
      return sentence;
    }

    const response = await ai.models.generateContent({
      model: options.model ?? DEFAULT_GEMINI_MODEL,
      contents: `Annotate this English sentence for oral shadowing practice:
      - **BOLD CAPS**: Primary sentence stress (Nuclear stress).
      - *Italics*: Secondary stress.
      - [ə]: Vowel reduction (Schwa).
      - _: Liaison/Linking between words.
      - ↘/↗: Falling/Rising intonation.
      - |/||: Short/Long pause.
      
      Input: "${sentence}"
      Output: Return ONLY the annotated string.`,
      config: { temperature: options.temperature ?? 0.1 },
    });

    return response.text || sentence;
  } catch (error) {
    console.error('Prosody notation generation failed:', error);
    return sentence;
  }
};

export const bilingualizeText = async (
  rawText: string,
  options: GeminiScriptOptions = {}
): Promise<TranscriptLine[]> => {
  const ai = getClient(options.apiKey);
  if (!ai) {
    throw missingKeyError();
  }

  try {
    const response = await ai.models.generateContent({
      model: options.model ?? DEFAULT_GEMINI_MODEL,
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
      ${rawText}
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

    return parseTranscriptResponse(response.text);
  } catch (error) {
    console.error('Bilingualize Error:', error);
    throw error;
  }
};

export const transcribeMedia = async (
  base64Data: string,
  mimeType: string,
  options: GeminiScriptOptions = {}
): Promise<TranscriptLine[]> => {
  const ai = getClient(options.apiKey);
  if (!ai) {
    throw missingKeyError();
  }

  try {
    const response = await ai.models.generateContent({
      model: options.model ?? DEFAULT_GEMINI_MODEL,
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

    return parseTranscriptResponse(response.text);
  } catch (error) {
    console.error('Transcription Error:', error);
    throw error;
  }
};
