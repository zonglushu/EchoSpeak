/**
 * Alert - 改进的提示组件系统
 *
 * 用于显示各种用户反馈：
 * - 错误提示
 * - 成功提示
 * - 警告提示
 * - 信息提示
 *
 * 特性：
 * - 友好的视觉设计
 * - 图标支持
 * - 自动消失
 * - 可操作按钮
 * - 多种样式变体
 *
 * @module components/ui/Alert
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';

export type AlertType = 'error' | 'success' | 'warning' | 'info';
export type AlertVariant = 'inline' | 'banner' | 'toast';

export interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  variant?: AlertVariant;
  duration?: number; // Auto-dismiss duration (ms), 0 = no auto-dismiss
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const ALERT_CONFIG = {
  error: {
    icon: AlertOctagon,
    containerClass: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    titleClass: 'text-red-800 dark:text-red-400',
    messageClass: 'text-red-700 dark:text-red-300',
    iconClass: 'text-red-500',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    titleClass: 'text-green-800 dark:text-green-400',
    messageClass: 'text-green-700 dark:text-green-300',
    iconClass: 'text-green-500',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    titleClass: 'text-yellow-800 dark:text-yellow-400',
    messageClass: 'text-yellow-700 dark:text-yellow-300',
    iconClass: 'text-yellow-500',
  },
  info: {
    icon: Info,
    containerClass: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    titleClass: 'text-blue-800 dark:text-blue-400',
    messageClass: 'text-blue-700 dark:text-blue-300',
    iconClass: 'text-blue-500',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  variant = 'inline',
  duration = 0,
  showIcon = true,
  closable = true,
  onClose,
  actions,
  className = '',
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
    // Wait for animation to finish
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const config = ALERT_CONFIG[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`
            relative p-4 rounded-2xl border-2
            ${config.containerClass}
            ${className}
          `}
          role="alert"
          aria-live={type === 'error' ? 'assertive' : 'polite'}
        >
          {/* Close Button */}
          {closable && (
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
              aria-label="关闭提示"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}

          {/* Content */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            {showIcon && (
              <div className={`flex-shrink-0 ${config.iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            )}

            {/* Text */}
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className={`text-sm font-bold mb-1 ${config.titleClass}`}>
                  {title}
                </h4>
              )}
              <p className={`text-sm ${config.messageClass}`}>
                {message}
              </p>

              {/* Actions */}
              {actions && (
                <div className="mt-3 flex items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * ErrorAlert - 错误提示（带重试按钮）
 */
export interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = '出错了',
  message,
  onRetry,
  retryLabel = '重试',
  closable = true,
  onClose,
  className = '',
}) => {
  const actions = onRetry ? (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onRetry}
      className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-600 transition-colors flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      {retryLabel}
    </motion.button>
  ) : null;

  return (
    <Alert
      type="error"
      title={title}
      message={message}
      actions={actions}
      closable={closable}
      onClose={onClose}
      className={className}
    />
  );
};

/**
 * SuccessAlert - 成功提示
 */
export interface SuccessAlertProps {
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({
  title = '成功',
  message,
  duration = 3000,
  onClose,
  className = '',
}) => {
  return (
    <Alert
      type="success"
      title={title}
      message={message}
      duration={duration}
      closable={true}
      onClose={onClose}
      className={className}
    />
  );
};

/**
 * WarningAlert - 警告提示
 */
export interface WarningAlertProps {
  title?: string;
  message: string;
  actions?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const WarningAlert: React.FC<WarningAlertProps> = ({
  title = '注意',
  message,
  actions,
  closable = true,
  onClose,
  className = '',
}) => {
  return (
    <Alert
      type="warning"
      title={title}
      message={message}
      actions={actions}
      closable={closable}
      onClose={onClose}
      className={className}
    />
  );
};

export default Alert;
