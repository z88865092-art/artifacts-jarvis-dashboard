/**
 * Backend Error Handler Middleware
 *
 * Captures:
 * - 4xx Client Errors
 * - 5xx Server Errors
 * - Unhandled exceptions
 * - Database errors
 */

import type { Request, Response, NextFunction } from 'express';
import { errorLogger } from '@workspace/lib/error-logging';

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Express Error Handler Middleware
 *
 * Must be registered LAST in middleware stack:
 * app.use(errorHandler)
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log the error
  errorLogger.captureApiError(req.url, status, error, {
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // Alert on 500 errors
  if (status >= 500) {
    console.error(`[ALERT] 500 Error:`, {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      error: message,
      stack: error.stack,
    });
  }

  // Send response
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
}

/**
 * 404 Not Found Handler
 *
 * Register BEFORE errorHandler:
 * app.use(notFoundHandler)
 * app.use(errorHandler)
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const error = new (Error as any)(`Not Found: ${req.method} ${req.path}`);
  error.status = 404;

  errorLogger.captureError('API_ERROR', error, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
}

/**
 * Async Error Wrapper
 *
 * Wraps async route handlers to catch errors:
 * router.get('/endpoint', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOp()
 *   res.json(data)
 * }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
