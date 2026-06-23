/**
 * Push Notification Service Tests
 */

import { pushNotificationService } from '../pushNotificationService';
import PushNotificationEntity from '../../entities/PushNotification';
import DeviceTokenEntity from '../../entities/DeviceToken';
import { userService } from '../userService';
import { User } from '../../types';
import { notificationQueueService } from '../notificationQueueService';

// Mock Expo SDK
jest.mock('expo-server-sdk');

jest.mock('../notificationQueueService', () => ({
  notificationQueueService: {
    scheduleNotification: jest.fn(),
    shutdown: jest.fn()
  }
}));

// Mock entities
jest.mock('../../entities/PushNotification');
jest.mock('../../entities/DeviceToken');
jest.mock('../userService');

// Prevent actual DB queries in filtering function
jest.mock('../guestNotificationService', () => ({
  guestNotificationService: {
    filterUsersForNotification: jest.fn().mockImplementation(async (userIds) => userIds)
  }
}));

describe('PushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPushNotification', () => {
    it('should send push notification to user with valid device tokens', async () => {
      const userId = 'user-123';
      const payload = {
        userId,
        title: 'Test Alert',
        body: 'This is a test alert',
        type: 'alert' as const,
      };

      // Mock device tokens
      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'token-1', token: 'ExponentPushToken[test-token-1]', platform: 'ios' },
        { id: 'token-2', token: 'ExponentPushToken[test-token-2]', platform: 'android' },
      ]);

      // Mock notification creation
      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        status: 'pending',
      });

      // Mock mark as delivered
      (PushNotificationEntity.markAsDelivered as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        status: 'delivered',
      });

      const result = await pushNotificationService.sendPushNotification(payload);

      expect(result).toBeDefined();
      expect(result.id).toBe('notification-123');
      expect(PushNotificationEntity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
        })
      );
    });

    it('should handle user with no device tokens', async () => {
      const userId = 'user-456';
      const payload = {
        userId,
        title: 'Test Alert',
        body: 'This is a test alert',
        type: 'alert' as const,
      };

      // Mock no device tokens
      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([]);

      // Mock notification creation
      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'notification-456',
        userId,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        status: 'pending',
      });

      const result = await pushNotificationService.sendPushNotification(payload);

      expect(result).toBeDefined();
      expect(result.id).toBe('notification-456');
      expect(PushNotificationEntity.create).toHaveBeenCalled();
    });
  });

  describe('sendBulkPushNotifications', () => {
    it('should send notifications to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const payload = {
        userIds,
        title: 'Bulk Alert',
        body: 'This is a bulk alert',
        type: 'alert' as const,
      };

      // Mock user service to return regular users (not guests)
      (userService.getUserById as jest.Mock).mockImplementation((id: string) => {
        return Promise.resolve({
          id,
          role: 'employee',
          organizationId: 'org-1'
        });
      });

      // Mock device tokens for each user
      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'token-1', token: 'ExponentPushToken[test-token]', platform: 'ios' },
      ]);

      // Mock notification creation
      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'notification-bulk',
        title: payload.title,
        body: payload.body,
        type: payload.type,
        status: 'pending',
      });

      // Mock mark as delivered
      (PushNotificationEntity.markAsDelivered as jest.Mock).mockResolvedValue({
        status: 'delivered',
      });

      const result = await pushNotificationService.sendBulkPushNotifications(payload);

      expect(result).toHaveLength(3);
      expect(PushNotificationEntity.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process pending scheduled notifications correctly', async () => {
      const mockScheduledNotifications = [
        {
          id: '1',
          userId: 'user-1',
          title: 'Scheduled Alert',
          body: 'This is scheduled',
          data: {
            scheduledTime: new Date(Date.now() - 1000).toISOString()
          },
          type: 'alert',
          status: 'pending'
        }
      ];

      (PushNotificationEntity.findDueScheduledNotifications as jest.Mock).mockResolvedValue(mockScheduledNotifications);
      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'token-1', userId: 'user-1', token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', platform: 'ios' }
      ]);

      // Mock the module's chunkMessages to prevent the actual chunk implementation from breaking without real mocks
      jest.spyOn(pushNotificationService as any, 'chunkMessages').mockReturnValue([
        [
          { to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', sound: 'default', title: 'Scheduled Alert', body: 'This is scheduled', data: { notificationId: '1', type: 'alert', scheduledTime: new Date(Date.now() - 1000).toISOString(), tokenId: 'token-1' }, badge: undefined }
        ]
      ]);

      // The internal loop does error handling and waits. Let's make sure our mock doesn't fail Expo check
      const expoMock = require('expo-server-sdk');
      expoMock.Expo.isExpoPushToken = jest.fn().mockReturnValue(true);
      expoMock.Expo.prototype.sendPushNotificationsAsync = jest.fn().mockResolvedValue([{ status: 'ok', id: 'ticket-1' }]);

      await pushNotificationService.processScheduledNotifications();

      expect(PushNotificationEntity.findDueScheduledNotifications).toHaveBeenCalled();
      expect(PushNotificationEntity.markAsDelivered).toHaveBeenCalledWith('1');
    });
  });

  describe('registerDeviceToken', () => {
    it('should register a new device token', async () => {
      const userId = 'user-789';
      const token = 'ExponentPushToken[test-token]';
      const platform = 'ios';

      (DeviceTokenEntity.upsert as jest.Mock).mockResolvedValue({
        userId,
        token,
        platform,
      });

      await pushNotificationService.registerDeviceToken(userId, token, platform);

      expect(DeviceTokenEntity.upsert).toHaveBeenCalledWith(
        userId,
        token,
        platform,
        undefined
      );
    });

    it('should register device token with device name', async () => {
      const userId = 'user-789';
      const token = 'ExponentPushToken[test-token]';
      const platform = 'android';
      const deviceName = 'Samsung Galaxy S21';

      (DeviceTokenEntity.upsert as jest.Mock).mockResolvedValue({
        userId,
        token,
        platform,
        deviceName,
      });

      await pushNotificationService.registerDeviceToken(userId, token, platform, deviceName);

      expect(DeviceTokenEntity.upsert).toHaveBeenCalledWith(
        userId,
        token,
        platform,
        deviceName
      );
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should unregister a device token', async () => {
      const token = 'ExponentPushToken[test-token]';

      (DeviceTokenEntity.deleteByToken as jest.Mock).mockResolvedValue(1);

      await pushNotificationService.unregisterDeviceToken(token);

      expect(DeviceTokenEntity.deleteByToken).toHaveBeenCalledWith(token);
    });
  });

  describe('getNotificationHistory', () => {
    it('should retrieve notification history for user', async () => {
      const userId = 'user-123';
      const limit = 50;
      const offset = 0;

      const mockNotifications = [
        { id: 'notif-1', title: 'Alert 1', status: 'delivered' },
        { id: 'notif-2', title: 'Alert 2', status: 'delivered' },
      ];

      (PushNotificationEntity.findByUserId as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await pushNotificationService.getNotificationHistory(userId, limit, offset);

      expect(result).toEqual(mockNotifications);
      expect(PushNotificationEntity.findByUserId).toHaveBeenCalledWith(userId, limit, offset);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should retrieve unread notifications for user', async () => {
      const userId = 'user-123';

      const mockUnreadNotifications = [
        { id: 'notif-1', title: 'Unread Alert 1', status: 'pending' },
        { id: 'notif-2', title: 'Unread Alert 2', status: 'pending' },
      ];

      (PushNotificationEntity.findUnreadByUserId as jest.Mock).mockResolvedValue(
        mockUnreadNotifications
      );

      const result = await pushNotificationService.getUnreadNotifications(userId);

      expect(result).toEqual(mockUnreadNotifications);
      expect(PushNotificationEntity.findUnreadByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-123';

      (PushNotificationEntity.markAsRead as jest.Mock).mockResolvedValue({
        id: notificationId,
        status: 'read',
      });

      const result = await pushNotificationService.markNotificationAsRead(notificationId);

      expect(result.status).toBe('read');
      expect(PushNotificationEntity.markAsRead).toHaveBeenCalledWith(notificationId);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count for user', async () => {
      const userId = 'user-123';

      (PushNotificationEntity.countUnreadByUserId as jest.Mock).mockResolvedValue(5);

      const result = await pushNotificationService.getUnreadCount(userId);

      expect(result).toBe(5);
      expect(PushNotificationEntity.countUnreadByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('sendAlertNotification', () => {
    it('should send alert notification to multiple users', async () => {
      const userIds = ['user-1', 'user-2'];
      const alertTitle = 'Security Alert';
      const alertMessage = 'Unauthorized access attempt detected';
      const severity = 'high';

      // Mock user service to return regular users (not guests)
      (userService.getUserById as jest.Mock).mockImplementation((id: string) => {
        return Promise.resolve({
          id,
          role: 'employee',
          organizationId: 'org-1'
        });
      });

      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'token-1', token: 'ExponentPushToken[test-token]', platform: 'ios' },
      ]);

      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'alert-notif',
        title: `Alert: ${alertTitle}`,
        type: 'alert',
      });

      (PushNotificationEntity.markAsDelivered as jest.Mock).mockResolvedValue({
        status: 'delivered',
      });

      const result = await pushNotificationService.sendAlertNotification(
        userIds,
        alertTitle,
        alertMessage,
        severity
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('sendSOSNotification', () => {
    it('should send SOS notification to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const sosUserId = 'sos-user-123';
      const sosUserName = 'John Doe';

      // Mock user service to return regular users (not guests)
      (userService.getUserById as jest.Mock).mockImplementation((id: string) => {
        return Promise.resolve({
          id,
          role: 'employee',
          organizationId: 'org-1'
        });
      });

      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'token-1', token: 'ExponentPushToken[test-token]', platform: 'ios' },
      ]);

      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'sos-notif',
        title: '🚨 SOS Alert',
        type: 'sos',
      });

      (PushNotificationEntity.markAsDelivered as jest.Mock).mockResolvedValue({
        status: 'delivered',
      });

      const result = await pushNotificationService.sendSOSNotification(
        userIds,
        sosUserId,
        sosUserName
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should cleanup notifications older than specified days', async () => {
      const daysOld = 30;

      (PushNotificationEntity.deleteOlderThan as jest.Mock).mockResolvedValue(150);

      const result = await pushNotificationService.cleanupOldNotifications(daysOld);

      expect(result).toBe(150);
      expect(PushNotificationEntity.deleteOlderThan).toHaveBeenCalledWith(daysOld);
    });
  });

  describe('cleanupInactiveDeviceTokens', () => {
    it('should cleanup inactive device tokens', async () => {
      const daysInactive = 90;

      (DeviceTokenEntity.deleteInactiveOlderThan as jest.Mock).mockResolvedValue(45);

      const result = await pushNotificationService.cleanupInactiveDeviceTokens(daysInactive);

      expect(result).toBe(45);
      expect(DeviceTokenEntity.deleteInactiveOlderThan).toHaveBeenCalledWith(daysInactive);
    });
  });
});
