
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptLine } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * 为句子生成发音打谱符号
 */
export const generateProsodyNotation = async (sentence: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Annotate this English sentence for oral shadowing practice:
      - **BOLD CAPS**: Primary sentence stress (Nuclear stress).
      - *Italics*: Secondary stress.
      - [ə]: Vowel reduction (Schwa).
      - _: Liaison/Linking between words.
      - ↘/↗: Falling/Rising intonation.
      - |/||: Short/Long pause.
      
      Input: "${sentence}"
      Output: Return ONLY the annotated string.`,
      config: { temperature: 0.1 },
    });
    return response.text || sentence;
  } catch (error) {
    return sentence;
  }
};

/**
 * 将用户粘贴的原始文本转化为结构化的双语剧本
 */
export const bilingualizeText = async (rawText: string): Promise<TranscriptLine[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
        responseMimeType: "application/json",
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
            required: ["id", "text", "translation", "startTime", "endTime"],
          },
        },
      },
    });
    
    const text = response.text || "[]";
    const jsonStr = text.startsWith('```json') ? text.replace(/```json|```/g, '').trim() : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Bilingualize Error:", error);
    throw error;
  }
};

/**
 * 视频视觉转录（带 OCR 和音频识别）
 */
export const transcribeMedia = async (base64Data: string, mimeType: string): Promise<TranscriptLine[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { 
            text: `You are an expert transcription tool. The video may have subtitles in various formats:
            1. **Bilingual (EN/CN)**: Extract both exactly as they appear.
            2. **English Only**: Extract English and provide a natural Chinese translation.
            3. **Chinese Only**: Extract Chinese, listen to the audio to transcribe the English original, and match them.
            4. **No Subtitles**: Listen to audio to transcribe English and translate to Chinese.
            
            GOAL: Produce a high-quality shadowing script.
            OUTPUT: A JSON array of objects: [{ "id", "startTime", "endTime", "text" (English), "translation" (Chinese) }].
            Set precise timecodes based on the audio/visual segments.` 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
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
            required: ["id", "startTime", "endTime", "text", "translation"],
          },
        },
      },
    });
    
    const text = response.text || "[]";
    const jsonStr = text.startsWith('```json') ? text.replace(/```json|```/g, '').trim() : text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};
