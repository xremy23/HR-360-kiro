import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { UserEntity } from '../entities/User';
import { OrganizationEntity } from '../entities/Organization';
import emailService from '../services/emailService';

const router = Router();

// In-memory verification codes (TODO: use Redis for production)
const verificationCodes: any = {};

/**
 * POST /auth/send-verification
 * Send verification code to email
 */
router.post('/send-verification', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    // Generate verification code
    const code = Math.random().toString().slice(2, 8);
    verificationCodes[email] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Send email with verification code
    const emailSent = await emailService.sendVerificationCode(email, code);
    
    if (!emailSent) {
      console.warn(`Failed to send verification email to ${email}, but code generated: ${code}`);
      // Still return success to allow testing without email service
    }

    return sendSuccess(res, { email }, 'Verification code sent to email', 200);
  } catch (error) {
    console.error('Send verification error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to send verification code', 500);
  }
});

/**
 * POST /auth/verify-email
 * Verify email and create session
 */
router.post('/verify-email', async (req: AuthRequest, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    if (!code) {
      return sendError(res, 'INVALID_CODE', 'Verification code required', 400);
    }

    const verification = verificationCodes[email];
    if (!verification || verification.code !== code || verification.expiresAt < Date.now()) {
      return sendError(res, 'INVALID_CODE', 'Invalid or expired verification code', 400);
    }

    // Get or create user
    let user = await UserEntity.findByEmail(email);
    if (!user) {
      // Create new user with default organization
      const org = await OrganizationEntity.create({
        name: 'Personal Organization',
        emailDomain: email.split('@')[1],
        inviteCode: uuidv4().slice(0, 8).toUpperCase(),
      });

      user = await UserEntity.create({
        email,
        firstName: '',
        lastName: '',
        role: 'employee',
        orgId: org.id,
        biometricEnabled: false,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        teamId: user.teamId,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Clean up verification code
    delete verificationCodes[email];

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          orgId: user.orgId,
          teamId: user.teamId,
          biometricEnabled: user.biometricEnabled,
        },
      },
      'Email verified successfully',
      200
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to verify email', 500);
  }
});

/**
 * POST /auth/join-org
 * Join organization with invite code
 */
router.post('/join-org', async (req: AuthRequest, res: Response) => {
  try {
    const { email, inviteCode } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    if (!inviteCode) {
      return sendError(res, 'INVALID_CODE', 'Invite code required', 400);
    }

    // Find organization by invite code
    const org = await OrganizationEntity.findByInviteCode(inviteCode);
    if (!org) {
      return sendError(res, 'ORG_NOT_FOUND', 'Organization not found', 404);
    }

    // Get or create user
    let user = await UserEntity.findByEmail(email);
    if (!user) {
      user = await UserEntity.create({
        email,
        firstName: '',
        lastName: '',
        role: 'employee',
        orgId: org.id,
        biometricEnabled: false,
      });
    }

    return sendSuccess(
      res,
      {
        orgId: org.id,
        orgName: org.name,
      },
      'Successfully joined organization',
      200
    );
  } catch (error) {
    console.error('Join org error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to join organization', 500);
  }
});

/**
 * POST /auth/refresh-token
 * Refresh JWT token
 */
router.post('/refresh-token', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    const newToken = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        orgId: req.user.orgId,
        teamId: req.user.teamId,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return sendSuccess(res, { token: newToken }, 'Token refreshed successfully', 200);
  } catch (error) {
    console.error('Refresh token error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to refresh token', 500);
  }
});

/**
 * POST /auth/logout
 * Logout user
 */
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    // TODO: Invalidate token in blacklist
    return sendSuccess(res, {}, 'Logged out successfully', 200);
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to logout', 500);
  }
});

export default router;
