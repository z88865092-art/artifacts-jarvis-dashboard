/**
 * Error Logging Utility
 *
 * Lightweight error logging for both frontend and backend.
 * Captures API failures, network errors, and server-side exceptions.
 *
 * Usage:
 * Backend: errorLogger.captureError('API Error', error)
 * Frontend: errorLogger.captureError('Network', error)
 */

import type { IncomingMessage } from 'http';

interface ErrorLogEntry {
  timestamp: string;
  type: 'API_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'SERVER_ERROR' | 'UNKNOWN';
  message: string;
  statusCode?: number;
  url?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLogEntry[] = [];
  private readonly maxLogs = 1000;

  private constructor(private readonly isDev = false) {}

  static getInstance(isDev = false): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger(isDev);
    }
    return ErrorLogger.instance;
  }

  /**
   * Capture API call failures
   */
  captureApiError(
    url: string,
    statusCode: number,
    error: Error | string,
    context?: Record<string, unknown>
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      type: statusCode >= 500 ? 'SERVER_ERROR' : 'API_ERROR',
      message: typeof error === 'string' ? error : error.message,
      statusCode,
      url,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
    };

    this.logError(entry);
  }

  /**
   * Capture network/connection errors
   */
  captureNetworkError(url: string, error: Error, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'NETWORK_ERROR',
      message: error.message,
      url,
      stack: error.stack,
      context,
    };

    this.logError(entry);
  }

  /**
   * Capture validation errors
   */
  captureValidationError(message: string, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'VALIDATION_ERROR',
      message,
      context,
    };

    this.logError(entry);
  }

  /**
   * Generic error capture
   */
  captureError(type: ErrorLogEntry['type'], error: Error | string, context?: Record<string, unknown>): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      type: type || 'UNKNOWN',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
    };

    this.logError(entry);
  }

  /**
   * Internal logging method
   */
  private logError(entry: ErrorLogEntry): void {
    // Add to in-memory buffer
    this.logs.push(entry);

    // Keep buffer size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Always log to console (captured by Vercel/Replit logs)
    console.error(`[${entry.type}]`, {
      timestamp: entry.timestamp,
      message: entry.message,
      statusCode: entry.statusCode,
      url: entry.url,
      context: entry.context,
      ...(this.isDev && { stack: entry.stack }),
    });

    // In production, could send to external service
    if (!this.isDev && entry.type === 'SERVER_ERROR') {
      this.notifyOnServerError(entry);
    }
  }

  /**
   * Send notification on 500 errors
   */
  private async notifyOnServerError(entry: ErrorLogEntry): Promise<void> {
    // Could integrate with:
    // - Sentry
    // - DataDog
    // - Custom webhook
    // - Email service

    // For now, just log to ensure visibility
    console.error('[ALERT] Server error detected:', entry.message);
  }

  /**
   * Get all logged errors
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * Filter logs by type
   */
  getLogsByType(type: ErrorLogEntry['type']): ErrorLogEntry[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance(process.env.NODE_ENV !== 'production');
