/**
 * Skeleton - 骨架屏组件
 *
 * 用于内容加载时显示占位动画，提升用户体验
 *
 * 特性：
 * - 脉冲动画效果
 * - 多种预设（卡片、列表、文本）
 * - 模式适配（Flow/Battle/Think）
 * - 无障碍支持
 *
 * @module components/ui/Skeleton
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

const getSkeletonStyles = (variant: SkeletonProps['variant']) => {
  switch (variant) {
    case 'circular':
      return 'rounded-full';
    case 'rectangular':
      return 'rounded-md';
    default:
      return 'rounded';
  }
};

const getAnimationClass = (animation: SkeletonProps['animation']) => {
  switch (animation) {
    case 'pulse':
      return 'animate-pulse';
    case 'wave':
      return 'animate-shimmer';
    default:
      return '';
  }
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height = '1rem',
  className = '',
  animation = 'pulse',
}) => {
  return (
    <div
      className={`
        bg-gray-200 dark:bg-gray-700
        ${getSkeletonStyles(variant)}
        ${getAnimationClass(animation)}
        ${className}
      `}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * SkeletonCard - 卡片骨架屏
 */
export interface SkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {showAvatar && (
          <Skeleton variant="circular" width={48} height={48} className="flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height="1.25rem" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} width={i === lines - 1 ? '80%' : '100%'} height="1rem" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonList - 列表骨架屏
 */
export interface SkeletonListProps {
  count?: number;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  showAvatar = true,
  lines = 2,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          showAvatar={showAvatar}
          lines={lines}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonVideoCard - 视频卡片骨架屏
 */
export const SkeletonVideoCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden ${className}`}>
      {/* Thumbnail */}
      <Skeleton width="100%" height={180} variant="rectangular" className="!rounded-none" />

      {/* Content */}
      <div className="p-4 space-y-2">
        <Skeleton width="80%" height="1.25rem" />
        <Skeleton width="60%" height="1rem" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton width={60} height={24} variant="rectangular" className="rounded-full" />
          <Skeleton width="40%" height="1rem" />
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonMissionCard - 任务卡片骨架屏
 */
export const SkeletonMissionCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="70%" height="1.5rem" className="mb-2" />
          <Skeleton width="40%" height="1rem" />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>

      {/* Difficulty */}
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={20} height={8} variant="rectangular" className="rounded-full" />
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton width="100%" height="1rem" />
        <Skeleton width="90%" height="1rem" />
      </div>

      {/* CTA */}
      <Skeleton width="100%" height={48} variant="rectangular" className="rounded-xl" />
    </div>
  );
};

/**
 * SkeletonStats - 统计数据骨架屏
 */
export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1">
              <Skeleton width="60%" height="1rem" />
            </div>
          </div>
          <Skeleton width="40%" height="1.5rem" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
