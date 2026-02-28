/**
 * Toast - 轻量级通知系统
 *
 * 用于显示临时通知消息：
 * - 成功提示
 * - 错误提示
 * - 信息提示
 *
 * 特性：
 * - 自动消失
 * - 可堆叠显示
 * - 滑入/滑出动画
 * - 位置可配置（顶/底/左/右）
 *
 * @module components/ui/Toast
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const TOAST_ICONS = {
  success: <CheckCircle2 className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const TOAST_STYLES = {
  success: 'bg-white dark:bg-gray-800 border-green-500',
  error: 'bg-white dark:bg-gray-800 border-red-500',
  warning: 'bg-white dark:bg-gray-800 border-yellow-500',
  info: 'bg-white dark:bg-gray-800 border-blue-500',
};

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id={id}
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`
            relative flex items-start gap-3 px-4 py-3
            border-l-4 shadow-xl rounded-lg
            max-w-sm w-full
            ${TOAST_STYLES[type]}
          `}
          role="alert"
          aria-live="polite"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            aria-label="关闭"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>

          {/* Icon */}
          <div className={`flex-shrink-0 ${ICON_COLORS[type]} mt-0.5`}>
            {TOAST_ICONS[type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                {title}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * ToastContainer - 管理 Toast 显示的容器
 */
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: ToastPosition;
  onRemove: (id: string) => void;
}

const getPositionClasses = (position: ToastPosition) => {
  const [vertical, horizontal] = position.split('-');
  const verticalClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
  };
  const horizontalClasses = {
    left: 'left-4',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-4',
  };

  return `${verticalClasses[vertical as keyof typeof verticalClasses]} ${horizontalClasses[horizontal as keyof typeof horizontalClasses]}`;
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-center',
  onRemove,
}) => {
  return (
    <div
      className={`fixed z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full ${getPositionClasses(position)}`}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            className="pointer-events-auto"
          >
            <Toast {...toast} onClose={() => onRemove(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Toast Hook - 简化的 Toast API
 */
let toastId = 0;
let toastSetters: Set<(toasts: ToastProps[]) => void> = new Set();

export const showToast = (toast: Omit<ToastProps, 'id'>) => {
  const id = `toast-${toastId++}`;
  const newToast: ToastProps = { ...toast, id };

  // Notify all listeners
  toastSetters.forEach((setter) => {
    setter((prev) => [...prev, newToast]);
  });

  // Auto-remove after duration
  setTimeout(() => {
    removeToast(id);
  }, toast.duration || 3000);

  return id;
};

export const removeToast = (id: string) => {
  toastSetters.forEach((setter) => {
    setter((prev) => prev.filter((t) => t.id !== id));
  });
};

// Convenience functions
export const toast = {
  success: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
    return showToast({ type: 'success', message, ...options });
  },
  error: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
    return showToast({ type: 'error', message, duration: 5000, ...options });
  },
  warning: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
    return showToast({ type: 'warning', message, ...options });
  },
  info: (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
    return showToast({ type: 'info', message, ...options });
  },
};

export default Toast;
