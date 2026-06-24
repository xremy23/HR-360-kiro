import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSecurityConfig } from '../config/security';
import { sessionService } from '../services/sessionService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    orgId: string;
    teamId?: string;
    biometricEnabled?: boolean;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
        statusCode: 401,
      });
    }

    // Get security configuration
    const securityConfig = getSecurityConfig();

    // Decode token to get token ID for blacklist check
    let decoded: any;
    try {
      decoded = jwt.verify(token, securityConfig.jwtSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
        statusCode: 401,
      });
    }

    // Check if token is blacklisted
    const tokenId = decoded.jti || `${decoded.id}_${decoded.iat}`;
    const isBlacklisted = await sessionService.isTokenBlacklisted(tokenId);
    
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token has been revoked',
        },
        statusCode: 401,
      });
    }

    // Update session activity if session exists
    const sessionId = `session_${decoded.id}`;
    await sessionService.updateSessionActivity(sessionId);

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
      statusCode: 401,
    });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!['super_admin', 'admin', 'hr_admin', 'hr'].includes(req.user?.role || '')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
      statusCode: 403,
    });
  }
  next();
};

export const superAdminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Super admin access required',
      },
      statusCode: 403,
    });
  }
  next();
};

export const managerMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!['super_admin', 'admin', 'hr_admin', 'hr', 'manager'].includes(req.user?.role || '')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Manager access required',
      },
      statusCode: 403,
    });
  }
  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      // No token, just continue as guest
      next();
      return;
    }

    // Get security configuration
    const securityConfig = getSecurityConfig();

    // Decode token to get token ID for blacklist check
    let decoded: any;
    try {
      decoded = jwt.verify(token, securityConfig.jwtSecret);
    } catch (error) {
      // Invalid token, just continue as guest
      next();
      return;
    }

    // Check if token is blacklisted
    const tokenId = decoded.jti || `${decoded.id}_${decoded.iat}`;
    const isBlacklisted = await sessionService.isTokenBlacklisted(tokenId);
    
    if (isBlacklisted) {
      // Token revoked, continue as guest
      next();
      return;
    }

    // Update session activity if session exists
    const sessionId = `session_${decoded.id}`;
    await sessionService.updateSessionActivity(sessionId);

    req.user = decoded;
    next();
  } catch (error) {
    // Error processing token, continue as guest
    console.debug('Optional auth error, continuing as guest:', error);
    next();
  }
};
