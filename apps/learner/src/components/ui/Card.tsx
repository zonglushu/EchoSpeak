/**
 * Card - 统一的卡片组件
 *
 * 提供一致的卡片设计语言：
 * - 统一的圆角、阴影、间距
 * - 多种变体（默认、突出、扁平）
 * - 悬停效果
 * - 模式色彩适配
 *
 * @module components/ui/Card
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES = {
  default: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-xl border-0',
  outlined: 'bg-white dark:bg-gray-800 shadow-none border-2 border-gray-300 dark:border-gray-600',
  flat: 'bg-transparent shadow-none border-0',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hover = false,
  clickable = false,
  onClick,
  className = '',
}) => {
  const Component = clickable ? motion.button : motion.div;
  const baseProps = clickable ? { onClick } : {};

  return (
    <Component
      {...baseProps}
      whileHover={hover ? { scale: 1.02 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      className={`
        rounded-2xl overflow-hidden
        ${VARIANT_STYLES[variant]}
        ${hover && clickable ? 'cursor-pointer transition-shadow hover:shadow-xl' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};

/**
 * CardSection - 卡片内容分区
 */
export interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
);

export const CardBody: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <div className={`px-6 pb-6 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<CardSectionProps> = ({ children, className = '' }) => (
  <div className={`px-6 pb-6 pt-0 ${className}`}>{children}</div>
);

export default Card;
