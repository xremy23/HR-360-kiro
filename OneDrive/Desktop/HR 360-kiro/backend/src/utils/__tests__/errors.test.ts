import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  isAppError,
  toAppError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with required properties', () => {
      const error = new AppError('TEST_CODE', 400, 'Test message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test message');
      expect(error.details).toBeUndefined();
    });

    it('should create an AppError with optional details', () => {
      const details = { field: 'test' };
      const error = new AppError('TEST_CODE', 400, 'Test message', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct default properties', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toBeUndefined();
    });

    it('should accept optional details', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
    });

    it('should accept custom message and details', () => {
      const error = new AuthenticationError('Invalid token', { token: 'expired' });
      expect(error.message).toBe('Invalid token');
      expect(error.details).toEqual({ token: 'expired' });
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with default message', () => {
      const error = new AuthorizationError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AuthorizationError');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
    });

    it('should accept custom message and details', () => {
      const error = new AuthorizationError('Role required', { role: 'admin' });
      expect(error.message).toBe('Role required');
      expect(error.details).toEqual({ role: 'admin' });
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with formatted message', () => {
      const error = new NotFoundError('User');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('NotFoundError');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should accept details', () => {
      const error = new NotFoundError('User', { id: 123 });
      expect(error.details).toEqual({ id: 123 });
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with message', () => {
      const error = new ConflictError('Email already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ConflictError');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
    });

    it('should accept details', () => {
      const error = new ConflictError('Conflict', { duplicate: true });
      expect(error.details).toEqual({ duplicate: true });
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with default message', () => {
      const error = new RateLimitError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
    });

    it('should accept custom message and details', () => {
      const error = new RateLimitError('Limit exceeded', { retryAfter: 60 });
      expect(error.message).toBe('Limit exceeded');
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe('InternalServerError', () => {
    it('should create an InternalServerError with default message', () => {
      const error = new InternalServerError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('InternalServerError');
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
    });

    it('should accept custom message and details', () => {
      const error = new InternalServerError('Database down', { db: 'postgres' });
      expect(error.message).toBe('Database down');
      expect(error.details).toEqual({ db: 'postgres' });
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a ServiceUnavailableError with formatted message', () => {
      const error = new ServiceUnavailableError('Payment Gateway');

      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('ServiceUnavailableError');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Payment Gateway is temporarily unavailable');
    });

    it('should accept details', () => {
      const error = new ServiceUnavailableError('Payment Gateway', { retryAfter: 300 });
      expect(error.details).toEqual({ retryAfter: 300 });
    });
  });

  describe('Utility Functions', () => {
    describe('isAppError', () => {
      it('should return true for AppError instances', () => {
        const error = new AppError('CODE', 400, 'message');
        expect(isAppError(error)).toBe(true);
      });

      it('should return true for subclasses of AppError', () => {
        const error = new ValidationError('Invalid');
        expect(isAppError(error)).toBe(true);
      });

      it('should return false for standard Error instances', () => {
        const error = new Error('Standard error');
        expect(isAppError(error)).toBe(false);
      });

      it('should return false for non-error objects', () => {
        expect(isAppError({ message: 'Not an error' })).toBe(false);
        expect(isAppError(null)).toBe(false);
        expect(isAppError(undefined)).toBe(false);
        expect(isAppError('string error')).toBe(false);
      });
    });

    describe('toAppError', () => {
      it('should return the same error if it is already an AppError', () => {
        const error = new ValidationError('Invalid');
        const result = toAppError(error);
        expect(result).toBe(error);
      });

      it('should convert a standard Error to an InternalServerError', () => {
        const error = new Error('Something went wrong');
        error.name = 'TypeError';

        const result = toAppError(error);

        expect(result).toBeInstanceOf(InternalServerError);
        expect(result.message).toBe('Something went wrong');
        expect(result.details).toEqual({ originalError: 'TypeError' });
      });

      it('should convert unknown objects to an InternalServerError', () => {
        const unknownError = { custom: 'error' };
        const result = toAppError(unknownError);

        expect(result).toBeInstanceOf(InternalServerError);
        expect(result.message).toBe('An unexpected error occurred');
        expect(result.details).toEqual({ error: unknownError });
      });

      it('should convert strings to an InternalServerError', () => {
        const result = toAppError('String error message');

        expect(result).toBeInstanceOf(InternalServerError);
        expect(result.message).toBe('An unexpected error occurred');
        expect(result.details).toEqual({ error: 'String error message' });
      });
    });
  });
});
