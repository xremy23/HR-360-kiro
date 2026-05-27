/**
 * Mobile Notification Service Tests
 */

import * as Notifications from 'expo-notifications';
import { notificationService } from '../notificationService';

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  dismissAllNotificationsAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should request notification permissions', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
        ios: { alert: true, badge: true, sound: true },
      });

      const result = await notificationService.requestPermissions();

      expect(result.granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const result = await notificationService.requestPermissions();

      expect(result.granted).toBe(false);
    });
  });

  describe('getDeviceToken', () => {
    it('should get device push token', async () => {
      const mockToken = 'ExponentPushToken[test-token-123]';

      (Notifications.getDevicePushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });

      const result = await notificationService.getDeviceToken();

      expect(result).toBe(mockToken);
      expect(Notifications.getDevicePushTokenAsync).toHaveBeenCalled();
    });

    it('should handle token retrieval error', async () => {
      (Notifications.getDevicePushTokenAsync as jest.Mock).mockRejectedValue(
        new Error('Token error')
      );

      await expect(notificationService.getDeviceToken()).rejects.toThrow();
    });
  });

  describe('registerForPushNotifications', () => {
    it('should register device for push notifications', async () => {
      const mockToken = 'ExponentPushToken[test-token-123]';

      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
      });

      (Notifications.getDevicePushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });

      const result = await notificationService.registerForPushNotifications();

      expect(result).toBe(mockToken);
    });

    it('should handle permission denied', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: false,
      });

      const result = await notificationService.registerForPushNotifications();

      expect(result).toBeNull();
    });
  });

  describe('scheduleLocalNotification', () => {
    it('should schedule a local notification', async () => {
      const notification = {
        title: 'Test Notification',
        body: 'This is a test',
        data: { id: '123' },
      };

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id-123');

      const result = await notificationService.scheduleLocalNotification(notification);

      expect(result).toBe('notif-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('should schedule notification with delay', async () => {
      const notification = {
        title: 'Delayed Notification',
        body: 'This is delayed',
        data: {},
      };
      const delaySeconds = 60;

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id-456');

      const result = await notificationService.scheduleLocalNotification(
        notification,
        delaySeconds
      );

      expect(result).toBe('notif-id-456');
    });
  });

  describe('dismissNotification', () => {
    it('should dismiss a notification', async () => {
      const notificationId = 'notif-123';

      (Notifications.dismissNotificationAsync as jest.Mock).mockResolvedValue(undefined);

      await notificationService.dismissNotification(notificationId);

      expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(notificationId);
    });
  });

  describe('dismissAllNotifications', () => {
    it('should dismiss all notifications', async () => {
      (Notifications.dismissAllNotificationsAsync as jest.Mock).mockResolvedValue(undefined);

      await notificationService.dismissAllNotifications();

      expect(Notifications.dismissAllNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('setNotificationHandler', () => {
    it('should set notification handler', () => {
      const handler = {
        handleNotification: jest.fn(),
        handleSuccess: jest.fn(),
        handleError: jest.fn(),
      };

      notificationService.setNotificationHandler(handler);

      expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    });
  });

  describe('addNotificationReceivedListener', () => {
    it('should add notification received listener', () => {
      const callback = jest.fn();

      notificationService.addNotificationReceivedListener(callback);

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
    });
  });

  describe('addNotificationResponseListener', () => {
    it('should add notification response listener', () => {
      const callback = jest.fn();

      notificationService.addNotificationResponseListener(callback);

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
    });
  });

  describe('handleNotificationResponse', () => {
    it('should handle notification tap', () => {
      const response = {
        notification: {
          request: {
            content: {
              data: {
                type: 'alert',
                alertId: 'alert-123',
              },
            },
          },
        },
      };

      const callback = jest.fn();
      notificationService.handleNotificationResponse(response, callback);

      expect(callback).toHaveBeenCalledWith(response.notification.request.content.data);
    });
  });

  describe('getNotificationPermissionStatus', () => {
    it('should get notification permission status', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        granted: true,
        ios: { alert: true, badge: true, sound: true },
      });

      const result = await notificationService.getNotificationPermissionStatus();

      expect(result.granted).toBe(true);
    });
  });

  describe('createNotificationChannel', () => {
    it('should create notification channel (Android)', async () => {
      const channel = {
        id: 'alerts',
        name: 'Alerts',
        importance: 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      };

      // Note: This is Android-specific, so it might not do anything on iOS
      await notificationService.createNotificationChannel(channel);

      // Just verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('sendLocalAlert', () => {
    it('should send local alert notification', async () => {
      const alert = {
        title: 'Alert Title',
        message: 'Alert Message',
        severity: 'high',
      };

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id');

      const result = await notificationService.sendLocalAlert(alert);

      expect(result).toBe('notif-id');
    });
  });

  describe('sendLocalSOSAlert', () => {
    it('should send local SOS alert', async () => {
      const sosData = {
        userName: 'John Doe',
        timestamp: new Date().toISOString(),
      };

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id');

      const result = await notificationService.sendLocalSOSAlert(sosData);

      expect(result).toBe('notif-id');
    });
  });

  describe('sendLocalIncidentAlert', () => {
    it('should send local incident alert', async () => {
      const incident = {
        type: 'Fire',
        severity: 'critical',
        location: 'Building A',
      };

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id');

      const result = await notificationService.sendLocalIncidentAlert(incident);

      expect(result).toBe('notif-id');
    });
  });

  describe('sendLocalCheckInReminder', () => {
    it('should send local check-in reminder', async () => {
      const reminder = {
        incidentId: 'incident-123',
        message: 'Please check in',
      };

      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id');

      const result = await notificationService.sendLocalCheckInReminder(reminder);

      expect(result).toBe('notif-id');
    });
  });
});
