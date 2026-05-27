import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { authService } from './authService';

export interface NotificationSettings {
  alerts: boolean;
  incidents: boolean;
  sos: boolean;
  checkins: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface LocalNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private onNotificationReceived: ((notification: any) => void) | null = null;
  private onNotificationResponse: ((response: any) => void) | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async notification => {
          console.log('Notification received:', notification);
          if (this.onNotificationReceived) {
            this.onNotificationReceived(notification);
          }
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });

      // Request permissions
      await this.requestPermissions();

      // Get Expo push token
      await this.registerForPushNotifications();

      // Set up listeners
      this.setupListeners();

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Notification service initialization error:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('Project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      this.expoPushToken = token.data;

      console.log('Expo push token:', this.expoPushToken);

      // Register token with backend
      if (authService.isAuthenticated()) {
        await this.registerDeviceToken(this.expoPushToken);
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDeviceToken(token: string): Promise<void> {
    try {
      const api = authService.getApi();
      const deviceName = Device.modelName || 'Unknown Device';

      await api.post('/notifications/register-device', {
        token,
        platform: Device.osName?.toLowerCase() || 'unknown',
        deviceName,
      });

      console.log('Device token registered with backend');
    } catch (error) {
      console.error('Error registering device token with backend:', error);
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    try {
      const api = authService.getApi();
      await api.post('/notifications/unregister-device', { token });
      console.log('Device token unregistered');
    } catch (error) {
      console.error('Error unregistering device token:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(): void {
    // Listen for notifications when app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      if (this.onNotificationReceived) {
        this.onNotificationReceived(notification);
      }
    });

    // Listen for notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      if (this.onNotificationResponse) {
        this.onNotificationResponse(response);
      }
    });
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: LocalNotification): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log('Local notification sent:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    notification: LocalNotification,
    delaySeconds: number
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: {
          seconds: delaySeconds,
        },
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const api = authService.getApi();
      const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<any[]> {
    try {
      const api = authService.getApi();
      const response = await api.get('/notifications/unread');
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const api = authService.getApi();
      const response = await api.get('/notifications/unread-count');
      return response.data.data?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const api = authService.getApi();
      await api.put(`/notifications/${notificationId}/read`);
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void> {
    try {
      const api = authService.getApi();
      await api.put('/notifications/read-multiple', { notificationIds });
      console.log('Notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<any> {
    try {
      const api = authService.getApi();
      const response = await api.get('/notifications/stats');
      return response.data.data || {};
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {};
    }
  }

  /**
   * Set notification received callback
   */
  onNotificationReceivedCallback(callback: (notification: any) => void): void {
    this.onNotificationReceived = callback;
  }

  /**
   * Set notification response callback
   */
  onNotificationResponseCallback(callback: (response: any) => void): void {
    this.onNotificationResponse = callback;
  }

  /**
   * Get Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = new NotificationService();
