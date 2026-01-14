/**
 * Service Error Utilities
 *
 * Provides standardized error classes and error handling utilities
 * for use across all service modules.
 *
 * @module services/errors
 */

/**
 * Base error class for all service-related errors.
 * Provides a consistent structure for error handling and logging.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Converts the error to a plain object for logging or serialization.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
      } : this.cause,
    };
  }
}

/**
 * Error thrown when a network request fails.
 */
export class NetworkError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'NETWORK_ERROR', cause, true);
  }
}

/**
 * Error thrown when data validation fails.
 */
export class ValidationError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', cause, false);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'NOT_FOUND', cause, false);
  }
}

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends ServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TIMEOUT', cause, true);
  }
}

/**
 * Error types for categorization and display.
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * Maps error classes to error types.
 */
const ERROR_TYPE_MAP: Record<Function, ErrorType> = {
  [NetworkError]: ErrorType.NETWORK,
  [ValidationError]: ErrorType.VALIDATION,
  [NotFoundError]: ErrorType.NOT_FOUND,
  [TimeoutError]: ErrorType.TIMEOUT,
};

/**
 * Gets the error type from an error instance.
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof ServiceError) {
    return ERROR_TYPE_MAP[error.constructor] ?? ErrorType.UNKNOWN;
  }
  return ErrorType.UNKNOWN;
}

/**
 * Checks if an error is retryable.
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof ServiceError) {
    return error.retryable;
  }
  return false;
}

/**
 * Safely extracts an error message from any error value.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Logs an error in development mode only.
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(prefix, error);
  }
}

/**
 * Wraps an async function with try-catch and converts thrown errors
 * to ServiceError instances.
 */
export function withServiceError<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>,
  errorClass: new (message: string, cause?: unknown) => ServiceError = NetworkError
): (...args: T) => Promise<unknown> {
  return async function wrapped(...args: T) {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new errorClass(getErrorMessage(error), error);
    }
  };
}

/**
 * Options for retry logic.
 */
export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Default retry options.
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
  isRetryable: (error) => isRetryable(error) || error instanceof TypeError,
};

/**
 * Retries an async function with exponential backoff.
 *
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const shouldRetry = opts.isRetryable(error);
      if (!shouldRetry || attempt >= opts.maxAttempts) {
        throw error;
      }

      const delay = Math.min(
        opts.delayMs * opts.backoffMultiplier ** (attempt - 1),
        opts.maxDelayMs
      );

      logError(error, `Retry attempt ${attempt}/${opts.maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Result type for operations that may fail without throwing.
 */
export type Result<T, E = ServiceError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Wraps an async function and returns a Result type instead of throwing.
 *
 * @example
 * ```ts
 * const result = await safeAsync(() => fetchUserData());
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorClass?: new (message: string, cause?: unknown) => ServiceError
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof ServiceError || !errorClass) {
      return { success: false, error: error as ServiceError };
    }
    return {
      success: false,
      error: new errorClass(getErrorMessage(error), error),
    };
  }
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 * Useful for preventing repeated error handling calls.
 */
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  waitMs: number
): (...args: T) => void {
  let timeoutId: number | null = null;

  return function debounced(...args: T) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, waitMs);
  };
}
