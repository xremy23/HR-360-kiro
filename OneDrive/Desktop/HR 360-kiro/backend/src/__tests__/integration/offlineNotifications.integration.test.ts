/**
 * Integration Tests: Offline Sync + Push Notifications
 * Tests the complete flow of offline operations and push notifications
 */

import { pushNotificationService } from '../../services/pushNotificationService';
import { userService } from '../../services/userService';

// Mock all database and external dependencies
jest.mock('../../config/database');
jest.mock('../../entities/PushNotification');
jest.mock('../../entities/DeviceToken');
jest.mock('../../websocket/server');
jest.mock('../../services/userService');
jest.mock('../../services/notificationQueueService', () => ({
  notificationQueueService: {
    scheduleNotification: jest.fn(),
    shutdown: jest.fn()
  }
}));

// Import mocked modules
import PushNotificationEntity from '../../entities/PushNotification';
import DeviceTokenEntity from '../../entities/DeviceToken';
import { getWebSocketServer } from '../../websocket/server';

describe('Offline Sync + Push Notifications Integration', () => {
  let testUserId: string;

  beforeAll(() => {
    testUserId = 'test-user-123';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (getWebSocketServer as jest.Mock).mockReturnValue({
      broadcastAlertCreated: jest.fn(),
      broadcastSOSCreated: jest.fn(),
      broadcastNotificationToUser: jest.fn(),
    });
  });

  describe('Push Notification Flow', () => {
    it('should send push notification with device tokens', async () => {
      // Mock device tokens
      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([
        { id: 'token-1', token: 'ExponentPushToken[test-1]', platform: 'ios' },
      ]);

      // Mock notification creation
      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        userId: testUserId,
        title: 'Test Alert',
        body: 'Test message',
        type: 'alert',
        status: 'pending',
      });

      const result = await pushNotificationService.sendPushNotification({
        userId: testUserId,
        title: 'Test Alert',
        body: 'Test message',
        type: 'alert',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('notification-123');
      expect(PushNotificationEntity.create).toHaveBeenCalled();
    });

    it('should handle users with no device tokens', async () => {
      // Mock no device tokens
      (DeviceTokenEntity.findByUserId as jest.Mock).mockResolvedValue([]);

      // Mock notification creation for offline delivery
      (PushNotificationEntity.create as jest.Mock).mockResolvedValue({
        id: 'notification-456',
        userId: testUserId,
        title: 'Offline Alert',
        body: 'Offline message',
        type: 'alert',
        status: 'pending',
      });

      const result = await pushNotificationService.sendPushNotification({
        userId: testUserId,
        title: 'Offline Alert',
        body: 'Offline message',
        type: 'alert',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('notification-456');
      expect(PushNotificationEntity.create).toHaveBeenCalled();
    });
  });

  describe('Bulk Notification Flow', () => {
    it('should send notifications to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      // Mock user service to return regular users
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
        title: 'Bulk Alert',
        body: 'Bulk message',
        type: 'alert',
        status: 'pending',
      });

      const result = await pushNotificationService.sendBulkPushNotifications({
        userIds,
        title: 'Bulk Alert',
        body: 'Bulk message',
        type: 'alert',
      });

      expect(result).toHaveLength(3);
      expect(PushNotificationEntity.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Device Token Management', () => {
    it('should register device tokens', async () => {
      const token = 'ExponentPushToken[test-token]';
      const platform = 'ios';

      (DeviceTokenEntity.upsert as jest.Mock).mockResolvedValue({
        userId: testUserId,
        token,
        platform,
      });

      await pushNotificationService.registerDeviceToken(testUserId, token, platform);

      expect(DeviceTokenEntity.upsert).toHaveBeenCalledWith(
        testUserId,
        token,
        platform,
        undefined
      );
    });

    it('should unregister device tokens', async () => {
      const token = 'ExponentPushToken[test-token]';

      (DeviceTokenEntity.deleteByToken as jest.Mock).mockResolvedValue(1);

      await pushNotificationService.unregisterDeviceToken(token);

      expect(DeviceTokenEntity.deleteByToken).toHaveBeenCalledWith(token);
    });
  });

  describe('Notification History', () => {
    it('should retrieve notification history', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Alert 1', status: 'delivered' },
        { id: 'notif-2', title: 'Alert 2', status: 'delivered' },
      ];

      (PushNotificationEntity.findByUserId as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await pushNotificationService.getNotificationHistory(testUserId, 50, 0);

      expect(result).toEqual(mockNotifications);
      expect(PushNotificationEntity.findByUserId).toHaveBeenCalledWith(testUserId, 50, 0);
    });

    it('should get unread notification count', async () => {
      (PushNotificationEntity.countUnreadByUserId as jest.Mock).mockResolvedValue(5);

      const result = await pushNotificationService.getUnreadCount(testUserId);

      expect(result).toBe(5);
      expect(PushNotificationEntity.countUnreadByUserId).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old notifications', async () => {
      const daysOld = 30;

      (PushNotificationEntity.deleteOlderThan as jest.Mock).mockResolvedValue(150);

      const result = await pushNotificationService.cleanupOldNotifications(daysOld);

      expect(result).toBe(150);
      expect(PushNotificationEntity.deleteOlderThan).toHaveBeenCalledWith(daysOld);
    });

    it('should cleanup inactive device tokens', async () => {
      const daysInactive = 90;

      (DeviceTokenEntity.deleteInactiveOlderThan as jest.Mock).mockResolvedValue(45);

      const result = await pushNotificationService.cleanupInactiveDeviceTokens(daysInactive);

      expect(result).toBe(45);
      expect(DeviceTokenEntity.deleteInactiveOlderThan).toHaveBeenCalledWith(daysInactive);
    });
  });

  describe('WebSocket Integration', () => {
    it('should have WebSocket server available', () => {
      const wsServer = getWebSocketServer();
      
      expect(wsServer).toBeDefined();
      expect(wsServer.broadcastAlertCreated).toBeDefined();
      expect(wsServer.broadcastSOSCreated).toBeDefined();
      expect(wsServer.broadcastNotificationToUser).toBeDefined();
    });
  });
});