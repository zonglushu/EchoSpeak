/**
 * Loading State Component - Reusable loading indicator for Think exercises
 *
 * @module components/Think/LoadingState
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingState({
  message = '加载中...',
  size = 'medium',
}: LoadingStateProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2
          className={`${sizeClasses[size]} text-indigo-600 dark:text-indigo-400 animate-spin mb-4`}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${textSizeClasses[size]} text-gray-900 dark:text-white font-black`}
      >
        {message}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-gray-500 dark:text-gray-400 mt-2"
      >
        请稍候...
      </motion.p>
    </div>
  );
}

export default LoadingState;
