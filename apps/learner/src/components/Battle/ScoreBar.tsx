/**
 * Score Bar Component
 *
 * Simple horizontal bar chart for displaying scores.
 * Used in feedback dashboard as an alternative to radar charts.
 *
 * @module components/Battle/ScoreBar
 */

import { motion } from 'framer-motion';

interface ScoreBarProps {
  label: string;
  score: number;
  color?: 'rose' | 'green' | 'blue' | 'amber';
}

export function ScoreBar({ label, score, color = 'rose' }: ScoreBarProps) {
  const percentage = score * 100;

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          bar: 'bg-gradient-to-r from-green-500 to-emerald-500',
          text: 'text-green-600 dark:text-green-400',
        };
      case 'blue':
        return {
          bar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          text: 'text-blue-600 dark:text-blue-400',
        };
      case 'amber':
        return {
          bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-amber-600 dark:text-amber-400',
        };
      default:
        return {
          bar: 'bg-gradient-to-r from-rose-500 to-red-500',
          text: 'text-rose-600 dark:text-rose-400',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className={`text-sm font-bold ${colors.text}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${colors.bar} rounded-full`}
        />
      </div>
    </div>
  );
}
