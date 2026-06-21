/**
 * Guest Notification Service
 * Handles notification filtering for guest users
 * Guests can only receive alerts from PAGASA, PhilVolcs, and NDRRMC
 */

import { userService } from './userService';
import { logger } from './monitoringService';

// Allowed sources for guest users
const GUEST_ALLOWED_SOURCES = ['pagasa', 'philvolcs', 'ndrrmc'];

export interface NotificationRecipient {
  userId: string;
  isGuest: boolean;
}

class GuestNotificationService {
  /**
   * Filter users based on their role and alert source
   * Guests only receive alerts from authorized sources
   */
  async filterUsersForNotification(
    userIds: string[],
    alertSource: string = 'internal'
  ): Promise<string[]> {
    try {
      const filteredUsers: string[] = [];

      for (const userId of userIds) {
        const user = await userService.getUserById(userId);
        
        if (!user) {
          logger.warn(`User not found for notification: ${userId}`);
          continue;
        }

        // Check if user is a guest
        const isGuest = user.role === 'employee' && !user.organizationId;

        // If guest, only allow specific sources
        if (isGuest) {
          if (GUEST_ALLOWED_SOURCES.includes(alertSource)) {
            filteredUsers.push(userId);
          } else {
            logger.info(`Guest user ${userId} filtered out for alert source: ${alertSource}`);
          }
        } else {
          // Authenticated users receive all alerts
          filteredUsers.push(userId);
        }
      }

      return filteredUsers;
    } catch (error) {
      logger.error('Error filtering users for notification', { error, userIds, alertSource });
      throw error;
    }
  }

  /**
   * Check if a guest user can receive notifications from a specific source
   */
  canGuestReceiveNotification(alertSource: string = 'internal'): boolean {
    return GUEST_ALLOWED_SOURCES.includes(alertSource);
  }

  /**
   * Get allowed sources for guests
   */
  getAllowedSourcesForGuests(): string[] {
    return GUEST_ALLOWED_SOURCES;
  }
}

export const guestNotificationService = new GuestNotificationService();
export default guestNotificationService;
