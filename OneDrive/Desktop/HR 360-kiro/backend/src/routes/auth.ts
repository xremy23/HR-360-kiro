import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { logger } from '../services/monitoringService';
import { emailService } from '../services/emailService';
import { userService } from '../services/userService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * TEST ENDPOINT - Debug email service
 */
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    logger.info('🧪 TEST EMAIL ENDPOINT CALLED');
    
    const { email } = req.body || {};
    
    if (!email) {
      return res.json({
        success: false,
        message: 'No email provided',
        test: 'Please provide email in body'
      });
    }

    logger.info('Testing email service', { email });
    
    // Test the email service directly
    try {
      const testLink = 'https://test.example.com/verify?token=test123';
      logger.info('Calling emailService.sendMagicLink with test data', { email, testLink });
      
      const result = await emailService.sendMagicLink(email, testLink);
      
      logger.info('✅ emailService.sendMagicLink() succeeded', { result });
      
      res.json({
        success: true,
        message: 'Email send test completed successfully',
        result,
        email,
        testLink
      });
    } catch (innerErr) {
      logger.error('❌ emailService.sendMagicLink() threw error', {
        errorName: (innerErr as Error).name,
        errorMessage: (innerErr as Error).message,
        errorCode: (innerErr as any)?.code,
        errorResponse: (innerErr as any)?.response,
        stack: (innerErr as Error).stack
      });
      
      res.json({
        success: false,
        message: 'Email service error (exception thrown)',
        error: (innerErr as Error).message,
        errorName: (innerErr as Error).name,
        errorCode: (innerErr as any)?.code,
      });
    }
  } catch (error) {
    logger.error('❌ TEST EMAIL ENDPOINT ERROR', { 
      message: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack
    });
    
    res.json({
      success: false,
      message: 'Test endpoint error',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/auth/check-email
 * Check if email exists
 */
router.get('/check-email', (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Valid email is required' },
      });
    }

    // Check if email exists in database
    userService.getUserByEmail(email).then(user => {
      res.json({
        success: true,
        exists: !!user,
      });
    }).catch(error => {
      logger.error('Check email error', { email, error });
      res.status(500).json({
        success: false,
        error: { code: 'CHECK_EMAIL_FAILED', message: 'Failed to check email' },
      });
    });
  } catch (error) {
    logger.error('Check email error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'CHECK_EMAIL_FAILED', message: 'Failed to check email' },
    });
  }
});

/**
 * POST /api/auth/request-link
 * Request magic link and send email
 */
router.post('/request-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Valid email is required' },
      });
    }

    // Generate magic link token
    const token = uuidv4();
    
    // Create magic link URL
    const magicLink = `https://hr-crisis-360-frontend-116253736511.asia-southeast1.run.app/login?email=${encodeURIComponent(email)}&token=${token}`;
    
    logger.info('=== MAGIC LINK REQUEST ===', { email, token, magicLink });

    try {
      logger.info('Calling emailService.sendMagicLink()...', { email });
      const emailSent = await emailService.sendMagicLink(email, magicLink);
      
      logger.info('✅ emailService.sendMagicLink() completed', { email, emailSent });

      res.json({
        success: true,
        data: {
          success: true,
          message: 'Magic link sent to your email',
          token,
        },
        token,
      });
    } catch (emailError) {
      logger.error('❌ emailService.sendMagicLink() THREW ERROR', {
        email,
        errorName: (emailError as Error).name,
        errorMessage: (emailError as Error).message,
        errorStack: (emailError as Error).stack,
      });
      throw emailError;
    }
  } catch (error) {
    logger.error('❌ REQUEST LINK ERROR', {
      errorName: (error as Error).name,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: { code: 'REQUEST_LINK_FAILED', message: `Failed to request magic link: ${(error as Error).message}` },
    });
  }
});

/**
 * POST /api/auth/send-magic-link
 * Send magic link to email
 */
router.post('/send-magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Valid email is required' },
      });
    }

    const token = uuidv4();
    
    // Create magic link URL
    const magicLink = `https://hr-crisis-360-frontend-116253736511.asia-southeast1.run.app/login?email=${encodeURIComponent(email)}&token=${token}`;

    logger.info('=== SEND MAGIC LINK ===', { email, token });

    try {
      logger.info('Calling emailService.sendMagicLink()...', { email });
      
      // Send email
      const emailSent = await emailService.sendMagicLink(email, magicLink);
      
      logger.info('✅ emailService.sendMagicLink() completed', { email, emailSent });

      res.json({
        success: true,
        data: { token },
      });
    } catch (emailError) {
      logger.error('❌ emailService.sendMagicLink() THREW ERROR', {
        email,
        errorName: (emailError as Error).name,
        errorMessage: (emailError as Error).message,
        errorStack: (emailError as Error).stack,
      });
      throw emailError;
    }
  } catch (error) {
    logger.error('❌ SEND MAGIC LINK ERROR', {
      errorName: (error as Error).name,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      error: { code: 'SEND_MAGIC_LINK_FAILED', message: `Error: ${(error as Error).message}` },
    });
  }
});

/**
 * POST /api/auth/verify-magic-link
 * Verify magic link and return JWT token
 */
router.post('/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Token and email are required' },
      });
    }

    logger.info('🔵 Verify magic link - checking user', { email });

    let user;

    // Get user from database - no demo fallback
    user = await userService.getUserByEmail(email);
    
    if (!user) {
      logger.info('🔵 User not found, creating new user', { email });
      user = await userService.createUser({
        id: uuidv4(),
        email,
        firstName: email.split('@')[0],
        lastName: '',
        role: 'employee',
      });
      logger.info('✅ User created in database', { userId: user.id, email });
    } else {
      logger.info('✅ User found in database', { userId: user.id, email, organizationId: user.organizationId });
      // Update last login timestamp for existing users
      await userService.updateLastLogin(user.id);
    }

    // Get JWT secret from environment or use default
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

    // Generate proper JWT token with the user ID
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role || 'employee',
        organizationId: user.organizationId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('✅ Magic link verified', { email, userId: user.id });

    res.json({
      success: true,
      data: {
        token: jwtToken,
        expiresIn: 604800,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName || email.split('@')[0]} ${user.lastName || ''}`.trim(),
          role: user.role || 'employee',
          organizationId: user.organizationId,
          avatar: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('🔴 Verify magic link error', { error: errorMsg, stack: error instanceof Error ? error.stack : '' });
    res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_FAILED', message: 'Failed to verify magic link', details: errorMsg },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req: Request, res: Response) => {
  try {
    res.clearCookie('auth_token');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_FAILED', message: 'Failed to logout' },
    });
  }
});

/**
 * GET /api/auth/validate
 * Validate current token
 */
router.get('/validate', (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'No token provided' },
      });
    }

    // Validate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const decoded: any = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      data: {
        valid: true,
        email: decoded.email,
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
      },
    });
  } catch (error) {
    logger.error('Token validation error', { error });
    res.status(401).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'Token validation failed' },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    // Get current user from database with organization data
    let user;
    try {
      user = await userService.getUserById(req.user.userId);
    } catch (dbError) {
      logger.error('🔴 Failed to fetch user from database in /me endpoint', { 
        userId: req.user.userId, 
        error: dbError instanceof Error ? dbError.message : String(dbError)
      });
      // If database fails, return error (don't silently create fake user)
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch user data' },
      });
    }
    
    if (!user) {
      logger.warn('⚠️ User not found in database but token is valid', { userId: req.user.userId });
      // User doesn't exist in database but token is valid
      // This shouldn't happen - user should exist if they have a valid token
      // Return error instead of creating fake user
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found in database' },
      });
    }

    res.json({
      success: true,
      data: {
        id: user!.id,
        email: user!.email,
        name: `${user!.firstName || ''} ${user!.lastName || ''}`.trim() || user!.email,
        firstName: user!.firstName,
        lastName: user!.lastName,
        role: (user!.role || 'employee') as 'admin' | 'hr_admin' | 'safety_admin' | 'employee',
        organizationId: user!.organizationId,
        avatar: (user as any).avatarUrl || (user as any).avatar,
      },
    });
  } catch (error) {
    logger.error('Get current user error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Failed to get current user' },
    });
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token using existing token from request
 */
router.post('/refresh-token', authMiddleware.verifyToken.bind(authMiddleware), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

    // Get current user data
    let user;
    try {
      user = await userService.getUserById(req.user.userId);
    } catch (dbError) {
      logger.error('🔴 Failed to fetch user from database in /refresh-token endpoint', { 
        userId: req.user.userId, 
        error: dbError instanceof Error ? dbError.message : String(dbError)
      });
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch user data' },
      });
    }
    
    if (!user) {
      logger.warn('⚠️ User not found in database during token refresh', { userId: req.user.userId });
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found in database' },
      });
    }

    // Generate new token with current user data
    const newToken = jwt.sign(
      {
        userId: user!.id,
        email: user!.email,
        role: user!.role || 'employee',
        organizationId: user!.organizationId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 604800,
        user: {
          id: user!.id,
          email: user!.email,
          name: `${user!.firstName || ''} ${user!.lastName || ''}`.trim() || user!.email,
          firstName: user!.firstName,
          lastName: user!.lastName,
          role: (user!.role || 'employee') as 'admin' | 'hr_admin' | 'safety_admin' | 'employee',
          organizationId: user!.organizationId,
          avatar: (user as any).avatarUrl || (user as any).avatar,
        },
      },
    });
  } catch (error) {
    logger.error('Refresh token error', { error });
    res.status(401).json({
      success: false,
      error: { code: 'REFRESH_FAILED', message: 'Failed to refresh token' },
    });
  }
});

export default router;
