/**
 * Request Logging Middleware
 * Logs all HTTP requests and responses with timing information
 * Generates unique request IDs for tracking
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { centralizedLoggingService } from '../services/loggingService';

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate unique request ID if not provided
  const requestId = req.get('x-request-id') || uuidv4();
  (req as any).id = requestId;

  // Record start time
  const startTime = Date.now();

  // Log incoming request
  centralizedLoggingService.logRequest(req, {
    requestId,
  });

  // Override res.send to log response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;

    centralizedLoggingService.logResponse(req, res, duration, {
      requestId,
      responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
    });

    return originalSend.call(this, data);
  };

  next();
}
