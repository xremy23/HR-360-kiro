import { PushNotificationEntity, PushNotification } from '../PushNotification';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('PushNotificationEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new push notification successfully', async () => {
      const notificationData = {
        userId: 'user-123',
        title: 'Emergency Alert',
        body: 'This is an emergency notification',
        data: { alertId: 'alert-456', severity: 'high' },
        type: 'alert' as const,
        status: 'pending' as const,
      };

      const expectedNotification: PushNotification = {
        id: 'notification-123',
        ...notificationData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.create(notificationData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_notifications'),
        [
          notificationData.userId,
          notificationData.title,
          notificationData.body,
          JSON.stringify(notificationData.data),
          notificationData.type,
          notificationData.status,
        ]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should create notification without data', async () => {
      const notificationData = {
        userId: 'user-456',
        title: 'Simple Alert',
        body: 'Simple notification',
        type: 'custom' as const,
        status: 'pending' as const,
      };

      const expectedNotification: PushNotification = {
        id: 'notification-456',
        ...notificationData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.create(notificationData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_notifications'),
        [
          notificationData.userId,
          notificationData.title,
          notificationData.body,
          JSON.stringify({}),
          notificationData.type,
          notificationData.status,
        ]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should handle database errors during creation', async () => {
      const notificationData = {
        userId: 'user-123',
        title: 'Test',
        body: 'Test',
        type: 'custom' as const,
        status: 'pending' as const,
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.create(notificationData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find notification by id successfully', async () => {
      const notificationId = 'notification-123';
      const expectedNotification: PushNotification = {
        id: notificationId,
        userId: 'user-123',
        title: 'Emergency Alert',
        body: 'This is an emergency',
        data: { alertId: 'alert-456' },
        type: 'alert',
        status: 'delivered',
        deliveredAt: new Date('2026-05-27T10:05:00Z'),
        readAt: new Date('2026-05-27T10:10:00Z'),
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.findById(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [notificationId]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should return null when notification not found', async () => {
      const notificationId = 'nonexistent-notification';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await PushNotificationEntity.findById(notificationId);

      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.findById(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by user id with default pagination', async () => {
      const userId = 'user-123';
      const expectedNotifications: PushNotification[] = [
        {
          id: 'notification-1',
          userId,
          title: 'Alert 1',
          body: 'First alert',
          type: 'alert',
          status: 'delivered',
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'notification-2',
          userId,
          title: 'Alert 2',
          body: 'Second alert',
          type: 'incident',
          status: 'pending',
          createdAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 2,
      } as any);

      const result = await PushNotificationEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [userId, 50, 0] // default limit and offset
      );
      expect(result).toEqual(expectedNotifications);
    });

    it('should find notifications with custom pagination', async () => {
      const userId = 'user-123';
      const limit = 10;
      const offset = 20;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await PushNotificationEntity.findByUserId(userId, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [userId, limit, offset]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.findByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findUnreadByUserId', () => {
    it('should find unread notifications for user', async () => {
      const userId = 'user-123';
      const expectedNotifications: PushNotification[] = [
        {
          id: 'notification-1',
          userId,
          title: 'Unread Alert',
          body: 'This is unread',
          type: 'alert',
          status: 'delivered',
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.findUnreadByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND read_at IS NULL'),
        [userId]
      );
      expect(result).toEqual(expectedNotifications);
    });

    it('should return empty array when no unread notifications', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await PushNotificationEntity.findUnreadByUserId(userId);

      expect(result).toEqual([]);
    });

    it('should handle database errors during findUnreadByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.findUnreadByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('countUnreadByUserId', () => {
    it('should count unread notifications for user', async () => {
      const userId = 'user-123';
      const expectedCount = 5;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.countUnreadByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM push_notifications'),
        [userId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no unread notifications', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.countUnreadByUserId(userId);

      expect(result).toBe(0);
    });

    it('should handle database errors during countUnreadByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.countUnreadByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const notificationId = 'notification-123';
      const expectedNotification: PushNotification = {
        id: notificationId,
        userId: 'user-123',
        title: 'Alert',
        body: 'Alert body',
        type: 'alert',
        status: 'delivered',
        readAt: new Date('2026-05-27T10:10:00Z'),
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.markAsRead(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_notifications'),
        [notificationId]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should handle database errors during markAsRead', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.markAsRead(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markMultipleAsRead', () => {
    it('should mark multiple notifications as read successfully', async () => {
      const notificationIds = ['notification-1', 'notification-2', 'notification-3'];
      const expectedCount = 3;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await PushNotificationEntity.markMultipleAsRead(notificationIds);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE push_notifications'),
        notificationIds
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when empty array provided', async () => {
      const result = await PushNotificationEntity.markMultipleAsRead([]);

      expect(result).toBe(0);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should handle database errors during markMultipleAsRead', async () => {
      const notificationIds = ['notification-1', 'notification-2'];

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.markMultipleAsRead(notificationIds)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markAsDelivered', () => {
    it('should mark notification as delivered successfully', async () => {
      const notificationId = 'notification-123';
      const expectedNotification: PushNotification = {
        id: notificationId,
        userId: 'user-123',
        title: 'Alert',
        body: 'Alert body',
        type: 'alert',
        status: 'delivered',
        deliveredAt: new Date('2026-05-27T10:05:00Z'),
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.markAsDelivered(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET status = \'delivered\', delivered_at = CURRENT_TIMESTAMP'),
        [notificationId]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should handle database errors during markAsDelivered', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.markAsDelivered(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markAsFailed', () => {
    it('should mark notification as failed successfully', async () => {
      const notificationId = 'notification-123';
      const expectedNotification: PushNotification = {
        id: notificationId,
        userId: 'user-123',
        title: 'Alert',
        body: 'Alert body',
        type: 'alert',
        status: 'failed',
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.markAsFailed(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET status = \'failed\''),
        [notificationId]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should handle database errors during markAsFailed', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.markAsFailed(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findPending', () => {
    it('should find pending notifications with default limit', async () => {
      const expectedNotifications: PushNotification[] = [
        {
          id: 'notification-1',
          userId: 'user-1',
          title: 'Pending Alert 1',
          body: 'First pending',
          type: 'alert',
          status: 'pending',
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'notification-2',
          userId: 'user-2',
          title: 'Pending Alert 2',
          body: 'Second pending',
          type: 'incident',
          status: 'pending',
          createdAt: new Date('2026-05-27T10:01:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 2,
      } as any);

      const result = await PushNotificationEntity.findPending();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = \'pending\''),
        [100] // default limit
      );
      expect(result).toEqual(expectedNotifications);
    });

    it('should find pending notifications with custom limit', async () => {
      const limit = 50;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await PushNotificationEntity.findPending(limit);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1'),
        [limit]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findPending', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.findPending()).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete notification successfully', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await PushNotificationEntity.delete(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM push_notifications WHERE id = $1',
        [notificationId]
      );
    });

    it('should handle database errors during deletion', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.delete(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete old notifications successfully', async () => {
      const days = 30;
      const expectedCount = 15;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await PushNotificationEntity.deleteOlderThan(days);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(`INTERVAL '${days} days'`)
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no old notifications found', async () => {
      const days = 7;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await PushNotificationEntity.deleteOlderThan(days);

      expect(result).toBe(0);
    });

    it('should handle database errors during deleteOlderThan', async () => {
      const days = 30;

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.deleteOlderThan(days)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getStats', () => {
    it('should get notification statistics for user', async () => {
      const userId = 'user-123';
      const expectedStats = {
        total: 100,
        unread: 15,
        delivered: 80,
        failed: 5,
      };

      mockQuery.mockResolvedValue({
        rows: [{
          total: expectedStats.total.toString(),
          unread: expectedStats.unread.toString(),
          delivered: expectedStats.delivered.toString(),
          failed: expectedStats.failed.toString(),
        }],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.getStats(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total'),
        [userId]
      );
      expect(result).toEqual(expectedStats);
    });

    it('should return zero stats when no notifications found', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [{
          total: '0',
          unread: '0',
          delivered: '0',
          failed: '0',
        }],
        rowCount: 1,
      } as any);

      const result = await PushNotificationEntity.getStats(userId);

      expect(result).toEqual({
        total: 0,
        unread: 0,
        delivered: 0,
        failed: 0,
      });
    });

    it('should handle database errors during getStats', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(PushNotificationEntity.getStats(userId)).rejects.toThrow('Database connection failed');
    });
  });
});