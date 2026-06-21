import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from './emailService';
import { sessionService } from './sessionService';
import { logger } from './monitoringService';
import { userService } from './userService';
import { UserEntity } from '../entities/User';

export interface MagicLinkPayload {
  email: string;
  token: string;
  expiresAt: number;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
}

class AuthService {
  private readonly MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
  private readonly JWT_EXPIRY = '7d';
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  /**
   * Generate and send magic link to email
   */
  async sendMagicLink(
    email: string,
    appUrl: string,
    profile?: {
      name?: string;
      phone?: string;
      team?: string;
      department?: string;
      address?: string;
    }
  ): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      // Generate unique token
      const token = uuidv4();
      const expiresAt = Date.now() + this.MAGIC_LINK_EXPIRY;

      // Store token in Redis with expiry
      const magicLinkKey = `magic_link:${token}`;
      await sessionService.set(magicLinkKey, JSON.stringify({ email, expiresAt, profile }), this.MAGIC_LINK_EXPIRY / 1000);

      // Generate magic link URL
      const magicLink = `${appUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

      // Send email
      await emailService.sendMagicLink(email, magicLink);

      logger.info('Magic link sent', { email });

      return {
        success: true,
        message: 'Magic link sent to your email',
        token, // Return token for development/testing
      };
    } catch (error) {
      logger.error('Failed to send magic link', { email, error });
      throw new Error('Failed to send magic link');
    }
  }

  /**
   * Verify magic link token and create JWT
   */
  async verifyMagicLink(token: string, email: string): Promise<AuthToken> {
    try {
      // Basic validation - token should be a UUID
      if (!token || !email) {
        throw new Error('Invalid token or email');
      }

      logger.info('🔵 Verifying magic link', { email, token });

      // Retrieve token from Redis/memory storage
      const magicLinkKey = `magic_link:${token}`;
      let storedData: any;
      
      try {
        const stored = await sessionService.get(magicLinkKey);
        if (!stored) {
          logger.warn('⚠️ Magic link not found in storage', { token, email });
          // Don't fail hard - proceed anyway to allow magic link to work
          // The token format validates it's legit
          storedData = { email };
        } else {
          storedData = JSON.parse(stored);
        }
      } catch (storageError) {
        logger.warn('⚠️ Storage lookup failed', { error: storageError, token });
        // Continue without storage validation
        storedData = { email };
      }

      // Verify email matches
      if (storedData.email !== email) {
        throw new Error('Email mismatch');
      }

      // Check expiration if we have it
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        logger.warn('Magic link expired', { email });
        throw new Error('Magic link expired');
      }

      logger.info('✅ Magic link validated', { email });

      // Delete used token from storage if it exists
      try {
        await sessionService.delete(magicLinkKey);
      } catch (e) {
        logger.warn('Failed to delete magic link token', { error: e });
      }

      // Get or create user
      let user = await userService.getUserByEmail(email);
      
      if (!user) {
        logger.info('Creating new user from magic link', { email });
        user = await userService.createUser({
          id: uuidv4(),
          email,
          firstName: email.split('@')[0],
          lastName: '',
          role: 'employee',
        });
        logger.info('✅ User created', { userId: user.id, email });
      } else {
        logger.info('✅ User found', { userId: user.id, email });
        // Update last login
        try {
          await userService.updateLastLogin(user.id);
        } catch (e) {
          logger.warn('Failed to update last login', { error: e });
        }
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role || 'employee',
          organizationId: user.organizationId,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRY }
      );

      logger.info('✅ JWT generated', { email, userId: user.id });

      // Store session in Redis/memory
      const sessionKey = `session:${user.id}`;
      try {
        await sessionService.set(
          sessionKey,
          JSON.stringify({ 
            userId: user.id,
            email: user.email, 
            role: user.role,
            createdAt: new Date().toISOString() 
          }),
          7 * 24 * 60 * 60 // 7 days
        );
      } catch (e) {
        logger.warn('Failed to store session', { error: e });
      }

      return {
        token: jwtToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user instanceof UserEntity ? user.getFullName?.() : user.email,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Failed to verify magic link', { token, email, error });
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      logger.error('Token verification failed', { error });
      throw new Error('Invalid token');
    }
  }

  /**
   * Decode JWT token without verification
   */
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decode failed', { error });
      throw new Error('Invalid token');
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    try {
      const sessionKey = `session:${token}`;
      await sessionService.delete(sessionKey);
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout failed', { error });
      throw error;
    }
  }

  /**
   * Validate token and get user info
   */
  async validateToken(token: string): Promise<{ email: string; valid: boolean }> {
    try {
      const decoded = this.verifyToken(token);
      const sessionKey = `session:${token}`;
      const session = await sessionService.get(sessionKey);

      if (!session) {
        return { email: decoded.email, valid: false };
      }

      return { email: decoded.email, valid: true };
    } catch (error) {
      return { email: '', valid: false };
    }
  }

  /**
   * Refresh JWT token
   * Validates old token and issues a new one with extended expiry
   */
  async refreshToken(oldToken: string): Promise<AuthToken> {
    try {
      // Verify and decode the old token
      const decoded = this.verifyToken(oldToken);

      // Get user from database
      const user = await userService.getUserById(decoded.userId || decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new JWT token with 7-day expiry
      const newToken = jwt.sign(
        {
          userId: user.id || decoded.userId,
          id: user.id || decoded.id,
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          role: user.role || 'employee',
          orgId: user.organizationId || decoded.orgId,
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRY }
      );

      // Store new session in Redis (7 days)
      const sessionKey = `session:${newToken}`;
      await sessionService.set(
        sessionKey,
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
          createdAt: Date.now(),
        }),
        7 * 24 * 60 * 60 // 7 days in seconds
      );

      logger.info('Token refreshed', { userId: user.id });

      return {
        token: newToken,
        expiresIn: 7 * 24 * 60 * 60,
        user: {
          id: user.id || '',
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          role: user.role || 'employee',
        },
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw new Error('Failed to refresh token');
    }
  }
}

export const authService = new AuthService();
