/**
 * Authentication Middleware
 * Protects routes and validates JWT tokens
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sessionService } from '../services/sessionService';
import { logger } from '../services/monitoringService';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  token?: string;
}

class AuthMiddleware {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  /**
   * Verify JWT token and attach user to request
   */
  async verifyToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'No authorization token provided',
          },
        });
        return;
      }

      const token = authHeader.substring(7);

      // Verify JWT signature
      interface DecodedToken {
        userId: string;
        email: string;
        role: string;
      }
      let decoded: DecodedToken;
      try {
        const verified = jwt.verify(token, this.JWT_SECRET);
        decoded = verified as DecodedToken;
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          res.status(401).json({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired',
            },
          });
          return;
        }

        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
          },
        });
        return;
      }

      // Check if token is blacklisted
      const isBlacklisted = await sessionService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_BLACKLISTED',
            message: 'Token has been revoked',
          },
        });
        return;
      }

      // Verify session exists
      const sessionKey = `session:${token}`;
      const session = await sessionService.get(sessionKey);
      if (!session) {
        res.status(401).json({
          success: false,
          error: {
            code: 'SESSION_INVALID',
            message: 'Session is invalid or expired',
          },
        });
        return;
      }

      // Update session activity
      await sessionService.updateSessionActivity(sessionKey);

      // Attach user to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      req.token = token;

      logger.info('Token verified', { userId: decoded.userId, email: decoded.email });

      next();
    } catch (error) {
      logger.error('Token verification error', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error',
        },
      });
    }
  }

  /**
   * Check if user has required role
   */
  requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Unauthorized role access', {
          userId: req.user.userId,
          requiredRoles: roles,
          userRole: req.user.role,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions for this action',
          },
        });
        return;
      }

      next();
    };
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  async optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);

      try {
        const verified = jwt.verify(token, this.JWT_SECRET);
        const decodedToken = verified as { userId: string; email: string; role: string };

        // Check if token is blacklisted
        const isBlacklisted = await sessionService.isTokenBlacklisted(token);
        if (!isBlacklisted) {
          req.user = {
            userId: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
          };
          req.token = token;
        }
      } catch (error) {
        // Silently fail - token is optional
        logger.debug('Optional auth token invalid', { error });
      }

      next();
    } catch (error) {
      logger.error('Optional auth error', { error });
      next();
    }
  }
}

export const authMiddleware = new AuthMiddleware();
