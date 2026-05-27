import { DeviceTokenEntity, DeviceToken } from '../DeviceToken';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('DeviceTokenEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should create a new device token successfully', async () => {
      const userId = 'user-123';
      const token = 'ExponentPushToken[abc123]';
      const platform = 'ios' as const;
      const deviceName = 'iPhone 13';

      const expectedToken: DeviceToken = {
        id: 'token-123',
        userId,
        token,
        platform,
        deviceName,
        isActive: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedToken],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.upsert(userId, token, platform, deviceName);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO device_tokens'),
        [userId, token, platform, deviceName]
      );
      expect(result).toEqual(expectedToken);
    });

    it('should update existing device token on conflict', async () => {
      const userId = 'user-123';
      const token = 'ExponentPushToken[abc123]';
      const platform = 'android' as const;

      const expectedToken: DeviceToken = {
        id: 'token-123',
        userId,
        token,
        platform,
        isActive: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:05:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedToken],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.upsert(userId, token, platform);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (user_id, token) DO UPDATE SET'),
        [userId, token, platform, null]
      );
      expect(result).toEqual(expectedToken);
    });

    it('should handle database errors during upsert', async () => {
      const userId = 'user-123';
      const token = 'ExponentPushToken[abc123]';
      const platform = 'web' as const;

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.upsert(userId, token, platform)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find device token by id successfully', async () => {
      const tokenId = 'token-123';
      const expectedToken: DeviceToken = {
        id: tokenId,
        userId: 'user-123',
        token: 'ExponentPushToken[abc123]',
        platform: 'ios',
        deviceName: 'iPhone 13',
        isActive: true,
        lastUsedAt: new Date('2026-05-27T10:30:00Z'),
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedToken],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.findById(tokenId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [tokenId]
      );
      expect(result).toEqual(expectedToken);
    });

    it('should return null when token not found', async () => {
      const tokenId = 'nonexistent-token';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await DeviceTokenEntity.findById(tokenId);

      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const tokenId = 'token-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.findById(tokenId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should find active device tokens for user by default', async () => {
      const userId = 'user-123';
      const expectedTokens: DeviceToken[] = [
        {
          id: 'token-1',
          userId,
          token: 'ExponentPushToken[abc123]',
          platform: 'ios',
          isActive: true,
          lastUsedAt: new Date('2026-05-27T10:30:00Z'),
          createdAt: new Date('2026-05-27T10:00:00Z'),
          updatedAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'token-2',
          userId,
          token: 'ExponentPushToken[def456]',
          platform: 'android',
          isActive: true,
          lastUsedAt: new Date('2026-05-27T10:25:00Z'),
          createdAt: new Date('2026-05-27T09:00:00Z'),
          updatedAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedTokens,
        rowCount: 2,
      } as any);

      const result = await DeviceTokenEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND is_active = true'),
        [userId]
      );
      expect(result).toEqual(expectedTokens);
    });

    it('should find all device tokens for user when activeOnly is false', async () => {
      const userId = 'user-123';
      const expectedTokens: DeviceToken[] = [
        {
          id: 'token-1',
          userId,
          token: 'ExponentPushToken[abc123]',
          platform: 'ios',
          isActive: true,
          createdAt: new Date('2026-05-27T10:00:00Z'),
          updatedAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'token-2',
          userId,
          token: 'ExponentPushToken[old456]',
          platform: 'android',
          isActive: false,
          createdAt: new Date('2026-05-26T10:00:00Z'),
          updatedAt: new Date('2026-05-26T10:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedTokens,
        rowCount: 2,
      } as any);

      const result = await DeviceTokenEntity.findByUserId(userId, false);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.not.stringContaining('AND is_active = true'),
        [userId]
      );
      expect(result).toEqual(expectedTokens);
    });

    it('should return empty array when no tokens found', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await DeviceTokenEntity.findByUserId(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during findByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.findByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByToken', () => {
    it('should find device token by token string successfully', async () => {
      const tokenString = 'ExponentPushToken[abc123]';
      const expectedToken: DeviceToken = {
        id: 'token-123',
        userId: 'user-123',
        token: tokenString,
        platform: 'ios',
        isActive: true,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedToken],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.findByToken(tokenString);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE token = $1'),
        [tokenString]
      );
      expect(result).toEqual(expectedToken);
    });

    it('should return null when token not found', async () => {
      const tokenString = 'ExponentPushToken[nonexistent]';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await DeviceTokenEntity.findByToken(tokenString);

      expect(result).toBeNull();
    });

    it('should handle database errors during findByToken', async () => {
      const tokenString = 'ExponentPushToken[abc123]';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.findByToken(tokenString)).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used time successfully', async () => {
      const tokenId = 'token-123';
      const expectedToken: DeviceToken = {
        id: tokenId,
        userId: 'user-123',
        token: 'ExponentPushToken[abc123]',
        platform: 'ios',
        isActive: true,
        lastUsedAt: new Date('2026-05-27T10:30:00Z'),
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedToken],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.updateLastUsed(tokenId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET last_used_at = CURRENT_TIMESTAMP'),
        [tokenId]
      );
      expect(result).toEqual(expectedToken);
    });

    it('should handle database errors during updateLastUsed', async () => {
      const tokenId = 'token-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.updateLastUsed(tokenId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deactivate', () => {
    it('should deactivate device token successfully', async () => {
      const tokenId = 'token-123';
      const expectedToken: DeviceToken = {
        id: tokenId,
        userId: 'user-123',
        token: 'ExponentPushToken[abc123]',
        platform: 'ios',
        isActive: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
        updatedAt: new Date('2026-05-27T10:30:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedToken],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.deactivate(tokenId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET is_active = false, updated_at = CURRENT_TIMESTAMP'),
        [tokenId]
      );
      expect(result).toEqual(expectedToken);
    });

    it('should handle database errors during deactivate', async () => {
      const tokenId = 'token-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.deactivate(tokenId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deactivateAllForUser', () => {
    it('should deactivate all tokens for user successfully', async () => {
      const userId = 'user-123';
      const expectedCount = 3;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await DeviceTokenEntity.deactivateAllForUser(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET is_active = false, updated_at = CURRENT_TIMESTAMP'),
        [userId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no tokens found for user', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await DeviceTokenEntity.deactivateAllForUser(userId);

      expect(result).toBe(0);
    });

    it('should handle database errors during deactivateAllForUser', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.deactivateAllForUser(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete device token successfully', async () => {
      const tokenId = 'token-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await DeviceTokenEntity.delete(tokenId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM device_tokens WHERE id = $1',
        [tokenId]
      );
    });

    it('should handle database errors during deletion', async () => {
      const tokenId = 'token-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.delete(tokenId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteByToken', () => {
    it('should delete device token by token string successfully', async () => {
      const tokenString = 'ExponentPushToken[abc123]';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await DeviceTokenEntity.deleteByToken(tokenString);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM device_tokens WHERE token = $1',
        [tokenString]
      );
    });

    it('should handle database errors during deleteByToken', async () => {
      const tokenString = 'ExponentPushToken[abc123]';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.deleteByToken(tokenString)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteInactiveOlderThan', () => {
    it('should delete inactive old tokens successfully', async () => {
      const days = 30;
      const expectedCount = 10;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await DeviceTokenEntity.deleteInactiveOlderThan(days);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(`INTERVAL '${days} days'`)
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no old inactive tokens found', async () => {
      const days = 7;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await DeviceTokenEntity.deleteInactiveOlderThan(days);

      expect(result).toBe(0);
    });

    it('should handle database errors during deleteInactiveOlderThan', async () => {
      const days = 30;

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.deleteInactiveOlderThan(days)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getCountByPlatform', () => {
    it('should get device count by platform for user', async () => {
      const userId = 'user-123';
      const expectedCounts = {
        ios: 2,
        android: 1,
        web: 1,
      };

      mockQuery.mockResolvedValue({
        rows: [{
          ios: expectedCounts.ios.toString(),
          android: expectedCounts.android.toString(),
          web: expectedCounts.web.toString(),
        }],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.getCountByPlatform(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(CASE WHEN platform = \'ios\' THEN 1 END) as ios'),
        [userId]
      );
      expect(result).toEqual(expectedCounts);
    });

    it('should return zero counts when no devices found', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [{
          ios: '0',
          android: '0',
          web: '0',
        }],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.getCountByPlatform(userId);

      expect(result).toEqual({
        ios: 0,
        android: 0,
        web: 0,
      });
    });

    it('should handle database errors during getCountByPlatform', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.getCountByPlatform(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getTotalActiveCount', () => {
    it('should get total active device count for user', async () => {
      const userId = 'user-123';
      const expectedCount = 4;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.getTotalActiveCount(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM device_tokens'),
        [userId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no active devices found', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      } as any);

      const result = await DeviceTokenEntity.getTotalActiveCount(userId);

      expect(result).toBe(0);
    });

    it('should handle database errors during getTotalActiveCount', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(DeviceTokenEntity.getTotalActiveCount(userId)).rejects.toThrow('Database connection failed');
    });
  });
});