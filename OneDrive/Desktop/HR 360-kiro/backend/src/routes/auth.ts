import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { validateEmail } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Mock database for demo (replace with actual database calls)
const users: any = {};
const verificationCodes: any = {};
const organizations: any = {};

/**
 * POST /auth/send-verification
 * Send verification code to email
 */
router.post('/send-verification', (req: AuthRequest, res: Response) => {
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

    // TODO: Send email with verification code
    console.log(`Verification code for ${email}: ${code}`);

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
router.post('/verify-email', (req: AuthRequest, res: Response) => {
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
    let user = users[email];
    if (!user) {
      user = {
        id: uuidv4(),
        email,
        firstName: '',
        lastName: '',
        role: 'employee',
        orgId: '',
        biometricEnabled: false,
        emergencyContacts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users[email] = user;
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
          emergencyContacts: user.emergencyContacts,
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
router.post('/join-org', (req: AuthRequest, res: Response) => {
  try {
    const { email, inviteCode, emailDomain } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    if (!inviteCode) {
      return sendError(res, 'INVALID_CODE', 'Invite code required', 400);
    }

    // TODO: Validate invite code and get organization
    // For now, create a mock organization
    const orgId = uuidv4();
    organizations[orgId] = {
      id: orgId,
      name: 'Sample Organization',
      emailDomain: emailDomain || 'example.com',
      inviteCode,
      createdAt: new Date(),
    };

    // Update user with organization
    if (users[email]) {
      users[email].orgId = orgId;
    }

    return sendSuccess(
      res,
      {
        orgId,
        orgName: organizations[orgId].name,
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
