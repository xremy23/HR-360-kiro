import express, { Request, Response } from 'express';
import { authService } from '../services/authService';
import { logger } from '../services/monitoringService';

const router = express.Router();

/**
 * POST /api/auth/send-magic-link
 * Send magic link to email
 */
router.post('/send-magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Valid email is required',
        },
      });
    }

    // Get app URL from environment or request
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

    // Send magic link
    const result = await authService.sendMagicLink(email, appUrl);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Send magic link error', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_MAGIC_LINK_FAILED',
        message: 'Failed to send magic link',
      },
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

    // Validate inputs
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Token and email are required',
        },
      });
    }

    // Verify magic link
    const authToken = await authService.verifyMagicLink(token, email);

    // Set secure cookie (optional)
    res.cookie('auth_token', authToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: authToken.expiresIn * 1000,
    });

    res.json({
      success: true,
      data: {
        token: authToken.token,
        expiresIn: authToken.expiresIn,
        user: {
          id: authToken.user.id,
          email: authToken.user.email,
          name: authToken.user.name,
          role: authToken.user.role,
        },
      },
    });
  } catch (error: any) {
    logger.error('Verify magic link error', { error });

    const statusCode = error.message.includes('expired') ? 401 : 400;
    const code = error.message.includes('expired') ? 'LINK_EXPIRED' : 'VERIFICATION_FAILED';

    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: error.message || 'Failed to verify magic link',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token provided',
        },
      });
    }

    await authService.logout(token);

    // Clear cookie
    res.clearCookie('auth_token');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout',
      },
    });
  }
});

/**
 * GET /api/auth/validate
 * Validate current token
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No token provided',
        },
      });
    }

    const validation = await authService.validateToken(token);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired',
        },
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        email: validation.email,
      },
    });
  } catch (error) {
    logger.error('Token validation error', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Token validation failed',
      },
    });
  }
});

export default router;
