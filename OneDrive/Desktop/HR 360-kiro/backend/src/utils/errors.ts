/**
 * Custom Error Classes
 * Standardized error handling across the application
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', 400, message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: Record<string, any>) {
    super('AUTHENTICATION_ERROR', 401, message, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: Record<string, any>) {
    super('AUTHORIZATION_ERROR', 403, message, details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, details?: Record<string, any>) {
    super('NOT_FOUND', 404, `${resource} not found`, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONFLICT', 409, message, details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: Record<string, any>) {
    super('RATE_LIMIT_EXCEEDED', 429, message, details);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super('INTERNAL_SERVER_ERROR', 500, message, details);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: Record<string, any>) {
    super('SERVICE_UNAVAILABLE', 503, `${service} is temporarily unavailable`, details);
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: any): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, { originalError: error.name });
  }

  return new InternalServerError('An unexpected error occurred', { error });
}
