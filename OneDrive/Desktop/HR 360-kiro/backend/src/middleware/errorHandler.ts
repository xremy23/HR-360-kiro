/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Simple app error wrapper
 */
function toAppError(err: any): any {
  if (err.name === 'AppError') return err;
  return {
    name: 'AppError',
    code: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An error occurred',
    statusCode: err.statusCode || 500,
    details: null,
  };
}

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const appError = toAppError(err);

  // Log error to console (fallback since logging service might fail)
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.error(`${appError.name}: ${appError.message}`, {
      code: appError.code,
      statusCode: appError.statusCode,
      path: req.path,
      method: req.method,
      stack: err.stack,
    });
  }

  // Sanitize error message for production
  const errorMessage = isDevelopment ? appError.message : 'An error occurred';

  // Send response
  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: errorMessage,
    },
    statusCode: appError.statusCode,
  });
}

/**
 * Async error wrapper for route handlers
 * Catches errors in async functions and passes them to error handler
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler middleware
 * Should be registered after all other routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  console.warn('404 Not Found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
    statusCode: 404,
  });
}
