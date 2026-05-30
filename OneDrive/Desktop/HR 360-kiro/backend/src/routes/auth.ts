import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { validateEmail } from '../utils/validators';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { UserEntity } from '../entities/User';
import { OrganizationEntity } from '../entities/Organization';
import { MagicLinkTokenEntity } from '../entities/MagicLinkToken';
import { getSecurityConfig } from '../config/security';
import { sessionService } from '../services/sessionService';
import emailService from '../services/emailService';

const router = Router();

/**
 * Generate a signed magic link token that includes email and timestamp
 * Token format: base64(email:timestamp:signature)
 * This works without database/Redis because the email and timestamp are embedded in the token
 */
function generateSignedMagicToken(email: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${email}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 16); // Use first 16 chars of signature
  
  const token = `${payload}:${signature}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Verify a signed magic link token
 * Returns email if valid, null if invalid or expired
 */
function verifySignedMagicToken(token: string, secret: string, expirationMinutes: number = 15): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return null;
    }
    
    const [email, timestamp, signature] = parts;
    const tokenTimestamp = parseInt(timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const maxAge = expirationMinutes * 60;
    
    // Check expiration
    if (currentTimestamp - tokenTimestamp > maxAge) {
      console.warn(`Token expired for ${email}`);
      return null;
    }
    
    // Verify signature
    const payload = `${email}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .slice(0, 16);
    
    if (signature !== expectedSignature) {
      console.warn(`Invalid signature for token`);
      return null;
    }
    
    return email;
  } catch (error) {
    console.error('Error verifying signed token:', error);
    return null;
  }
}

/**
 * POST /auth/send-magic-link
 * Send magic link to email for passwordless login
 */
router.post('/send-magic-link', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    // Get security config for token signing
    const securityConfig = getSecurityConfig();
    
    // Generate signed magic token (includes email and timestamp, no DB needed)
    const magicToken = generateSignedMagicToken(email, securityConfig.jwtSecret);
    
    // Create magic link - point to /login route with query params
    const frontendUrl = process.env.FRONTEND_URL || 'https://web-116253736511.us-central1.run.app';
    const magicLink = `${frontendUrl}/login?token=${magicToken}&email=${encodeURIComponent(email)}`;

    console.log(`✅ Signed magic link generated for ${email}`);

    // Send email with magic link (non-blocking - fire and forget)
    // This prevents the request from hanging if email service is slow
    emailService.sendMagicLink(email, magicLink).catch((error) => {
      console.error(`⚠️  Failed to send magic link email to ${email}:`, error);
    });

    // Always return immediately with link for testing
    // User can use link from console/email
    return sendSuccess(res, { email, magicLink, message: 'Magic link generated and sent' }, 'Magic link sent - check email or console', 200);
  } catch (error) {
    console.error('Send magic link error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to send magic link', 500);
  }
});

/**
 * POST /auth/verify-magic-link
 * Verify magic link and create session
 */
router.post('/verify-magic-link', async (req: AuthRequest, res: Response) => {
  try {
    const { email, token } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    if (!token) {
      return sendError(res, 'INVALID_TOKEN', 'Magic link token required', 400);
    }

    // Get security config for token verification
    const securityConfig = getSecurityConfig();
    
    // Verify the signed token (works without DB/Redis)
    const verifiedEmail = verifySignedMagicToken(token, securityConfig.jwtSecret, 15);
    
    if (!verifiedEmail || verifiedEmail !== email) {
      console.warn(`❌ Token verification failed for ${email}`);
      return sendError(res, 'INVALID_TOKEN', 'Invalid or expired magic link', 400);
    }
    
    console.log(`✅ Signed magic link token verified for ${email}`);

    // Get or create user
    let user: any = null;
    try {
      try {
        user = await UserEntity.findByEmail(email);
      } catch (findError) {
        console.warn(`⚠️  Failed to find user by email, will create temporary user`, findError);
        user = null;
      }

      if (!user) {
        // Create new user with default organization
        try {
          const org = await OrganizationEntity.create({
            name: 'Personal Organization',
            emailDomain: email.split('@')[1],
            inviteCode: uuidv4().slice(0, 8).toUpperCase(),
          });

          // Check if this is the super-admin email
          const isSuperAdmin = email === 'carinojeremy23@gmail.com';

          user = await UserEntity.create({
            email,
            firstName: '',
            lastName: '',
            role: isSuperAdmin ? 'super_admin' : 'employee',
            orgId: org.id,
            biometricEnabled: false,
          });
          console.log(`✅ Created new user for ${email} with role: ${isSuperAdmin ? 'super_admin' : 'employee'}`);
        } catch (createError) {
          console.error('Failed to create user in database:', createError);
          // Create a temporary user object for token generation (will be persisted on next login)
          const isSuperAdmin = email === 'carinojeremy23@gmail.com';
          user = {
            id: uuidv4(),
            email,
            firstName: '',
            lastName: '',
            role: isSuperAdmin ? 'super_admin' : 'employee',
            orgId: uuidv4(),
            teamId: null,
            biometricEnabled: false,
          };
          console.warn(`⚠️  Using temporary user object for ${email} (DB unavailable)`);
        }
      }

      // Ensure user object is valid
      if (!user || !user.id) {
        throw new Error('Failed to get or create valid user object');
      }
    } catch (error) {
      console.error('Failed to get or create user:', error);
      return sendError(res, 'SERVER_ERROR', 'Failed to process login', 500);
    }

    // Generate unique token ID for blacklist support
    const tokenId = uuidv4();
    const issuedAt = Math.floor(Date.now() / 1000);

    // Generate JWT token with secure configuration
    let jwtToken: string;
    try {
      const tokenPayload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        orgId: user.orgId,
        teamId: user.teamId || null,
        biometricEnabled: user.biometricEnabled || false,
        jti: tokenId,
        iat: issuedAt,
      };
      
      jwtToken = jwt.sign(
        tokenPayload,
        securityConfig.jwtSecret,
        { expiresIn: securityConfig.jwtExpiresIn } as jwt.SignOptions
      );
      console.log(`✅ JWT token generated for ${email}`);
    } catch (jwtError) {
      console.error('Failed to generate JWT token:', jwtError);
      return sendError(res, 'SERVER_ERROR', 'Failed to generate authentication token', 500);
    }

    // Store session data (with error handling)
    const sessionId = `session_${user.id}`;
    try {
      await sessionService.storeSession(sessionId, {
        userId: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        teamId: user.teamId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      });
      console.log(`✅ Session stored for ${email}`);
    } catch (sessionError) {
      console.warn(`⚠️  Failed to store session, but continuing with token`, sessionError);
      // Don't fail the entire request if session storage fails - token is the critical part
    }

    return sendSuccess(
      res,
      {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
          orgId: user.orgId,
          teamId: user.teamId,
          biometricEnabled: user.biometricEnabled || false,
        },
      },
      'Magic link verified successfully',
      200
    );
  } catch (error) {
    console.error('Verify magic link error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to verify magic link', 500);
  }
});

/**
 * POST /auth/send-verification
 * Send verification code to email (DEPRECATED - use send-magic-link instead)
 */
router.post('/send-verification', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    // Generate verification code
    const code = Math.random().toString().slice(2, 8);
    
    // Store verification code in Redis with 10-minute expiration
    await sessionService.storeVerificationCode(email, code, 10);

    // Send email with verification code
    const emailSent = await emailService.sendVerificationCode(email, code);
    
    if (!emailSent) {
      console.warn(`⚠️  Email service not available. Verification code for ${email}: ${code}`);
      // Return code in response for development/testing
      return sendSuccess(res, { email, code, message: 'Email service unavailable - code shown for testing' }, 'Verification code generated (check console or use code below)', 200);
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

    // Verify code using Redis-based session service
    let isValidCode = false;
    try {
      isValidCode = await sessionService.verifyCode(email, code);
    } catch (redisError) {
      console.warn('Redis not available, accepting any 6-digit code for testing');
      // In development without Redis, accept any 6-digit code
      isValidCode = /^\d{6}$/.test(code);
    }

    if (!isValidCode) {
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

    // Get security configuration
    const securityConfig = getSecurityConfig();

    // Generate unique token ID for blacklist support
    const tokenId = uuidv4();
    const issuedAt = Math.floor(Date.now() / 1000);

    // Generate JWT token with secure configuration
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      teamId: user.teamId,
      jti: tokenId, // JWT ID for blacklist support
      iat: issuedAt,
    };
    
    // Generate JWT token with secure configuration
    const token = jwt.sign(
      tokenPayload,
      securityConfig.jwtSecret,
      { expiresIn: securityConfig.jwtExpiresIn } as jwt.SignOptions
    );

    // Store session data in Redis
    const sessionId = `session_${user.id}`;
    await sessionService.storeSession(sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      teamId: user.teamId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

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
router.post('/refresh-token', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    // Get security configuration
    const securityConfig = getSecurityConfig();

    // Generate new token ID for blacklist support
    const tokenId = uuidv4();
    const issuedAt = Math.floor(Date.now() / 1000);

    const tokenPayload = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      orgId: req.user.orgId,
      teamId: req.user.teamId,
      jti: tokenId,
      iat: issuedAt,
    };

    const newToken = jwt.sign(
      tokenPayload,
      securityConfig.jwtSecret,
      { expiresIn: securityConfig.jwtExpiresIn } as jwt.SignOptions
    );

    // Update session activity
    const sessionId = `session_${req.user.id}`;
    await sessionService.updateSessionActivity(sessionId);

    return sendSuccess(res, { token: newToken }, 'Token refreshed successfully', 200);
  } catch (error) {
    console.error('Refresh token error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to refresh token', 500);
  }
});

/**
 * POST /auth/logout
 * Logout user and blacklist token
 */
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'User not found', 401);
    }

    // Extract token from request
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.jti) {
          // Calculate remaining token lifetime for blacklist expiration
          const now = Math.floor(Date.now() / 1000);
          const expiresIn = decoded.exp - now;
          
          if (expiresIn > 0) {
            // Add token to blacklist for remaining lifetime
            await sessionService.blacklistToken(decoded.jti, expiresIn);
          }
        }
      } catch (error) {
        console.warn('Failed to blacklist token on logout:', error);
      }
    }

    // Delete session
    const sessionId = `session_${req.user.id}`;
    await sessionService.deleteSession(sessionId);

    return sendSuccess(res, {}, 'Logged out successfully', 200);
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to logout', 500);
  }
});

/**
 * GET /auth/test-code/:email
 * Development only: Get verification code for testing
 */
router.get('/test-code/:email', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.params;

    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 'FORBIDDEN', 'This endpoint is only available in development', 403);
    }

    if (!email || !validateEmail(email)) {
      return sendError(res, 'INVALID_EMAIL', 'Invalid email format', 400);
    }

    // Generate verification code
    const code = Math.random().toString().slice(2, 8);
    
    // Try to store in Redis, but if it fails, just return the code
    try {
      await sessionService.storeVerificationCode(email, code, 10);
    } catch (redisError) {
      console.warn('Redis not available, but returning code for testing:', code);
      // Continue anyway - code will be returned for manual testing
    }

    return sendSuccess(res, { email, code, message: 'Use this code to login' }, 'Test verification code generated', 200);
  } catch (error) {
    console.error('Test code error:', error);
    return sendError(res, 'SERVER_ERROR', 'Failed to generate test code', 500);
  }
});

export default router;
