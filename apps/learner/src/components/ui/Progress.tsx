/**
 * Progress - 进度指示器组件
 *
 * 用于显示各种进度状态：
 * - 线性进度条
 * - 环形进度条
 * - 步骤指示器
 * - 分数显示
 *
 * 特性：
 * - 动画过渡效果
 * - 多种样式和尺寸
 * - 模式色彩适配
 * - 无障碍支持
 *
 * @module components/ui/Progress
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

/**
 * ProgressBar - 线性进度条
 */
export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorClasses = {
  default: 'from-gray-400 to-gray-500',
  success: 'from-green-500 to-emerald-500',
  warning: 'from-yellow-500 to-orange-500',
  error: 'from-red-500 to-pink-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'default',
  showLabel = false,
  label,
  className = '',
  animated = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={className}>
      {/* Label */}
      {(label || showLabel) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
};

/**
 * CircularProgress - 环形进度条
 */
export interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
  color?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 80,
  strokeWidth = 8,
  color = 'default',
  showLabel = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    default: '#10b981', // emerald-500
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  const strokeColor = colorMap[color];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>

      {/* Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * StepIndicator - 步骤指示器
 */
export interface Step {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

export interface StepIndicatorProps {
  steps: Step[];
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, className = '' }) => {
  const currentStepIndex = steps.findIndex((s) => s.status === 'active');

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed';
        const isActive = step.status === 'active';
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  border-2 transition-colors
                  ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </motion.div>

              {/* Step Label */}
              <span
                className={`
                  mt-2 text-xs font-medium whitespace-nowrap
                  ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {!isLast && (
              <div className="flex-1 mx-2 h-0.5 bg-gray-200 dark:bg-gray-700 relative">
                {index < currentStepIndex && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-green-500 absolute top-0 left-0"
                  />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * ScoreDisplay - 分数显示（带颜色编码）
 */
export interface ScoreDisplayProps {
  score: number; // 0-5 or 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  max = 5,
  size = 'md',
  showLabel = false,
  label,
  className = '',
}) => {
  const percentage = (score / max) * 100;

  const getColor = () => {
    if (percentage >= 80) return 'from-green-500 to-emerald-500';
    if (percentage >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Score Circle */}
      <div
        className={`
          ${sizeClasses[size]} rounded-full flex items-center justify-center
          bg-gradient-to-br ${getColor()} text-white font-black shadow-xl
        `}
      >
        {score}
      </div>

      {/* Label */}
      {(label || showLabel) && (
        <>
          {label && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {label}
            </span>
          )}
          {showLabel && !label && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              / {max}
            </span>
          )}
        </>
      )}
    </div>
  );
};

/**
 * ProgressSegment - 分段进度（如 3/5 显示为3个格子）
 */
export interface ProgressSegmentProps {
  value: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ProgressSegment: React.FC<ProgressSegmentProps> = ({
  value,
  total,
  size = 'md',
  color = 'default',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorMap = {
    default: 'bg-indigo-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const bgColorMap = {
    default: 'bg-gray-200 dark:bg-gray-700',
    success: 'bg-green-200 dark:bg-green-900',
    warning: 'bg-yellow-200 dark:bg-yellow-900',
    error: 'bg-red-200 dark:bg-red-900',
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} rounded-md transition-colors
            ${i < value ? colorMap[color] : bgColorMap[color]}
          `}
        />
      ))}
    </div>
  );
};

export default ProgressBar;
