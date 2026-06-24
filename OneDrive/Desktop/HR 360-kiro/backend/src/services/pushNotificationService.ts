import * as Expo from 'expo-server-sdk';
import PushNotificationEntity, { PushNotification } from '../entities/PushNotification';
import DeviceTokenEntity from '../entities/DeviceToken';
import { guestNotificationService } from './guestNotificationService';
import { logger } from './monitoringService';
import { notificationQueueService } from './notificationQueueService';

// Initialize Expo SDK
const expoClient = new Expo.Expo();

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'alert' | 'incident' | 'sos' | 'checkin' | 'custom';
  badge?: number;
  sound?: string;
}

export interface BulkPushPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'alert' | 'incident' | 'sos' | 'checkin' | 'custom';
  source?: 'internal' | 'pagasa' | 'philvolcs' | 'ndrrmc'; // Add source field
}

export interface ScheduledPushPayload extends PushNotificationPayload {
  scheduledTime: Date;
}

class PushNotificationService {
  /**
   * Send push notification to user
   */
  async sendPushNotification(payload: PushNotificationPayload): Promise<PushNotification> {
    try {
      // Get user's device tokens
      const deviceTokens = await DeviceTokenEntity.findByUserId(payload.userId, true);

      if (deviceTokens.length === 0) {
        console.warn(`No active device tokens for user ${payload.userId}`);
        // Still create notification record for offline delivery
        return await PushNotificationEntity.create({
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          type: payload.type,
          status: 'pending',
        });
      }

      // Create notification record
      const notification = await PushNotificationEntity.create({
        userId: payload.userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        type: payload.type,
        status: 'pending',
      });

      // Send to all device tokens
      const messages: Expo.ExpoPushMessage[] = deviceTokens
        .filter(token => Expo.Expo.isExpoPushToken(token.token))
        .map(token => ({
          to: token.token,
          sound: payload.sound || 'default',
          title: payload.title,
          body: payload.body,
          data: {
            notificationId: notification.id,
            type: payload.type,
            ...payload.data,
          },
          badge: payload.badge,
        }));

      if (messages.length === 0) {
        console.warn(`No valid device tokens for user ${payload.userId}`);
        return notification;
      }

      // Send messages in chunks
      const chunks = this.chunkMessages(messages, 100);
      for (const chunk of chunks) {
        try {
          const tickets = await expoClient.sendPushNotificationsAsync(chunk);
          console.log(`Sent ${tickets.length} push notifications`);

          // Handle tickets
          for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            if (ticket.status === 'error') {
              console.error(`Error sending notification: ${ticket.message}`);
              if (ticket.details?.error === 'InvalidCredentials') {
                // Invalid token, deactivate it
                await DeviceTokenEntity.deactivate(deviceTokens[i].id);
              }
            }
          }
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Update notification status
      await PushNotificationEntity.markAsDelivered(notification.id);
      return notification;
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
      throw error;
    }
  }

  /**
   * Send bulk push notifications
   */
  async sendBulkPushNotifications(payload: BulkPushPayload): Promise<PushNotification[]> {
    try {
      // Filter users based on role and alert source
      const filteredUserIds = await guestNotificationService.filterUsersForNotification(
        payload.userIds,
        payload.source || 'internal'
      );

      if (filteredUserIds.length === 0) {
        logger.info(`No eligible users for notification with source: ${payload.source}`);
        return [];
      }

      const notifications: PushNotification[] = [];

      const results = await Promise.allSettled(
        filteredUserIds.map(userId =>
          this.sendPushNotification({
            userId,
            title: payload.title,
            body: payload.body,
            data: payload.data,
            type: payload.type,
          })
        )
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          notifications.push(result.value);
        } else {
          logger.error(`Error sending notification to user ${filteredUserIds[i]}`, { error: result.reason });
        }
      }

      return notifications;
    } catch (error) {
      logger.error('Error in sendBulkPushNotifications', { error, payload });
      throw error;
    }
  }

  /**
   * Schedule push notification
   */
  async schedulePushNotification(payload: ScheduledPushPayload): Promise<PushNotification> {
    const notification = await PushNotificationEntity.create({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: {
        ...payload.data,
        scheduledTime: payload.scheduledTime.toISOString(),
      },
      type: payload.type,
      status: 'pending',
    });

    const pushPayload: PushNotificationPayload = {
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      type: payload.type,
      badge: payload.badge,
      sound: payload.sound,
    };

    await notificationQueueService.scheduleNotification(notification.id, pushPayload, payload.scheduledTime);
    logger.info(`Scheduled notification ${notification.id} for ${payload.scheduledTime}`);
    // Notification will be processed by the background job service when scheduledTime is reached
    console.log(`Scheduled notification ${notification.id} for ${payload.scheduledTime}`);

    return notification;
  }


  /**
   * Process scheduled push notifications
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const dueNotifications = await PushNotificationEntity.findDueScheduledNotifications();

      if (dueNotifications.length === 0) return;

      console.log(`Found ${dueNotifications.length} scheduled notifications to process`);

      for (const notification of dueNotifications) {
        try {
          const deviceTokens = await DeviceTokenEntity.findByUserId(notification.userId, true);

          if (deviceTokens.length === 0) {
            console.warn(`No active device tokens for user ${notification.userId} for scheduled notification`);
            await PushNotificationEntity.markAsFailed(notification.id);
            continue;
          }

          const messages: Expo.ExpoPushMessage[] = [];
          const validTokens = deviceTokens.filter(token => Expo.Expo.isExpoPushToken(token.token));

          for (const token of validTokens) {
            messages.push({
              to: token.token,
              sound: notification.data?.sound || 'default',
              title: notification.title,
              body: notification.body,
              data: {
                notificationId: notification.id,
                type: notification.type,
                tokenId: token.id,
                ...notification.data,
              },
              badge: notification.data?.badge,
            });
          }

          if (messages.length === 0) {
            console.warn(`No valid device tokens for user ${notification.userId} for scheduled notification`);
            await PushNotificationEntity.markAsFailed(notification.id);
            continue;
          }

          const chunks = this.chunkMessages(messages, 100);
          for (const chunk of chunks) {
            try {
              const tickets = await expoClient.sendPushNotificationsAsync(chunk);
              console.log(`Sent ${tickets.length} scheduled push notifications for notification ${notification.id}`);

              // Handle tickets
              for (let i = 0; i < tickets.length; i++) {
                const ticket = tickets[i];
                if (ticket.status === 'error') {
                  console.error(`Error sending scheduled notification: ${ticket.message}`);
                  if (ticket.details?.error === 'DeviceNotRegistered' || ticket.details?.error === 'InvalidCredentials') {
                    // Invalid token, deactivate it using the mapped token id
                    const originalMessage = chunk[i];
                    if (originalMessage && originalMessage.data && originalMessage.data.tokenId) {
                      await DeviceTokenEntity.deactivate(originalMessage.data.tokenId as string);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error sending scheduled push notification chunk:', error);
            }
          }

          await PushNotificationEntity.markAsDelivered(notification.id);
        } catch (error) {
          console.error(`Error processing scheduled notification ${notification.id}:`, error);
          await PushNotificationEntity.markAsFailed(notification.id);
        }
      }
    } catch (error) {
      logger.error('Error in processScheduledNotifications:', { error });
    }
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceName?: string
  ): Promise<void> {
    try {
      // Validate token format
      if (!Expo.Expo.isExpoPushToken(token)) {
        console.warn(`Invalid Expo push token: ${token}`);
      }

      // Upsert device token
      await DeviceTokenEntity.upsert(userId, token, platform, deviceName);
      console.log(`Registered device token for user ${userId}`);
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    try {
      await DeviceTokenEntity.deleteByToken(token);
      console.log(`Unregistered device token: ${token}`);
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  }

  /**
   * Get user's device tokens
   */
  async getUserDeviceTokens(userId: string): Promise<any[]> {
    try {
      return await DeviceTokenEntity.findByUserId(userId, true);
    } catch (error) {
      console.error('Error getting user device tokens:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PushNotification[]> {
    try {
      return await PushNotificationEntity.findByUserId(userId, limit, offset);
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<PushNotification[]> {
    try {
      return await PushNotificationEntity.findUnreadByUserId(userId);
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<PushNotification> {
    try {
      return await PushNotificationEntity.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<number> {
    try {
      return await PushNotificationEntity.markMultipleAsRead(notificationIds);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await PushNotificationEntity.countUnreadByUserId(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<any> {
    try {
      return await PushNotificationEntity.getStats(userId);
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Send alert notification
   */
  async sendAlertNotification(
    userIds: string[],
    alertTitle: string,
    alertMessage: string,
    severity: string,
    source: 'internal' | 'pagasa' | 'philvolcs' | 'ndrrmc' = 'internal'
  ): Promise<PushNotification[]> {
    return this.sendBulkPushNotifications({
      userIds,
      title: `Alert: ${alertTitle}`,
      body: alertMessage,
      data: {
        severity,
        alertTitle,
        source,
      },
      type: 'alert',
      source,
    });
  }

  /**
   * Send SOS notification
   */
  async sendSOSNotification(
    userIds: string[],
    sosUserId: string,
    sosUserName: string
  ): Promise<PushNotification[]> {
    return this.sendBulkPushNotifications({
      userIds,
      title: '🚨 SOS Alert',
      body: `${sosUserName} has triggered an SOS signal`,
      data: {
        sosUserId,
        sosUserName,
      },
      type: 'sos',
    });
  }

  /**
   * Send incident notification
   */
  async sendIncidentNotification(
    userIds: string[],
    incidentTitle: string,
    incidentDescription: string
  ): Promise<PushNotification[]> {
    return this.sendBulkPushNotifications({
      userIds,
      title: `Incident: ${incidentTitle}`,
      body: incidentDescription,
      data: {
        incidentTitle,
      },
      type: 'incident',
    });
  }

  /**
   * Send check-in notification
   */
  async sendCheckInNotification(
    userIds: string[],
    checkInUserName: string,
    checkInStatus: string
  ): Promise<PushNotification[]> {
    return this.sendBulkPushNotifications({
      userIds,
      title: 'Check-in Update',
      body: `${checkInUserName} has checked in as ${checkInStatus}`,
      data: {
        checkInUserName,
        checkInStatus,
      },
      type: 'checkin',
    });
  }

  /**
   * Cleanup old notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      return await PushNotificationEntity.deleteOlderThan(daysOld);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Cleanup inactive device tokens
   */
  async cleanupInactiveDeviceTokens(daysInactive: number = 90): Promise<number> {
    try {
      return await DeviceTokenEntity.deleteInactiveOlderThan(daysInactive);
    } catch (error) {
      console.error('Error cleaning up inactive device tokens:', error);
      throw error;
    }
  }

  /**
   * Chunk messages for batch sending
   */
  private chunkMessages(messages: Expo.ExpoPushMessage[], chunkSize: number): Expo.ExpoPushMessage[][] {
    const chunks: Expo.ExpoPushMessage[][] = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
      chunks.push(messages.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
