import { NotificationEntity, Notification } from '../Notification';
import { query } from '../../config/database';

// Mock the database query function
jest.mock('../../config/database');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('NotificationEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new notification successfully', async () => {
      const notificationData = {
        userId: 'user-123',
        alertId: 'alert-456',
        isRead: false,
        readAt: undefined,
      };

      const expectedNotification: Notification = {
        id: 'notification-123',
        ...notificationData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await NotificationEntity.create(notificationData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alert_notifications'),
        [notificationData.userId, notificationData.alertId, notificationData.isRead]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should create a read notification', async () => {
      const notificationData = {
        userId: 'user-456',
        alertId: 'alert-789',
        isRead: true,
        readAt: new Date('2026-05-27T10:30:00Z'),
      };

      const expectedNotification: Notification = {
        id: 'notification-456',
        ...notificationData,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await NotificationEntity.create(notificationData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alert_notifications'),
        [notificationData.userId, notificationData.alertId, notificationData.isRead]
      );
      expect(result).toEqual(expectedNotification);
    });

    it('should handle database errors during creation', async () => {
      const notificationData = {
        userId: 'user-123',
        alertId: 'alert-456',
        isRead: false,
      };

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.create(notificationData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should find notification by id successfully', async () => {
      const notificationId = 'notification-123';
      const expectedNotification: Notification = {
        id: notificationId,
        userId: 'user-123',
        alertId: 'alert-456',
        isRead: false,
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await NotificationEntity.findById(notificationId);

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

      const result = await NotificationEntity.findById(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, user_id as "userId"'),
        [notificationId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.findById(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByAlertId', () => {
    it('should find all notifications for an alert', async () => {
      const alertId = 'alert-123';
      const expectedNotifications: Notification[] = [
        {
          id: 'notification-1',
          userId: 'user-123',
          alertId,
          isRead: true,
          readAt: new Date('2026-05-27T10:30:00Z'),
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'notification-2',
          userId: 'user-456',
          alertId,
          isRead: false,
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 2,
      } as any);

      const result = await NotificationEntity.findByAlertId(alertId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM alert_notifications WHERE alert_id = $1'),
        [alertId]
      );
      expect(result).toEqual(expectedNotifications);
    });

    it('should return empty array when no notifications found for alert', async () => {
      const alertId = 'alert-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await NotificationEntity.findByAlertId(alertId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM alert_notifications WHERE alert_id = $1'),
        [alertId]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findByAlertId', async () => {
      const alertId = 'alert-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.findByAlertId(alertId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByUserId', () => {
    it('should find all notifications for a user with default pagination', async () => {
      const userId = 'user-123';
      const expectedNotifications: Notification[] = [
        {
          id: 'notification-1',
          userId,
          alertId: 'alert-123',
          isRead: true,
          readAt: new Date('2026-05-27T10:30:00Z'),
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'notification-2',
          userId,
          alertId: 'alert-456',
          isRead: false,
          createdAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 2,
      } as any);

      const result = await NotificationEntity.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM alert_notifications WHERE user_id = $1'),
        [userId, 50, 0] // default limit and offset
      );
      expect(result).toEqual(expectedNotifications);
    });

    it('should find notifications with custom pagination', async () => {
      const userId = 'user-123';
      const limit = 10;
      const offset = 20;
      const expectedNotifications: Notification[] = [];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 0,
      } as any);

      const result = await NotificationEntity.findByUserId(userId, limit, offset);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        [userId, limit, offset]
      );
      expect(result).toEqual(expectedNotifications);
    });

    it('should handle database errors during findByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.findByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findUnreadByUserId', () => {
    it('should find all unread notifications for a user', async () => {
      const userId = 'user-123';
      const expectedNotifications: Notification[] = [
        {
          id: 'notification-1',
          userId,
          alertId: 'alert-123',
          isRead: false,
          createdAt: new Date('2026-05-27T10:00:00Z'),
        },
        {
          id: 'notification-2',
          userId,
          alertId: 'alert-456',
          isRead: false,
          createdAt: new Date('2026-05-27T09:00:00Z'),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: expectedNotifications,
        rowCount: 2,
      } as any);

      const result = await NotificationEntity.findUnreadByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_read = false'),
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

      const result = await NotificationEntity.findUnreadByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND is_read = false'),
        [userId]
      );
      expect(result).toEqual([]);
    });

    it('should handle database errors during findUnreadByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.findUnreadByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const notificationId = 'notification-123';
      const expectedNotification: Notification = {
        id: notificationId,
        userId: 'user-123',
        alertId: 'alert-456',
        isRead: true,
        readAt: new Date('2026-05-27T10:30:00Z'),
        createdAt: new Date('2026-05-27T10:00:00Z'),
      };

      mockQuery.mockResolvedValue({
        rows: [expectedNotification],
        rowCount: 1,
      } as any);

      const result = await NotificationEntity.markAsRead(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alert_notifications SET is_read = true'),
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

      const result = await NotificationEntity.markAsRead(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alert_notifications SET is_read = true'),
        [notificationId]
      );
      expect(result).toBeNull();
    });

    it('should handle database errors during markAsRead', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.markAsRead(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      const userId = 'user-123';
      const expectedCount = 5;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await NotificationEntity.markAllAsRead(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alert_notifications SET is_read = true'),
        [userId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no unread notifications to mark', async () => {
      const userId = 'user-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await NotificationEntity.markAllAsRead(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND is_read = false'),
        [userId]
      );
      expect(result).toBe(0);
    });

    it('should handle database errors during markAllAsRead', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.markAllAsRead(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('countUnreadByUserId', () => {
    it('should count unread notifications for user', async () => {
      const userId = 'user-123';
      const expectedCount = 3;

      mockQuery.mockResolvedValue({
        rows: [{ count: expectedCount.toString() }],
        rowCount: 1,
      } as any);

      const result = await NotificationEntity.countUnreadByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM alert_notifications'),
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

      const result = await NotificationEntity.countUnreadByUserId(userId);

      expect(result).toBe(0);
    });

    it('should handle database errors during countUnreadByUserId', async () => {
      const userId = 'user-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.countUnreadByUserId(userId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('delete', () => {
    it('should delete notification successfully', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      const result = await NotificationEntity.delete(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM alert_notifications WHERE id = $1',
        [notificationId]
      );
      expect(result).toBe(true);
    });

    it('should return false when notification not found for deletion', async () => {
      const notificationId = 'nonexistent-notification';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await NotificationEntity.delete(notificationId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM alert_notifications WHERE id = $1',
        [notificationId]
      );
      expect(result).toBe(false);
    });

    it('should handle database errors during deletion', async () => {
      const notificationId = 'notification-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.delete(notificationId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('deleteByAlertId', () => {
    it('should delete all notifications for an alert', async () => {
      const alertId = 'alert-123';
      const expectedCount = 3;

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: expectedCount,
      } as any);

      const result = await NotificationEntity.deleteByAlertId(alertId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM alert_notifications WHERE alert_id = $1',
        [alertId]
      );
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no notifications found for alert', async () => {
      const alertId = 'alert-456';

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await NotificationEntity.deleteByAlertId(alertId);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM alert_notifications WHERE alert_id = $1',
        [alertId]
      );
      expect(result).toBe(0);
    });

    it('should handle database errors during deleteByAlertId', async () => {
      const alertId = 'alert-123';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(NotificationEntity.deleteByAlertId(alertId)).rejects.toThrow('Database connection failed');
    });
  });
});