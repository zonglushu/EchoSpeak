
import React from 'react';
import { NotationGuide } from './types';

export const NOTATION_GUIDE: NotationGuide[] = [
  {
    symbol: "BOLD CAPS",
    description: "Nuclear Stress (核重音). The core intent of the sentence. Highest pitch, longest duration.",
    example: "I love **PIZZA**.",
    color: "text-blue-600 font-black"
  },
  {
    symbol: "Italics",
    description: "Secondary Stress (次重音). Some rise and fall, but weaker than nuclear stress.",
    example: "*Yesterday* was great.",
    color: "italic text-gray-700"
  },
  {
    symbol: "[ə]",
    description: "Schwa/Weakening (弱读). The secret to fluency (e.g., 'to' becomes [tə], 'you' becomes [jə]).",
    example: "Go [tə] school.",
    color: "text-green-600 font-bold"
  },
  {
    symbol: "_",
    description: "Linking (连读线). Smooth connection with no break in airflow.",
    example: "Far_away",
    color: "text-orange-500 font-bold"
  },
  {
    symbol: "↘ / ↗",
    description: "Intonation (语调). The rising or falling pitch at the end of groups.",
    example: "Really? ↗",
    color: "text-red-500 font-bold"
  },
  {
    symbol: "| / ||",
    description: "Pauses (短/长停顿). Strategic breaks for rhythm or suspense.",
    example: "Wait | for it.",
    color: "text-purple-600 font-bold"
  }
];

export const INITIAL_TRANSCRIPT: any[] = [
  {
    id: 'init-prompt',
    startTime: 0,
    endTime: 0,
    text: "Welcome! Please upload a video or paste a script to start practicing.",
    translation: "欢迎！请上传视频或粘贴剧本以开始练习。",
    notation: "**WELCOME**! | Please **UPLOAD** a video | or **PASTE** a script | to **START** practicing."
  }
];
