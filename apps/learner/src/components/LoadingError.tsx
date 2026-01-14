/**
 * Loading and Error State Components
 *
 * Reusable components for displaying loading, error, and empty states.
 * Designed to work seamlessly with the error boundary system.
 *
 * @module components/LoadingError
 */

import { type ReactNode } from 'react';
import { Loader2, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showIcon?: boolean;
  className?: string;
}

export interface EmptyProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Loading spinner component.
 *
 * @example
 * ```tsx
 * <Loading message="Loading data..." />
 * <Loading size="lg" />
 * ```
 */
export function Loading({ message, size = 'md', className = '' }: LoadingProps): ReactNode {
  const { t } = useTranslation();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {message && <p className="text-slate-400 text-sm">{message || t('common.loading')}</p>}
    </div>
  );
}

/**
 * Error state display component.
 *
 * @example
 * ```tsx
 * <Error
 *   message="Failed to load data"
 *   onRetry={() => refetch()}
 *   isRetrying={isLoading}
 * />
 * ```
 */
export function Error({
  title,
  message,
  onRetry,
  isRetrying = false,
  showIcon = true,
  className = '',
}: ErrorProps): ReactNode {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 px-6 text-center ${className}`}
    >
      {showIcon && (
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
      )}
      <div className="max-w-sm">
        {title && <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>}
        <p className="text-slate-400 text-sm">{message || t('common.error')}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-xl font-medium text-white transition-all active:scale-95 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      )}
    </div>
  );
}

/**
 * Empty state display component.
 *
 * @example
 * ```tsx
 * <Empty
 *   title="No items found"
 *   message="Get started by adding your first item"
 *   action={<Button>Add Item</Button>}
 * />
 * ```
 */
export function Empty({ title, message, icon, action, className = '' }: EmptyProps): ReactNode {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
        {icon || <Inbox className="w-8 h-8 text-slate-600" />}
      </div>
      <div className="max-w-sm">
        {title && <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>}
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Combined loading, error, and data renderer.
 *
 * @example
 * ```tsx
 * <LoadingOrError
 *   isLoading={isLoading}
 *   error={error}
 *   data={data}
 *   emptyMessage="No items found"
 * >
 *   {(items) => <ItemList items={items} />}
 * </LoadingOrError>
 * ```
 */
export function LoadingOrError<T>({
  isLoading,
  error,
  data,
  emptyMessage,
  onRetry,
  isRetrying,
  children,
}: {
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  emptyMessage?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  children: (data: T) => ReactNode;
}): ReactNode {
  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} onRetry={onRetry} isRetrying={isRetrying} />;
  }

  if (!data) {
    return <Empty message={emptyMessage} />;
  }

  return <>{children(data)}</>;
}
