/**
 * Frontend Error Handling
 *
 * Captures and reports:
 * - API call failures
 * - Network errors
 * - Component errors
 * - Unhandled promise rejections
 */

import { errorLogger } from '@workspace/lib/error-logging';

/**
 * Setup global error handlers
 */
export function setupErrorHandling(): void {
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    errorLogger.captureError('UNKNOWN', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    errorLogger.captureError('UNKNOWN', error, {
      type: 'unhandledRejection',
    });
  });

  // Wrap fetch to capture API errors
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    return originalFetch
      .apply(this, args as Parameters<typeof fetch>)
      .then((response) => {
        if (!response.ok) {
          errorLogger.captureApiError(
            url || 'unknown',
            response.status,
            `HTTP ${response.status}: ${response.statusText}`,
            {
              method: response.type,
              contentType: response.headers.get('content-type'),
            }
          );
        }
        return response;
      })
      .catch((error) => {
        errorLogger.captureNetworkError(url || 'unknown', error, {
          retryable: error.name === 'TypeError',
        });
        throw error;
      });
  } as typeof fetch;
}

/**
 * React Error Boundary Hook (for React 18+)
 */
export function useErrorHandler(logError: (error: Error) => void) {
  return (error: Error) => {
    errorLogger.captureError('UNKNOWN', error, {
      component: 'ErrorBoundary',
    });
    logError(error);
  };
}
