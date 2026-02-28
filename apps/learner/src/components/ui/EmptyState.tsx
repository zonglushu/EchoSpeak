/**
 * EmptyState - 空状态组件
 *
 * 用于显示各种空状态场景，如：
 * - 没有内容时（无数据）
 * - 搜索无结果
 * - 网络错误
 * - 功能未启用
 *
 * 特性：
 * - 多种预设类型
 * - 友好的插图和文案
 * - 清晰的行动号召（CTA）
 * - 模式适配（Flow/Battle/Think）
 *
 * @module components/ui/EmptyState
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  SearchX,
  WifiOff,
  Lock,
  BookOpen,
  Video,
  Target,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export type EmptyStateType =
  | 'no-chunks'
  | 'no-videos'
  | 'no-missions'
  | 'no-sessions'
  | 'network-error'
  | 'empty-search'
  | 'locked-feature'
  | 'coming-soon';

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact' | 'full-page';
  className?: string;
}

const EMPTY_STATE_CONFIG: Record<
  EmptyStateType,
  {
    icon: React.ReactNode;
    defaultTitle: string;
    defaultDescription: string;
    defaultAction?: string;
  }
> = {
  'no-chunks': {
    icon: <Inbox className="w-16 h-16" />,
    defaultTitle: '暂无待复习语块',
    defaultDescription: '在其他模式下收集语块后，这里会显示待复习内容',
    defaultAction: '去收集语块',
  },
  'no-videos': {
    icon: <Video className="w-16 h-16" />,
    defaultTitle: '暂无视频内容',
    defaultDescription: '资源库中还没有视频，请先添加一些学习内容',
    defaultAction: '添加视频',
  },
  'no-missions': {
    icon: <Target className="w-16 h-16" />,
    defaultTitle: '暂无可用任务',
    defaultDescription: '当前没有适合你水平的任务，完成更多练习解锁新内容',
    defaultAction: '查看练习',
  },
  'no-sessions': {
    icon: <BookOpen className="w-16 h-16" />,
    defaultTitle: '暂无练习记录',
    defaultDescription: '开始第一次练习，建立你的学习档案',
    defaultAction: '开始练习',
  },
  'network-error': {
    icon: <WifiOff className="w-16 h-16" />,
    defaultTitle: '网络连接失败',
    defaultDescription: '请检查网络连接后重试',
    defaultAction: '重新加载',
  },
  'empty-search': {
    icon: <SearchX className="w-16 h-16" />,
    defaultTitle: '未找到相关内容',
    defaultDescription: '尝试使用不同的关键词或筛选条件',
    defaultAction: '清除筛选',
  },
  'locked-feature': {
    icon: <Lock className="w-16 h-16" />,
    defaultTitle: '功能未解锁',
    defaultDescription: '完成更多练习来解锁此功能',
    defaultAction: '查看进度',
  },
  'coming-soon': {
    icon: <Lightbulb className="w-16 h-16" />,
    defaultTitle: '敬请期待',
    defaultDescription: '这个功能正在开发中，即将推出',
  },
};

const getVariantStyles = (variant: EmptyStateProps['variant']) => {
  switch (variant) {
    case 'compact':
      return 'py-8 px-4';
    case 'full-page':
      return 'py-20 px-6 min-h-[60vh]';
    default:
      return 'py-16 px-6';
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-chunks',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = 'default',
  className = '',
}) => {
  const config = EMPTY_STATE_CONFIG[type];
  const displayTitle = title || config.defaultTitle;
  const displayDescription = description || config.defaultDescription;
  const displayAction = actionLabel || config.defaultAction;
  const displayIcon = icon || config.icon;

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        bg-white dark:bg-gray-800 rounded-3xl
        ${getVariantStyles(variant)}
        ${className}
      `}
    >
      {/* Icon with animated background */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full blur-2xl" />

        {/* Icon */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center text-gray-400 dark:text-gray-500">
          {displayIcon}
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-xl font-black text-gray-900 dark:text-white mb-3"
      >
        {displayTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8"
      >
        {displayDescription}
      </motion.p>

      {/* Action Button */}
      {displayAction && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="group px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2"
        >
          {displayAction}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      )}
    </div>
  );
};

/**
 * 预设的空状态快捷组件
 */
export const NoChunksEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState type="no-chunks" onAction={onAction} />
);

export const NoVideosEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState type="no-videos" onAction={onAction} />
);

export const NoMissionsEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <EmptyState type="no-missions" onAction={onAction} />
);

export const NetworkErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState type="network-error" onAction={onRetry} />
);

export const EmptySearchEmptyState: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <EmptyState type="empty-search" variant="compact" onAction={onClear} />
);

export default EmptyState;
