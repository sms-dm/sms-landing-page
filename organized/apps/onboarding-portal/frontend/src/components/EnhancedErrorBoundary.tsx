import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  public componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Check if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset on props change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }

    this.previousResetKeys = resetKeys || [];
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private handleReset = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private getErrorMessage = (error: Error): string => {
    // Custom error messages based on error type
    if (error.name === 'ChunkLoadError') {
      return 'The application failed to load properly. This might be due to a network issue or an outdated version.';
    }
    
    if (error.message.includes('Network')) {
      return 'There seems to be a network issue. Please check your internet connection.';
    }

    if (error.message.includes('Permission')) {
      return 'You don\'t have permission to perform this action.';
    }

    return 'An unexpected error occurred. Our team has been notified.';
  };

  private getSuggestions = (error: Error): string[] => {
    const suggestions: string[] = [];

    if (error.name === 'ChunkLoadError') {
      suggestions.push('Clear your browser cache and reload');
      suggestions.push('Check if you\'re using the latest version of your browser');
    }

    if (error.message.includes('Network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try disabling browser extensions');
      suggestions.push('Contact your network administrator if the issue persists');
    }

    // Always include these
    suggestions.push('Try refreshing the page');
    suggestions.push('If the problem persists, contact support');

    return suggestions;
  };

  public render() {
    const { hasError, error, errorInfo, errorCount, showDetails } = this.state;
    const { fallback, children, isolate, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      const errorMessage = this.getErrorMessage(error);
      const suggestions = this.getSuggestions(error);

      // Different layouts based on error boundary level
      if (level === 'page') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Card className="max-w-2xl w-full p-8 animate-fadeIn">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>

                {suggestions.length > 0 && (
                  <div className="mb-6 text-left bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">Try these suggestions:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                  <Button onClick={this.handleReset} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={this.handleReload} variant="outline">
                    Reload Page
                  </Button>
                  <Button onClick={this.handleHome} variant="outline">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Error details for developers */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6">
                    <button
                      onClick={this.toggleDetails}
                      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {showDetails ? 'Hide' : 'Show'} error details
                    </button>
                    
                    {showDetails && (
                      <div className="mt-4 text-left animate-slideIn">
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                          <div className="mb-2">
                            <span className="text-red-400">Error:</span> {error.toString()}
                          </div>
                          {error.stack && (
                            <pre className="text-xs whitespace-pre-wrap">{error.stack}</pre>
                          )}
                          {errorInfo?.componentStack && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                              <div className="text-yellow-400 mb-2">Component Stack:</div>
                              <pre className="text-xs whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {errorCount > 2 && (
                  <p className="mt-4 text-sm text-gray-500">
                    This error has occurred {errorCount} times. Consider reloading the page.
                  </p>
                )}
              </div>
            </Card>
          </div>
        );
      }

      // Inline error for sections/components
      return (
        <div className={cn(
          'p-4 rounded-lg border animate-fadeIn',
          isolate ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : ''
        )}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Component Error</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {isolate 
                  ? 'This component encountered an error but the rest of the page should work fine.'
                  : errorMessage
                }
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={this.handleReset}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                {!isolate && (
                  <Button size="sm" variant="outline" onClick={this.handleReload}>
                    Reload Page
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: (error: Error) => setError(error),
    reset: () => setError(null),
  };
}