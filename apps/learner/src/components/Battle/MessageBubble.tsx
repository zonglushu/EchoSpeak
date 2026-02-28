/**
 * Message Bubble Component
 *
 * Displays individual dialogue messages with analysis feedback.
 * Handles both AI and user messages with appropriate styling.
 *
 * @module components/Battle/MessageBubble
 */

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { DialogueTurn, ResponseAnalysis } from '../../types/mode';

interface MessageBubbleProps {
  message: DialogueTurn;
  showAnalysis?: boolean;
}

export function MessageBubble({ message, showAnalysis = false }: MessageBubbleProps) {
  const isAI = message.character === 'ai';
  const analysis = message.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`max-w-[85%] ${isAI ? 'order-2' : 'order-1'}`}>
        {/* Character Label */}
        <div className={`flex items-center gap-2 mb-1 ${isAI ? 'justify-start' : 'justify-end'}`}>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {isAI ? '👔 AI Character' : '👤 You'}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-3 shadow-md
            ${isAI
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
              : 'bg-gradient-to-br from-rose-500 to-red-500 text-white rounded-tr-none'
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        </div>

        {/* Analysis for User Messages */}
        {!isAI && showAnalysis && analysis && (
          <MessageAnalysis analysis={analysis} />
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-gray-400 dark:text-gray-500 mt-1 ${isAI ? 'text-left' : 'text-right'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

interface MessageAnalysisProps {
  analysis: ResponseAnalysis;
}

function MessageAnalysis({ analysis }: MessageAnalysisProps) {
  // Calculate overall score
  const overallScore = (
    analysis.pronunciationScore * 0.4 +
    analysis.grammarScore * 0.3 +
    analysis.pragmaticScore * 0.2 +
    analysis.contentRelevance * 0.1
  );

  const isGood = overallScore >= 0.7;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className="mt-2 space-y-2"
    >
      {/* Score Indicator */}
      <div className={`flex items-center gap-2 text-xs ${isGood ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {isGood ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
        <span className="font-medium">
          {(overallScore * 100).toFixed(0)}% - {isGood ? 'Good!' : 'Keep practicing'}
        </span>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-1 text-[10px]">
        <ScoreBadge label="Pro" score={analysis.pronunciationScore} />
        <ScoreBadge label="Gram" score={analysis.grammarScore} />
        <ScoreBadge label="Prag" score={analysis.pragmaticScore} />
        <ScoreBadge label="Cont" score={analysis.contentRelevance} />
      </div>

      {/* Feedback */}
      {analysis.feedback && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
          <p className="text-[10px] text-blue-700 dark:text-blue-300">
            💡 {analysis.feedback}
          </p>
        </div>
      )}

      {/* Suggested Reply */}
      {analysis.suggestedReply && analysis.suggestedReply !== analysis.pronunciationScore.toString() && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">💬 Better alternative:</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 italic">
            "{analysis.suggestedReply}"
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface ScoreBadgeProps {
  label: string;
  score: number;
}

function ScoreBadge({ label, score }: ScoreBadgeProps) {
  const getColor = () => {
    if (score >= 0.8) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (score >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  return (
    <div className={`text-center py-1 rounded ${getColor()}`}>
      <div className="font-bold">{(score * 100).toFixed(0)}%</div>
      <div className="opacity-70">{label}</div>
    </div>
  );
}
