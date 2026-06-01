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
  async sendMagicLink(email: string, appUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      // Generate unique token
      const token = uuidv4();
      const expiresAt = Date.now() + this.MAGIC_LINK_EXPIRY;

      // Store token in Redis with expiry
      const magicLinkKey = `magic_link:${token}`;
      await sessionService.set(magicLinkKey, JSON.stringify({ email, expiresAt }), this.MAGIC_LINK_EXPIRY / 1000);

      // Generate magic link URL
      const magicLink = `${appUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;

      // Send email
      await emailService.sendMagicLink(email, magicLink);

      logger.info('Magic link sent', { email });

      return {
        success: true,
        message: 'Magic link sent to your email',
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
      // Retrieve token from Redis
      const magicLinkKey = `magic_link:${token}`;
      const storedData = await sessionService.get(magicLinkKey);

      if (!storedData) {
        throw new Error('Invalid or expired magic link');
      }

      const { email: storedEmail, expiresAt } = JSON.parse(storedData);

      // Verify email matches
      if (storedEmail !== email) {
        throw new Error('Email mismatch');
      }

      // Verify not expired
      if (Date.now() > expiresAt) {
        throw new Error('Magic link expired');
      }

      // Delete used token
      await sessionService.delete(magicLinkKey);

      // Get or create user
      let user = await userService.getUserByEmail(email);
      
      if (!user) {
        // Create new user as guest
        user = await userService.createUser({
          email,
          role: 'guest',
        });
        logger.info('New user created', { email, userId: user.id });
      } else {
        // Update last login
        await userService.updateLastLogin(user.id);
      }

      // Create JWT token
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRY }
      );

      // Store session
      const sessionKey = `session:${jwtToken}`;
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

      logger.info('Magic link verified', { email, userId: user.id });

      return {
        token: jwtToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        user: {
          id: user.id,
          email: user.email,
          name: user instanceof UserEntity ? user.getFullName() : user.email,
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
}

export const authService = new AuthService();
