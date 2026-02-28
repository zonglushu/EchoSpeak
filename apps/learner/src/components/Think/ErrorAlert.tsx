/**
 * Error Alert Component - Reusable error display for Think exercises
 *
 * @module components/Think/ErrorAlert
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

export interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning';
}

export function ErrorAlert({
  message,
  onDismiss,
  type = 'error',
}: ErrorAlertProps) {
  const bgColor =
    type === 'error'
      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';

  const textColor =
    type === 'error'
      ? 'text-red-700 dark:text-red-400'
      : 'text-yellow-700 dark:text-yellow-400';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`p-4 rounded-xl border-2 ${bgColor} mb-4`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textColor}`} />
            <div className="flex-1">
              <p className={`text-sm font-bold ${textColor}`}>
                {type === 'error' ? '错误' : '提示'}
              </p>
              <p className={`text-sm text-gray-900 dark:text-white mt-1`}>
                {message}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ErrorAlert;
