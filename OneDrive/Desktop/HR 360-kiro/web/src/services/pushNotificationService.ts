/**
 * Push Notification Service
 * Handles push notification registration, preferences, and history
 */

import { apiService } from './apiService';

export interface DeviceTokenData {
  token: string;
  platform: 'web' | 'mobile' | 'desktop';
  deviceName?: string;
}

export interface NotificationPreferences {
  alertsEnabled: boolean;
  incidentsEnabled: boolean;
  checkinEnabled: boolean;
  sosEnabled: boolean;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'incident' | 'sos' | 'checkin' | 'custom';
  timestamp: string;
  isRead: boolean;
  data?: Record<string, any>;
}

/**
 * Register device token for push notifications
 */
export const registerDeviceToken = async (data: DeviceTokenData): Promise<any> => {
  try {
    const response = await apiService.post('/notifications/register-device', {
      token: data.token,
      platform: data.platform,
      deviceName: data.deviceName || `${data.platform}-device`,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to register device token');
    }

    return response.data;
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
};

/**
 * Unregister device token
 */
export const unregisterDeviceToken = async (token: string): Promise<void> => {
  try {
    const response = await apiService.post('/notifications/unregister-device', { token });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unregister device token');
    }
  } catch (error) {
    console.error('Error unregistering device token:', error);
    throw error;
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const response = await apiService.get('/notifications/preferences');

    if (!response.success || !response.data) {
      throw new Error('Failed to get notification preferences');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw error;
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  try {
    const response = await apiService.post('/notifications/preferences', preferences);

    if (!response.success || !response.data) {
      throw new Error('Failed to update notification preferences');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

/**
 * Get notification history
 */
export const getNotificationHistory = async (params?: {
  limit?: number;
  offset?: number;
  type?: string;
  isRead?: boolean;
}): Promise<NotificationHistory[]> => {
  try {
    const response = await apiService.get('/notifications/history', params);

    if (!response.success || !response.data) {
      throw new Error('Failed to get notification history');
    }

    return Array.isArray(response.data) ? response.data : response.data.notifications || [];
  } catch (error) {
    console.error('Error getting notification history:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const response = await apiService.post(
      `/notifications/${notificationId}/mark-as-read`,
      {}
    );

    if (!response.success) {
      throw new Error('Failed to mark notification as read');
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const response = await apiService.post('/notifications/mark-all-as-read', {});

    if (!response.success) {
      throw new Error('Failed to mark all notifications as read');
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const response = await apiService.delete(`/notifications/${notificationId}`);

    if (!response.success) {
      throw new Error('Failed to delete notification');
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  try {
    const response = await apiService.post('/notifications/clear-all', {});

    if (!response.success) {
      throw new Error('Failed to clear notifications');
    }
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
};

export const pushNotificationService = {
  registerDeviceToken,
  unregisterDeviceToken,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
};

export default pushNotificationService;
