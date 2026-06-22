import { logger } from './monitoringService';
import { communityReportService } from './communityReportService';
import { pushNotificationService } from './pushNotificationService';

/**
 * Background Job Service
 * Manages scheduled jobs like auto-purge of expired community reports
 */
class BackgroundJobService {
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  /**
   * Initialize all background jobs
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing background job service...');
      this.isRunning = true;

      // Schedule auto-purge job for community reports (runs every hour)
      this.scheduleJob('purge-expired-reports', this.purgeExpiredReports.bind(this), 60 * 60 * 1000); // 1 hour

      // Schedule job to process scheduled push notifications (runs every minute)
      this.scheduleJob('process-scheduled-notifications', pushNotificationService.processScheduledNotifications.bind(pushNotificationService), 60 * 1000); // 1 minute

      // Also run immediately on startup
      await this.purgeExpiredReports();
      await pushNotificationService.processScheduledNotifications();

      logger.info('Background job service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize background job service', { error });
      throw error;
    }
  }

  /**
   * Schedule a job to run at regular intervals
   */
  private scheduleJob(name: string, job: () => Promise<void>, interval: number): void {
    try {
      logger.info(`Scheduling job: ${name} (interval: ${interval}ms)`);

      // Run immediately on first schedule
      job().catch((error) => {
        logger.error(`Job failed on initial run: ${name}`, { error });
      });

      // Then run at intervals
      const timeout = setInterval(async () => {
        try {
          await job();
        } catch (error) {
          logger.error(`Job failed during scheduled execution: ${name}`, { error });
        }
      }, interval);

      this.jobs.set(name, timeout);
      logger.info(`Job scheduled: ${name}`);
    } catch (error) {
      logger.error(`Failed to schedule job: ${name}`, { error });
    }
  }

  /**
   * Auto-purge expired community reports (7+ days old)
   */
  private async purgeExpiredReports(): Promise<void> {
    try {
      logger.debug('Running auto-purge job for expired community reports...');
      const purgedCount = await communityReportService.purgeExpiredReports();
      if (purgedCount > 0) {
        logger.info('Auto-purged expired community reports', { count: purgedCount });
      }
    } catch (error) {
      logger.error('Failed to auto-purge expired community reports', { error });
      throw error;
    }
  }

  /**
   * Stop all background jobs
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down background job service...');
      this.isRunning = false;

      for (const [name, timeout] of this.jobs.entries()) {
        clearInterval(timeout);
        logger.info(`Cleared job: ${name}`);
      }

      this.jobs.clear();
      logger.info('Background job service shut down successfully');
    } catch (error) {
      logger.error('Failed to shut down background job service', { error });
      throw error;
    }
  }

  /**
   * Check if service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get status of all scheduled jobs
   */
  getJobStatus(): { [key: string]: string } {
    const status: { [key: string]: string } = {};
    for (const name of this.jobs.keys()) {
      status[name] = 'active';
    }
    return status;
  }
}

export const backgroundJobService = new BackgroundJobService();
