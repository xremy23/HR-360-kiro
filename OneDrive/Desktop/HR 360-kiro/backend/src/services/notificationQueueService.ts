import Queue from 'bull';
import { logger } from './monitoringService';
import pushNotificationService, { PushNotificationPayload } from './pushNotificationService';
import PushNotificationEntity from '../entities/PushNotification';

class NotificationQueueService {
  private queue: Queue.Queue;

  constructor() {
    this.queue = new Queue('push-notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });

    this.setupWorkers();
  }

  private setupWorkers() {
    this.queue.process(async (job) => {
      const { notificationId, payload } = job.data as { notificationId: string, payload: PushNotificationPayload };

      try {
        logger.info(`Processing scheduled notification ${notificationId}`);

        // Check if notification is still pending
        const notification = await PushNotificationEntity.findById(notificationId);
        if (!notification || notification.status !== 'pending') {
          logger.info(`Notification ${notificationId} is no longer pending or doesn't exist`);
          return;
        }

        // Send the notification
        await pushNotificationService.sendPushNotification(payload);

        logger.info(`Successfully sent scheduled notification ${notificationId}`);
      } catch (error) {
        logger.error(`Failed to send scheduled notification ${notificationId}`, { error });
        throw error; // Let Bull handle retries
      }
    });

    this.queue.on('error', (error) => {
      logger.error('Notification queue error', { error });
    });

    this.queue.on('failed', (job, error) => {
      logger.error(`Job failed for notification ${job.data.notificationId}`, { error });
    });
  }

  async scheduleNotification(notificationId: string, payload: PushNotificationPayload, scheduledTime: Date) {
    const delay = scheduledTime.getTime() - Date.now();

    if (delay <= 0) {
      // If time is in the past or now, just add it to queue directly
      await this.queue.add({ notificationId, payload });
    } else {
      await this.queue.add({ notificationId, payload }, { delay });
    }
  }

  async shutdown() {
    await this.queue.close();
  }
}

export const notificationQueueService = new NotificationQueueService();
