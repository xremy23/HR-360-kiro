import { query } from '../config/database';

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DeviceTokenEntity {
  /**
   * Create or update device token
   */
  static async upsert(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceName?: string
  ): Promise<DeviceToken> {
    const result = await query(
      `INSERT INTO device_tokens (user_id, token, platform, device_name, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, token) DO UPDATE SET
         is_active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id as "userId", token, platform, device_name as "deviceName", 
                 is_active as "isActive", last_used_at as "lastUsedAt", 
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, token, platform, deviceName || null]
    );
    return result.rows[0];
  }

  /**
   * Find device token by ID
   */
  static async findById(id: string): Promise<DeviceToken | null> {
    const result = await query(
      `SELECT id, user_id as "userId", token, platform, device_name as "deviceName", 
              is_active as "isActive", last_used_at as "lastUsedAt", 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM device_tokens WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find device tokens by user ID
   */
  static async findByUserId(userId: string, activeOnly: boolean = true): Promise<DeviceToken[]> {
    const result = await query(
      `SELECT id, user_id as "userId", token, platform, device_name as "deviceName", 
              is_active as "isActive", last_used_at as "lastUsedAt", 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM device_tokens 
       WHERE user_id = $1 ${activeOnly ? 'AND is_active = true' : ''}
       ORDER BY last_used_at DESC NULLS LAST`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Find device token by token string
   */
  static async findByToken(token: string): Promise<DeviceToken | null> {
    const result = await query(
      `SELECT id, user_id as "userId", token, platform, device_name as "deviceName", 
              is_active as "isActive", last_used_at as "lastUsedAt", 
              created_at as "createdAt", updated_at as "updatedAt"
       FROM device_tokens WHERE token = $1`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Update last used time
   */
  static async updateLastUsed(id: string): Promise<DeviceToken> {
    const result = await query(
      `UPDATE device_tokens 
       SET last_used_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING id, user_id as "userId", token, platform, device_name as "deviceName", 
                 is_active as "isActive", last_used_at as "lastUsedAt", 
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Deactivate device token
   */
  static async deactivate(id: string): Promise<DeviceToken> {
    const result = await query(
      `UPDATE device_tokens 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING id, user_id as "userId", token, platform, device_name as "deviceName", 
                 is_active as "isActive", last_used_at as "lastUsedAt", 
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Deactivate all tokens for user
   */
  static async deactivateAllForUser(userId: string): Promise<number> {
    const result = await query(
      `UPDATE device_tokens 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount || 0;
  }

  /**
   * Delete device token
   */
  static async delete(id: string): Promise<void> {
    await query('DELETE FROM device_tokens WHERE id = $1', [id]);
  }

  /**
   * Delete device token by token string
   */
  static async deleteByToken(token: string): Promise<void> {
    await query('DELETE FROM device_tokens WHERE token = $1', [token]);
  }

  /**
   * Delete inactive tokens older than days
   */
  static async deleteInactiveOlderThan(days: number): Promise<number> {
    const result = await query(
      `DELETE FROM device_tokens 
       WHERE is_active = false 
       AND updated_at < NOW() - INTERVAL '${days} days'`
    );
    return result.rowCount || 0;
  }

  /**
   * Get device count by platform
   */
  static async getCountByPlatform(userId: string): Promise<{
    ios: number;
    android: number;
    web: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(CASE WHEN platform = 'ios' THEN 1 END) as ios,
        COUNT(CASE WHEN platform = 'android' THEN 1 END) as android,
        COUNT(CASE WHEN platform = 'web' THEN 1 END) as web
       FROM device_tokens 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return {
      ios: parseInt(result.rows[0].ios, 10),
      android: parseInt(result.rows[0].android, 10),
      web: parseInt(result.rows[0].web, 10),
    };
  }

  /**
   * Get total active device count
   */
  static async getTotalActiveCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM device_tokens 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export default DeviceTokenEntity;
