/**
 * useAsyncOperation Hook
 *
 * A hook for managing async operations with loading, error, and data states.
 * Provides a consistent pattern for async operations across components.
 *
 * @module hooks/useAsyncOperation
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logError, getErrorMessage } from '../services/errors';

export interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface AsyncOperationReturn<T> extends AsyncOperationState<T> {
  execute: () => Promise<void>;
  reset: () => void;
  isMounted: React.MutableRefObject<boolean>;
}

/**
 * Options for async operation behavior.
 */
export interface UseAsyncOperationOptions {
  /**
   * Whether to show an error message to the user.
   */
  showError?: boolean;
  /**
   * Custom error message to display.
   */
  errorMessage?: string;
  /**
   * Callback for successful operation.
   */
  onSuccess?: (data: unknown) => void;
  /**
   * Callback for failed operation.
   */
  onError?: (error: Error) => void;
  /**
   * Initial data state.
   */
  initialData?: unknown;
}

/**
 * Hook for managing async operations with loading, error, and data states.
 *
 * @param fn - The async function to execute
 * @param options - Configuration options
 * @returns Object containing state and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute, reset } = useAsyncOperation(
 *   async () => fetchUserData(userId),
 *   {
 *     onSuccess: (data) => console.log('Success!', data),
 *     onError: (err) => console.error('Failed!', err),
 *   }
 * );
 *
 * return (
 *   <div>
 *     {isLoading && <Loading />}
 *     {error && <Error message={error} />}
 *     {data && <UserData data={data} />}
 *     <button onClick={execute}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useAsyncOperation<T>(
  fn: () => Promise<T>,
  options: UseAsyncOperationOptions = {}
): AsyncOperationReturn<T> {
  const {
    showError = true,
    errorMessage: customErrorMessage,
    onSuccess,
    onError,
    initialData = null,
  } = options;

  const { t } = useTranslation();
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData as T | null,
    isLoading: false,
    error: null,
  });

  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<void> => {
    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller for this request
    abortController.current = new AbortController();

    if (!isMounted.current) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await fn();

      if (isMounted.current) {
        setState({
          data: result,
          isLoading: false,
          error: null,
        });
        onSuccess?.(result);
      }
    } catch (err) {
      const message = customErrorMessage ?? getErrorMessage(err);
      logError(err, 'useAsyncOperation');

      if (isMounted.current) {
        setState({
          data: null,
          isLoading: false,
          error: showError ? message : null,
        });
        onError?.(err instanceof Error ? err : new Error(message));
      }
    }
  }, [fn, showError, customErrorMessage, onSuccess, onError]);

  const reset = useCallback((): void => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    setState({
      data: initialData as T | null,
      isLoading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
    isMounted,
  };
}

/**
 * Hook for retryable async operations with automatic retry logic.
 *
 * @param fn - The async function to execute
 * @param maxRetries - Maximum number of retry attempts
 * @param options - Additional configuration options
 * @returns Object containing state and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute, retryCount } = useRetryableOperation(
 *   () => fetchUserData(userId),
 *   3
 * );
 * ```
 */
export function useRetryableOperation<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  options: UseAsyncOperationOptions = {}
): AsyncOperationReturn<T> & { retryCount: number } {
  const [retryCount, setRetryCount] = useState(0);
  const baseHook = useAsyncOperation<T>(fn, options);

  const executeWithRetry = useCallback(async (): Promise<void> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        await fn();

        // Success - reset retry count
        setRetryCount(0);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(getErrorMessage(err));

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s...
          await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
        }
      }
    }

    // All retries failed
    throw lastError;
  }, [fn, maxRetries]);

  return {
    ...baseHook,
    retryCount,
    execute: executeWithRetry,
  };
}

/**
 * Hook for managing multiple async operations in parallel.
 *
 * @example
 * ```tsx
 * const { results, isLoading, errors, executeAll } = useMultipleAsyncOperations([
 *   () => fetchUser(),
 *   () => fetchPosts(),
 *   () => fetchComments(),
 * ]);
 * ```
 */
export function useMultipleAsyncOperations<T>(
  fns: Array<() => Promise<T>>,
  options: UseAsyncOperationOptions = {}
) {
  const [states, setStates] = useState<Array<AsyncOperationState<T>>>(
    fns.map(() => ({ data: null, isLoading: false, error: null }))
  );

  const executeAll = useCallback(async (): Promise<void> => {
    setStates((prev) => prev.map(() => ({ data: null, isLoading: true, error: null })));

    try {
      const results = await Promise.allSettled(fns.map((fn) => fn()));

      const newStates = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return { data: result.value, isLoading: false, error: null };
        }
        const message = getErrorMessage(result.reason);
        logError(result.reason, `useMultipleAsyncOperations[${index}]`);
        return {
          data: null,
          isLoading: false,
          error: options.showError ? message : null,
        };
      });

      setStates(newStates);

      // Call onSuccess if all operations succeeded
      if (results.every((r) => r.status === 'fulfilled')) {
        options.onSuccess?.(results.map((r) => (r.status === 'fulfilled' ? r.value : null)) as unknown as T);
      }
    } catch (err) {
      logError(err, 'useMultipleAsyncOperations');
    }
  }, [fns, options]);

  return {
    results: states.map((s) => s.data),
    isLoading: states.some((s) => s.isLoading),
    errors: states.map((s) => s.error),
    executeAll,
  };
}
