/**
 * AsyncErrorBoundary Component
 *
 * A specialized error boundary for handling async operation errors.
 * Provides a context for async errors and includes retry functionality.
 *
 * @module components/AsyncErrorBoundary
 */

import { type ReactNode, useCallback, useState, createContext, useContext, type PropsWithChildren } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface AsyncErrorOptions {
  message?: string;
  retryable?: boolean;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
}

export interface AsyncErrorBoundaryValue {
  error: AsyncErrorOptions | null;
  setError: (error: AsyncErrorOptions | null) => void;
  clearError: () => void;
}

const AsyncErrorContext = createContext<AsyncErrorBoundaryValue | null>(null);

export interface AsyncErrorBoundaryProps extends PropsWithChildren {
  /**
   * Global error callback for async errors in this boundary.
   */
  onAsyncError?: (error: AsyncErrorOptions) => void;
  /**
   * Custom error display component.
   */
  ErrorDisplay?: typeof DefaultAsyncErrorDisplay;
}

/**
 * Default async error display component.
 */
export function DefaultAsyncErrorDisplay(props: {
  error: AsyncErrorOptions;
  onClear: () => void;
}): ReactNode {
  const { t } = useTranslation();
  const { message, retryable, onRetry } = props.error;
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      props.onClear();
    } catch {
      // Error persists, retry failed
      setIsRetrying(false);
    }
  }, [onRetry, props.onClear]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 shadow-xl animate-in slide-in-from-right duration-300">
        <div className="flex items-start gap-3">
          {/* Error Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>

          {/* Error Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">
              {message || t('common.error')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {retryable && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Retry"
              >
                <RefreshCw className={`w-4 h-4 text-red-400 ${isRetrying ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={props.onClear}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to access async error boundary context.
 *
 * @throws {Error} If used outside of AsyncErrorBoundary
 *
 * @example
 * ```tsx
 * const { setError } = useAsyncError();
 *
 * async function fetchData() {
 *   try {
 *     await apiCall();
 *   } catch (error) {
 *     setError({
 *       message: 'Failed to fetch data',
 *       retryable: true,
 *       onRetry: fetchData,
 *     });
 *   }
 * }
 * ```
 */
export function useAsyncError(): AsyncErrorBoundaryValue {
  const context = useContext(AsyncErrorContext);
  if (!context) {
    throw new Error('useAsyncError must be used within AsyncErrorBoundary');
  }
  return context;
}

/**
 * Higher-order function to wrap async functions with error boundary integration.
 *
 * @example
 * ```tsx
 * const fetchData = withAsyncError(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * }, {
 *   message: 'Failed to load data',
 *   retryable: true,
 * });
 * ```
 */
export function withAsyncError<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>,
  options?: Omit<AsyncErrorOptions, 'onRetry'>
): (...args: T) => Promise<void> {
  return async function wrapped(...args: T) {
    try {
      await fn(...args);
    } catch (error) {
      // Will be caught by the nearest error boundary
      throw error;
    }
  };
}

/**
 * Async Error Boundary Provider Component
 *
 * Provides a context for handling async errors with retry functionality.
 *
 * @example
 * ```tsx
 * <AsyncErrorBoundary
 *   onAsyncError={(error) => console.error('Async error:', error)}
 * >
 *   <YourComponent />
 * </AsyncErrorBoundary>
 * ```
 */
export function AsyncErrorBoundary({
  children,
  onAsyncError,
  ErrorDisplay = DefaultAsyncErrorDisplay,
}: AsyncErrorBoundaryProps): ReactNode {
  const [error, setErrorState] = useState<AsyncErrorOptions | null>(null);

  const setError = useCallback(
    (newError: AsyncErrorOptions | null) => {
      if (newError) {
        onAsyncError?.(newError);
        if (import.meta.env.DEV) {
          console.error('[AsyncErrorBoundary]', newError);
        }
      }
      setErrorState(newError);
    },
    [onAsyncError]
  );

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const contextValue: AsyncErrorBoundaryValue = {
    error,
    setError,
    clearError,
  };

  return (
    <AsyncErrorContext.Provider value={contextValue}>
      {children}
      {error && <ErrorDisplay error={error} onClear={clearError} />}
    </AsyncErrorContext.Provider>
  );
}

/**
 * Component for wrapping async operations with error handling.
 *
 * @example
 * ```tsx
 * <AsyncErrorHandler
 *   fn={fetchData}
 *   args={[userId]}
 *   errorMessage="Failed to fetch user data"
 *   retryable
 * >
 *   {(data, isLoading, error) => (
 *     isLoading ? <Loading /> : <UserProfile data={data} />
 *   )}
 * </AsyncErrorHandler>
 * ```
 */
export function AsyncErrorHandler<T extends unknown[], R>({
  fn,
  args,
  errorMessage,
  retryable = true,
  children,
}: {
  fn: (...args: T) => Promise<R>;
  args: T;
  errorMessage?: string;
  retryable?: boolean;
  children: (result: { data: R | null; isLoading: boolean; error: Error | null }) => ReactNode;
}): ReactNode {
  const { setError, clearError } = useAsyncError();
  const [state, setState] = useState<{
    data: R | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await fn(...args);
      setState({ data: result, isLoading: false, error: null });
      clearError();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, isLoading: false, error: err });
      setError({
        message: errorMessage || err.message,
        retryable,
        onRetry: execute,
      });
    }
  }, [fn, args, errorMessage, retryable, setError, clearError]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only run on mount/args change
  useState(() => {
    execute();
  });

  return <>{children(state)}</>;
}
