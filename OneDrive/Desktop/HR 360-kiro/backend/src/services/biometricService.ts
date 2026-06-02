import { query } from '../config/database';

export interface BiometricDevice {
  id: string;
  userId: string;
  deviceName: string;
  biometricType: 'fingerprint' | 'faceId' | 'both';
  credentialId: string;
  publicKey: string;
  counter: number;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class BiometricService {
  /**
   * Enable biometric authentication for user
   */
  static async enableBiometric(
    userId: string,
    biometricType: 'fingerprint' | 'faceId' | 'both',
    deviceName?: string
  ): Promise<{ enabled: boolean; message: string }> {
    try {
      await query(
        `UPDATE users 
         SET biometric_enabled = true, biometric_type = $1
         WHERE id = $2`,
        [biometricType, userId]
      );

      return {
        enabled: true,
        message: `Biometric authentication (${biometricType}) enabled successfully`,
      };
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication for user
   */
  static async disableBiometric(userId: string): Promise<{ enabled: boolean; message: string }> {
    try {
      await query(
        `UPDATE users 
         SET biometric_enabled = false, biometric_type = null
         WHERE id = $1`,
        [userId]
      );

      return {
        enabled: false,
        message: 'Biometric authentication disabled successfully',
      };
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Check if user has biometric enabled
   */
  static async isBiometricEnabled(userId: string): Promise<{
    enabled: boolean;
    type?: 'fingerprint' | 'faceId' | 'both';
  }> {
    try {
      const result = await query(
        `SELECT biometric_enabled, biometric_type 
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const { biometric_enabled, biometric_type } = result.rows[0];

      return {
        enabled: biometric_enabled || false,
        type: biometric_type,
      };
    } catch (error) {
      console.error('Error checking biometric status:', error);
      throw error;
    }
  }

  /**
   * Register a biometric device
   */
  static async registerDevice(
    userId: string,
    deviceName: string,
    credentialId: string,
    publicKey: string,
    biometricType: 'fingerprint' | 'faceId' | 'both'
  ): Promise<BiometricDevice> {
    try {
      const result = await query(
        `INSERT INTO biometric_devices (user_id, device_name, credential_id, public_key, biometric_type, counter, is_active)
         VALUES ($1, $2, $3, $4, $5, 0, true)
         RETURNING id, user_id as "userId", device_name as "deviceName", biometric_type as "biometricType",
                   credential_id as "credentialId", public_key as "publicKey", counter, is_active as "isActive",
                   last_used_at as "lastUsedAt", created_at as "createdAt", updated_at as "updatedAt"`,
        [userId, deviceName, credentialId, publicKey, biometricType]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error registering biometric device:', error);
      throw error;
    }
  }

  /**
   * Get user's enrolled biometric devices
   */
  static async getUserDevices(userId: string): Promise<BiometricDevice[]> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", device_name as "deviceName", biometric_type as "biometricType",
                credential_id as "credentialId", public_key as "publicKey", counter, is_active as "isActive",
                last_used_at as "lastUsedAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM biometric_devices
         WHERE user_id = $1 AND is_active = true
         ORDER BY last_used_at DESC NULLS LAST`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting biometric devices:', error);
      throw error;
    }
  }

  /**
   * Get specific biometric device
   */
  static async getDevice(deviceId: string): Promise<BiometricDevice | null> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", device_name as "deviceName", biometric_type as "biometricType",
                credential_id as "credentialId", public_key as "publicKey", counter, is_active as "isActive",
                last_used_at as "lastUsedAt", created_at as "createdAt", updated_at as "updatedAt"
         FROM biometric_devices
         WHERE id = $1`,
        [deviceId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting biometric device:', error);
      throw error;
    }
  }

  /**
   * Update device counter after authentication
   */
  static async updateCounter(deviceId: string, newCounter: number): Promise<BiometricDevice> {
    try {
      const result = await query(
        `UPDATE biometric_devices 
         SET counter = $1, last_used_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, user_id as "userId", device_name as "deviceName", biometric_type as "biometricType",
                   credential_id as "credentialId", public_key as "publicKey", counter, is_active as "isActive",
                   last_used_at as "lastUsedAt", created_at as "createdAt", updated_at as "updatedAt"`,
        [newCounter, deviceId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating device counter:', error);
      throw error;
    }
  }

  /**
   * Deactivate biometric device
   */
  static async deactivateDevice(deviceId: string): Promise<BiometricDevice> {
    try {
      const result = await query(
        `UPDATE biometric_devices 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, user_id as "userId", device_name as "deviceName", biometric_type as "biometricType",
                   credential_id as "credentialId", public_key as "publicKey", counter, is_active as "isActive",
                   last_used_at as "lastUsedAt", created_at as "createdAt", updated_at as "updatedAt"`,
        [deviceId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error deactivating device:', error);
      throw error;
    }
  }

  /**
   * Delete biometric device
   */
  static async deleteDevice(deviceId: string): Promise<void> {
    try {
      await query('DELETE FROM biometric_devices WHERE id = $1', [deviceId]);
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  /**
   * Deactivate all devices for user
   */
  static async deactivateAllDevices(userId: string): Promise<number> {
    try {
      const result = await query(
        `UPDATE biometric_devices 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error deactivating all devices:', error);
      throw error;
    }
  }

  /**
   * Get biometric statistics for organization
   */
  static async getOrgStats(organizationId: string): Promise<{
    totalUsers: number;
    biometricEnabledUsers: number;
    enrolledDevices: number;
    fingerprintDevices: number;
    faceIdDevices: number;
  }> {
    try {
      const result = await query(
        `SELECT 
          COUNT(DISTINCT u.id) as "totalUsers",
          COUNT(DISTINCT CASE WHEN u.biometric_enabled THEN u.id END) as "biometricEnabledUsers",
          COUNT(bd.id) as "enrolledDevices",
          COUNT(CASE WHEN bd.biometric_type = 'fingerprint' THEN 1 END) as "fingerprintDevices",
          COUNT(CASE WHEN bd.biometric_type = 'faceId' THEN 1 END) as "faceIdDevices"
         FROM users u
         LEFT JOIN biometric_devices bd ON u.id = bd.user_id AND bd.is_active = true
         WHERE u.organization_id = $1`,
        [organizationId]
      );

      return {
        totalUsers: parseInt(result.rows[0].totalUsers, 10),
        biometricEnabledUsers: parseInt(result.rows[0].biometricEnabledUsers, 10),
        enrolledDevices: parseInt(result.rows[0].enrolledDevices, 10),
        fingerprintDevices: parseInt(result.rows[0].fingerprintDevices, 10),
        faceIdDevices: parseInt(result.rows[0].faceIdDevices, 10),
      };
    } catch (error) {
      console.error('Error getting biometric stats:', error);
      throw error;
    }
  }
}

export default BiometricService;
