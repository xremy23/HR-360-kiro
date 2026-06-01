/**
 * Session Management Service
 * Handles verification codes, token blacklist, and session management using Redis
 */

import { createClient, RedisClientType } from 'redis';
import { getSecurityConfig } from '../config/security';

export interface VerificationCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  orgId: string;
  teamId?: string;
  createdAt: number;
  lastActivity: number;
}

class SessionService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private inMemoryStorage = new Map<string, string>();
  private inMemoryVerificationCodes = new Map<string, VerificationCode>();
  private inMemoryBlacklist = new Set<string>();
  private inMemorySessions = new Map<string, SessionData>();

  /**
   * Initialize Redis connection with timeout
   * Falls back to in-memory storage if Redis is unavailable
   */
  async initialize(): Promise<void> {
    try {
      const config = getSecurityConfig();
      
      this.client = createClient({
        socket: {
          host: config.redisConfig.host,
          port: config.redisConfig.port,
          connectTimeout: 5000, // 5 second timeout
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.warn('⚠️  Redis reconnection attempts exceeded, using in-memory storage');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 50, 500);
          },
        },
        password: config.redisConfig.password,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      // Try to connect with a timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
      );

      try {
        await Promise.race([connectPromise, timeoutPromise]);
      } catch (error) {
        console.warn('⚠️  Redis connection failed or timed out:', error);
        console.warn('⚠️  Falling back to in-memory session storage (NOT PRODUCTION SAFE)');
        this.client = null;
        this.isConnected = false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error);
      // Fallback to in-memory storage for development
      console.warn('⚠️  Falling back to in-memory session storage (NOT PRODUCTION SAFE)');
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Store a key-value pair with expiration
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    if (this.client && this.isConnected) {
      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } else {
      // Fallback to in-memory storage
      this.inMemoryStorage.set(key, value);
      if (expirationSeconds) {
        setTimeout(() => this.inMemoryStorage.delete(key), expirationSeconds * 1000);
      }
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    if (this.client && this.isConnected) {
      return await this.client.get(key);
    } else {
      // Fallback to in-memory storage
      return this.inMemoryStorage.get(key) || null;
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.del(key);
    } else {
      this.inMemoryStorage.delete(key);
    }
  }

  /**
   * Store verification code with expiration
   */
  async storeVerificationCode(email: string, code: string, expirationMinutes = 10): Promise<void> {
    const key = `verification:${email}`;
    const data: VerificationCode = {
      code,
      expiresAt: Date.now() + (expirationMinutes * 60 * 1000),
      attempts: 0,
    };

    if (this.client && this.isConnected) {
      await this.client.setEx(key, expirationMinutes * 60, JSON.stringify(data));
    } else {
      // Fallback to in-memory storage
      this.inMemoryVerificationCodes.set(key, data);
      setTimeout(() => this.inMemoryVerificationCodes.delete(key), expirationMinutes * 60 * 1000);
    }
  }

  /**
   * Verify and consume verification code
   */
  async verifyCode(email: string, code: string): Promise<boolean> {
    const key = `verification:${email}`;
    
    try {
      let data: VerificationCode | null = null;

      if (this.client && this.isConnected) {
        const stored = await this.client.get(key);
        data = stored ? JSON.parse(stored) : null;
      } else {
        // Fallback to in-memory storage
        data = this.inMemoryVerificationCodes.get(key) || null;
      }

      if (!data) {
        return false;
      }

      // Check expiration
      if (data.expiresAt < Date.now()) {
        await this.deleteVerificationCode(email);
        return false;
      }

      // Check attempts (prevent brute force)
      if (data.attempts >= 3) {
        await this.deleteVerificationCode(email);
        return false;
      }

      // Verify code
      if (data.code === code) {
        await this.deleteVerificationCode(email);
        return true;
      } else {
        // Increment attempts
        data.attempts++;
        if (this.client && this.isConnected) {
          await this.client.setEx(key, 600, JSON.stringify(data)); // 10 minutes
        } else {
          this.inMemoryVerificationCodes.set(key, data);
        }
        return false;
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return false;
    }
  }

  /**
   * Delete verification code
   */
  async deleteVerificationCode(email: string): Promise<void> {
    const key = `verification:${email}`;
    
    if (this.client && this.isConnected) {
      await this.client.del(key);
    } else {
      this.inMemoryVerificationCodes.delete(key);
    }
  }

  /**
   * Add token to blacklist
   */
  async blacklistToken(tokenId: string, expirationSeconds: number): Promise<void> {
    const key = `blacklist:${tokenId}`;
    
    if (this.client && this.isConnected) {
      await this.client.setEx(key, expirationSeconds, 'blacklisted');
    } else {
      // Fallback to in-memory storage
      this.inMemoryBlacklist.add(tokenId);
      setTimeout(() => this.inMemoryBlacklist.delete(tokenId), expirationSeconds * 1000);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    const key = `blacklist:${tokenId}`;
    
    if (this.client && this.isConnected) {
      const result = await this.client.get(key);
      return result !== null;
    } else {
      // Fallback to in-memory storage
      return this.inMemoryBlacklist.has(tokenId);
    }
  }

  /**
   * Store session data
   */
  async storeSession(sessionId: string, sessionData: SessionData, expirationHours = 24): Promise<void> {
    const key = `session:${sessionId}`;
    
    if (this.client && this.isConnected) {
      await this.client.setEx(key, expirationHours * 3600, JSON.stringify(sessionData));
    } else {
      // Fallback to in-memory storage
      this.inMemorySessions.set(key, sessionData);
      setTimeout(() => this.inMemorySessions.delete(key), expirationHours * 3600 * 1000);
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    
    try {
      if (this.client && this.isConnected) {
        const stored = await this.client.get(key);
        return stored ? JSON.parse(stored) : null;
      } else {
        // Fallback to in-memory storage
        return this.inMemorySessions.get(key) || null;
      }
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    
    if (this.client && this.isConnected) {
      await this.client.del(key);
    } else {
      this.inMemorySessions.delete(key);
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (sessionData) {
      sessionData.lastActivity = Date.now();
      await this.storeSession(sessionId, sessionData);
    }
  }

  /**
   * Clean up expired sessions (call periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    if (!this.client || !this.isConnected) {
      // Clean up in-memory storage
      const now = Date.now();
      for (const [key, data] of this.inMemorySessions.entries()) {
        if (now - data.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
          this.inMemorySessions.delete(key);
        }
      }
      return;
    }

    // Redis handles expiration automatically, but we can clean up manually if needed
    try {
      const keys = await this.client.keys('session:*');
      const now = Date.now();
      
      for (const key of keys) {
        const data = await this.client.get(key);
        if (data) {
          const sessionData: SessionData = JSON.parse(data);
          if (now - sessionData.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
            await this.client.del(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  }

  /**
   * Get connection status
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
