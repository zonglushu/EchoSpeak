/**
 * ErrorBoundary Component
 *
 * Catches React errors in the component tree and displays a graceful fallback UI.
 * This prevents the entire app from crashing when an error occurs.
 *
 * @module components/ErrorBoundary
 */

import { type ReactNode, Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export interface ErrorBoundaryProps extends PropsWithChildren {
  /**
   * Custom fallback component to render when an error is caught.
   * If not provided, the default ErrorFallback will be used.
   */
  fallback?: ReactNode;
  /**
   * Custom error message to display.
   */
  errorMessage?: string;
  /**
   * Callback function called when an error is caught.
   * Useful for error logging and tracking.
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Whether to show the error details in development mode.
   * @default true
   */
  showDetails?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Default fallback component for error display.
 */
function ErrorFallbackInner(props: {
  error: Error | null;
  resetError: () => void;
  errorMessage?: string;
  showDetails?: boolean;
}): ReactNode {
  const { t } = useTranslation();
  const isDev = import.meta.env.DEV;
  const showDetails = props.showDetails ?? true;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-center text-white mb-2">
          {t('errors.title')}
        </h1>

        {/* Error Message */}
        <p className="text-slate-400 text-center mb-6">
          {props.errorMessage || t('errors.unknown')}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={props.resetError}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-semibold text-white transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {t('errors.retry')}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold text-white transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('errors.goBack')}
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-semibold text-white transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {t('errors.goHome')}
            </button>
          </div>
        </div>

        {/* Error Details (Development Only) */}
        {isDev && showDetails && props.error && (
          <details className="mt-6">
            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
              {t('errors.details')} (Dev Only)
            </summary>
            <div className="mt-3 p-4 bg-black/40 rounded-xl overflow-auto max-h-48">
              <p className="text-red-400 text-sm font-mono whitespace-pre-wrap">
                {props.error.toString()}
              </p>
              {props.error.stack && (
                <pre className="text-slate-500 text-xs mt-2 whitespace-pre-wrap">
                  {props.error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Wrapper component to use i18n hook in class component context.
 */
function ErrorFallbackWrapper(props: {
  error: Error | null;
  resetError: () => void;
  errorMessage?: string;
  showDetails?: boolean;
}): ReactNode {
  return <ErrorFallbackInner {...props} />;
}

export { ErrorFallbackWrapper as ErrorFallback };

/**
 * Error Boundary Class Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => console.error(error, errorInfo)}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use default error fallback
      return (
        <ErrorFallbackWrapper
          error={this.state.error}
          resetError={this.handleReset}
          errorMessage={this.props.errorMessage}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}
