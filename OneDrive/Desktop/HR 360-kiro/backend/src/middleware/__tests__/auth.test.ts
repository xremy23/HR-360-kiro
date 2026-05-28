/**
 * Auth Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, adminMiddleware, managerMiddleware, AuthRequest } from '../auth';
import { sessionService } from '../../services/sessionService';

// Mock jwt
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock sessionService
jest.mock('../../services/sessionService', () => ({
  sessionService: {
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    updateSessionActivity: jest.fn().mockResolvedValue(true),
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: undefined,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should reject request with no authorization header', async () => {
      mockReq.headers = {};

      await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      mockReq.headers = {
        authorization: 'InvalidFormat',
      };

      await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token',
      };

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed',
        },
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      mockReq.headers = {
        authorization: 'Bearer expired-token',
      };

      mockedJwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed',
        },
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing Bearer prefix', async () => {
      mockReq.headers = {
        authorization: 'token-without-bearer',
      };

      await authMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
        statusCode: 401,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    it('should allow admin user', () => {
      mockReq.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        orgId: 'org-123',
      };

      adminMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow hr user', () => {
      mockReq.user = {
        id: 'hr-123',
        email: 'hr@example.com',
        role: 'hr',
        orgId: 'org-123',
      };

      adminMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject manager user', () => {
      mockReq.user = {
        id: 'manager-123',
        email: 'manager@example.com',
        role: 'manager',
        orgId: 'org-123',
      };

      adminMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject employee user', () => {
      mockReq.user = {
        id: 'employee-123',
        email: 'employee@example.com',
        role: 'employee',
        orgId: 'org-123',
      };

      adminMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with no user', () => {
      mockReq.user = undefined;

      adminMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('managerMiddleware', () => {
    it('should allow admin user', () => {
      mockReq.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        orgId: 'org-123',
      };

      managerMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow hr user', () => {
      mockReq.user = {
        id: 'hr-123',
        email: 'hr@example.com',
        role: 'hr',
        orgId: 'org-123',
      };

      managerMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow manager user', () => {
      mockReq.user = {
        id: 'manager-123',
        email: 'manager@example.com',
        role: 'manager',
        orgId: 'org-123',
      };

      managerMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject employee user', () => {
      mockReq.user = {
        id: 'employee-123',
        email: 'employee@example.com',
        role: 'employee',
        orgId: 'org-123',
      };

      managerMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Manager access required',
        },
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with no user', () => {
      mockReq.user = undefined;

      managerMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Manager access required',
        },
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid role', () => {
      mockReq.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'invalid-role',
        orgId: 'org-123',
      };

      managerMiddleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Manager access required',
        },
        statusCode: 403,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});