/**
 * Gesture & Micro-interactions - 手势和微交互增强
 *
 * 提供增强的交互体验：
 * - 下拉刷新
 * - 滑动手势
 * - 触觉反馈
 * - 加载骨架屏
 *
 * @module components/ui/Gestures
 */

import React, { useState, useRef, TouchEvent } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronDown, RefreshCw } from 'lucide-react';

/**
 * PullToRefresh - 下拉刷新组件
 */
export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  children: React.ReactNode;
  pullThreshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing,
  children,
  pullThreshold = 80,
  className = '',
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;

    const touch = e.touches[0];
    const scrollTop = containerRef.current?.scrollTop || 0;

    if (scrollTop === 0) {
      const newDistance = touch.clientY;
      setPullDistance(Math.min(Math.max(newDistance, 0), pullThreshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    setIsPulling(false);

    if (pullDistance >= pullThreshold) {
      setPullDistance(0);
      await onRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const rotate = useTransform(pullDistance, (d) => Math.min(d / pullThreshold, 1) * 360);

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-y-auto
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ height: Math.max(0, pullDistance) }}
      >
        <motion.div
          rotate={rotate}
          className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
            pullDistance >= pullThreshold
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
        </motion.div>
        <span
          className={`text-xs font-medium ${
            pullDistance >= pullThreshold
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {isRefreshing ? '刷新中...' : pullDistance >= pullThreshold ? '释放刷新' : '下拉刷新'}
        </span>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isRefreshing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            {children}
          </motion.div>
        ) : (
          <div style={{ opacity: pullDistance > 0 ? 1 - pullDistance / 200 : 1 }}>
            {children}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Swipeable - 可滑动的容器
 */
export interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
  className = '',
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart === null) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStart;

    if (Math.abs(diff) > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStart === null || !isDragging) {
      setTouchStart(null);
      setIsDragging(false);
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStart;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    setTouchStart(null);
    setIsDragging(false);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

/**
 * PressScale - 按压缩放效果
 */
export interface PressScaleProps {
  children: React.ReactNode;
  scale?: number;
  disabled?: boolean;
  className?: string;
}

export const PressScale: React.FC<PressScaleProps> = ({
  children,
  scale = 0.95,
  disabled = false,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ShimmerEffect - 微光加载效果
 */
export const ShimmerEffect: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`
        relative overflow-hidden bg-gradient-to-r
        from-gray-200 via-gray-100 to-gray-200
        dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
        ${className}
      `}
    >
      <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-transparent via-white/50 to-transparent
          dark:via-white/10
          animate-shimmer
        "
      />
    </div>
  );
};

/**
 * Add shimmer animation to global CSS if needed
 */
export const ShimmerStyle: React.FC = () => (
  <style>{`
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  `}</style>
);

export default PullToRefresh;
