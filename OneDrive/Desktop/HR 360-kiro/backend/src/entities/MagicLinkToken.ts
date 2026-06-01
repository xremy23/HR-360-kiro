/**
 * Magic Link Token Entity
 * Stores temporary magic link tokens for passwordless authentication
 */

import { query } from '../config/database';

export interface MagicLinkToken {
  id: string;
  email: string;
  token: string;
  expiresAt: number;
  attempts: number;
  createdAt: Date;
  usedAt?: Date;
}

// Ensure table exists on first use
let tableInitialized = false;

async function ensureTableExists() {
  if (tableInitialized) return;
  
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS magic_link_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP,
        INDEX idx_email_token (email, token),
        INDEX idx_expires_at (expires_at)
      )`
    );
    tableInitialized = true;
    console.log('✅ Magic link tokens table ensured');
  } catch (error) {
    console.error('❌ Failed to create magic_link_tokens table:', error);
    // Mark as attempted but not initialized to try again next time
    tableInitialized = false;
    // Don't fail, let the entity methods handle db errors
  }
}

export class MagicLinkTokenEntity {
  /**
   * Create a new magic link token
   */
  static async create(
    email: string,
    token: string,
    expirationMinutes: number = 15
  ): Promise<MagicLinkToken> {
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);

    try {
      await ensureTableExists();
      
      const result = await query(
        `INSERT INTO magic_link_tokens (email, token, expires_at, attempts, created_at)
         VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
         RETURNING id, email, token, expires_at as "expiresAt", attempts, created_at as "createdAt"`,
        [email, token, new Date(expiresAt)]
      );
      console.log(`✅ Magic link token created in database for ${email}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to store magic link token in database:', error);
      throw error; // Propagate the error so caller can use fallback
    }
  }

  /**
   * Find and verify a magic link token
   */
  static async verify(email: string, token: string): Promise<boolean> {
    try {
      await ensureTableExists();
      
      const result = await query(
        `SELECT id, email, token, expires_at as "expiresAt", attempts, created_at as "createdAt"
         FROM magic_link_tokens
         WHERE email = $1 AND token = $2 AND expires_at > NOW()`,
        [email, token]
      );

      if (result.rows.length === 0) {
        console.log(`⚠️  Magic link token not found or expired for ${email}`);
        return false;
      }

      const record = result.rows[0];

      // Check attempts
      if (record.attempts >= 3) {
        console.warn(`⚠️  Too many attempts for token ${email}`);
        await this.delete(email, token);
        return false;
      }

      // Increment attempts
      await query(
        `UPDATE magic_link_tokens SET attempts = attempts + 1 WHERE email = $1 AND token = $2`,
        [email, token]
      );

      console.log(`✅ Magic link token verified for ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to verify magic link token:', error);
      return false;
    }
  }

  /**
   * Delete a magic link token after successful verification
   */
  static async delete(email: string, token: string): Promise<void> {
    try {
      await query(
        `DELETE FROM magic_link_tokens WHERE email = $1 AND token = $2`,
        [email, token]
      );
    } catch (error) {
      console.error('Failed to delete magic link token:', error);
    }
  }

  /**
   * Clean up expired tokens (call periodically)
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM magic_link_tokens WHERE expires_at < NOW()`
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup expired magic link tokens:', error);
      return 0;
    }
  }

  /**
   * Get token for testing (dev only)
   */
  static async getForTesting(email: string): Promise<string | null> {
    try {
      const result = await query(
        `SELECT token FROM magic_link_tokens
         WHERE email = $1 AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [email]
      );
      return result.rows[0]?.token || null;
    } catch (error) {
      console.error('Failed to get magic link token for testing:', error);
      return null;
    }
  }
}

export default MagicLinkTokenEntity;
