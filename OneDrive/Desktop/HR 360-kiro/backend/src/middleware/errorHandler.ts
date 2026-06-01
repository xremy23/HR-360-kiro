/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from 'express';
import { isAppError, toAppError, AppError } from '../utils/errors';
import { logger } from '../services/monitoringService';

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const appError = isAppError(err) ? err : toAppError(err);

  // Log error
  const logLevel = appError.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`${appError.name}: ${appError.message}`, {
    code: appError.code,
    statusCode: appError.statusCode,
    path: req.path,
    method: req.method,
    details: appError.details,
    stack: err.stack,
  });

  // Sanitize error message for production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? appError.message : 'An error occurred';

  // Send response
  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: errorMessage,
      ...(isDevelopment && appError.details && { details: appError.details }),
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
  logger.warn('404 Not Found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
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
