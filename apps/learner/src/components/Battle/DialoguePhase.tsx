/**
 * Dialogue Phase Component
 *
 * Main conversation interface where users interact with AI characters.
 * Handles recording, speech recognition, and AI response generation.
 *
 * @module components/Battle/DialoguePhase
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Send, Loader2, Keyboard } from 'lucide-react';
import type { Mission, DialogueTurn, BattleResult } from '../../types/mode';
import { MessageBubble } from './MessageBubble';
import { dialogueService } from '../../services/dialogueService';
import { AudioRecorder } from './AudioRecorder';

interface DialoguePhaseProps {
  mission: Mission;
  onComplete: (result: BattleResult) => void;
  onCancel: () => void;
}

export function DialoguePhase({ mission, onComplete, onCancel }: DialoguePhaseProps) {
  const [messages, setMessages] = useState<DialogueTurn[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState(mission.dialogueScript.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MAX_TURNS = 5; // Maximum dialogue turns for MVP

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with AI's first message
  useEffect(() => {
    const initialMessage: DialogueTurn = {
      character: 'ai',
      text: mission.dialogueScript.text,
      timestamp: Date.now(),
    };
    setMessages([initialMessage]);
  }, [mission.dialogueScript.id, mission.dialogueScript.text]);

  const handleUserResponse = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    setIsProcessing(true);
    setUserInput('');

    // Add user message
    const userMessage: DialogueTurn = {
      character: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Analyze user response
      const analysis = await dialogueService.analyzeResponse(
        userText,
        mission.dialogueScript.text
      );

      // Update user message with analysis
      userMessage.analysis = analysis;
      setMessages([...updatedMessages]);

      // Check if we should end the dialogue
      const newTurnCount = turnCount + 1;
      if (newTurnCount >= MAX_TURNS) {
        setTimeout(() => {
          const result = dialogueService.calculateBattleResult(
            [...updatedMessages],
            mission.evaluationCriteria
          );
          onComplete(result);
        }, 1500);
        return;
      }

      // Generate AI response after a delay
      setTimeout(() => {
        const nextNodeId = dialogueService.findNextNode(
          mission.dialogueScript,
          analysis
        );

        if (nextNodeId === 'end' || newTurnCount >= MAX_TURNS - 1) {
          // End dialogue
          const result = dialogueService.calculateBattleResult(
            [...updatedMessages],
            mission.evaluationCriteria
          );
          onComplete(result);
          return;
        }

        const aiResponse = dialogueService.generateAIResponse(nextNodeId, mission.dialogueScript);

        const aiMessage: DialogueTurn = {
          character: 'ai',
          text: aiResponse,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setTurnCount(newTurnCount);
        setIsProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Failed to process response:', error);

      // Fallback: simple AI response
      setTimeout(() => {
        const aiMessage: DialogueTurn = {
          character: 'ai',
          text: 'I see. Tell me more.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setTurnCount(turnCount + 1);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (userInput.trim()) {
      handleUserResponse(userInput);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    handleUserResponse(transcript);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-950 dark:to-rose-950 flex flex-col overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-rose-200 dark:border-rose-800 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
            aria-label="取消"
          >
            <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900 dark:text-white">Dialogue</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Turn {turnCount + 1}/{MAX_TURNS}
            </p>
          </div>
          <div className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 rounded-full">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 capitalize">
              {mission.category}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.character}-${index}`}
              message={message}
              showAnalysis={message.character === 'user'}
            />
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500 dark:text-gray-400">AI is typing...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-rose-200 dark:border-rose-800 p-4">
        {/* Input Mode Toggle */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setInputMode('voice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                inputMode === 'voice'
                  ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Mic className="w-4 h-4" />
              语音
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              文字
            </button>
          </div>
        </div>

        {/* Voice Input */}
        {inputMode === 'voice' && (
          <div className="flex justify-center">
            {isProcessing ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-sm">处理中...</p>
              </div>
            ) : (
              <AudioRecorder
                onTranscript={handleVoiceTranscript}
                maxLength={30000}
                language="en-US"
                className="w-full max-w-md"
              />
            )}
          </div>
        )}

        {/* Text Input */}
        {inputMode === 'text' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-900 dark:text-white"
              autoFocus
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!userInput.trim() || isProcessing}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((turnCount + 1) / MAX_TURNS) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
