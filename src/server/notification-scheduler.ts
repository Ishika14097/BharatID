/**
 * Notification Scheduler - Cron Jobs
 * 
 * Handles:
 * - Scheduled notification sending
 * - Renewal reminder scheduling
 * - Expiry alert checking
 * - Failed notification retry
 * - Cleanup of old notifications
 * - Notification log archival
 */

import { notificationEngine, DocumentExpiry, NotificationPreference } from '@/server/notification-engine';
import { channelFactory } from '@/server/notification-channels';

// ============================================================================
// SCHEDULER CONFIGURATION
// ============================================================================

export interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  jobs: {
    sendScheduledNotifications: {
      enabled: boolean;
      schedule: string;  // Cron expression
    };
    checkRenewalReminders: {
      enabled: boolean;
      schedule: string;
    };
    checkExpiryAlerts: {
      enabled: boolean;
      schedule: string;
    };
    retryFailedNotifications: {
      enabled: boolean;
      schedule: string;
    };
    cleanupOldNotifications: {
      enabled: boolean;
      schedule: string;
      daysOld: number;
    };
    archiveNotificationLogs: {
      enabled: boolean;
      schedule: string;
      daysOld: number;
    };
  };
}

// Default scheduler configuration
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  timezone: 'Asia/Kolkata',
  jobs: {
    sendScheduledNotifications: {
      enabled: true,
      schedule: '*/5 * * * *'  // Every 5 minutes
    },
    checkRenewalReminders: {
      enabled: true,
      schedule: '0 9 * * *'  // Daily at 9 AM
    },
    checkExpiryAlerts: {
      enabled: true,
      schedule: '0 */6 * * *'  // Every 6 hours
    },
    retryFailedNotifications: {
      enabled: true,
      schedule: '0 12 * * *'  // Daily at 12 PM
    },
    cleanupOldNotifications: {
      enabled: true,
      schedule: '0 2 * * 0',  // Weekly on Sunday at 2 AM
      daysOld: 90
    },
    archiveNotificationLogs: {
      enabled: true,
      schedule: '0 3 1 * *',  // Monthly on 1st at 3 AM
      daysOld: 180
    }
  }
};

// ============================================================================
// SCHEDULER STATISTICS
// ============================================================================

export interface SchedulerStats {
  jobName: string;
  lastRun: Date | null;
  nextRun: Date | null;
  lastDuration: number;  // in milliseconds
  runCount: number;
  successCount: number;
  failureCount: number;
  lastError?: string;
}

// ============================================================================
// NOTIFICATION SCHEDULER CLASS
// ============================================================================

export class NotificationScheduler {
  private config: SchedulerConfig;
  private jobStats: Map<string, SchedulerStats> = new Map();
  private isRunning = false;
  private jobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: SchedulerConfig = DEFAULT_SCHEDULER_CONFIG) {
    this.config = config;
    this.initializeJobStats();
  }

  /**
   * Initialize job statistics
   */
  private initializeJobStats(): void {
    const jobNames = [
      'sendScheduledNotifications',
      'checkRenewalReminders',
      'checkExpiryAlerts',
      'retryFailedNotifications',
      'cleanupOldNotifications',
      'archiveNotificationLogs'
    ];

    for (const jobName of jobNames) {
      this.jobStats.set(jobName, {
        jobName,
        lastRun: null,
        nextRun: null,
        lastDuration: 0,
        runCount: 0,
        successCount: 0,
        failureCount: 0
      });
    }
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[Scheduler] Disabled in configuration');
      return;
    }

    console.log('[Scheduler] Starting notification scheduler');

    // Schedule jobs (using simple interval-based approach for demo)
    if (this.config.jobs.sendScheduledNotifications.enabled) {
      this.scheduleJob(
        'sendScheduledNotifications',
        () => this.sendScheduledNotifications(),
        5 * 60 * 1000  // Every 5 minutes
      );
    }

    if (this.config.jobs.checkRenewalReminders.enabled) {
      this.scheduleJob(
        'checkRenewalReminders',
        () => this.checkRenewalReminders(),
        24 * 60 * 60 * 1000  // Daily
      );
    }

    if (this.config.jobs.checkExpiryAlerts.enabled) {
      this.scheduleJob(
        'checkExpiryAlerts',
        () => this.checkExpiryAlerts(),
        6 * 60 * 60 * 1000  // Every 6 hours
      );
    }

    if (this.config.jobs.retryFailedNotifications.enabled) {
      this.scheduleJob(
        'retryFailedNotifications',
        () => this.retryFailedNotifications(),
        24 * 60 * 60 * 1000  // Daily
      );
    }

    if (this.config.jobs.cleanupOldNotifications.enabled) {
      this.scheduleJob(
        'cleanupOldNotifications',
        () => this.cleanupOldNotifications(),
        24 * 60 * 60 * 1000  // Daily
      );
    }

    if (this.config.jobs.archiveNotificationLogs.enabled) {
      this.scheduleJob(
        'archiveNotificationLogs',
        () => this.archiveNotificationLogs(),
        24 * 60 * 60 * 1000  // Daily
      );
    }

    this.isRunning = true;
    console.log('[Scheduler] Notification scheduler started');
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('[Scheduler] Not running');
      return;
    }

    for (const [jobName, timeout] of this.jobs) {
      clearInterval(timeout);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('[Scheduler] Notification scheduler stopped');
  }

  /**
   * Schedule a job to run at interval
   */
  private scheduleJob(
    jobName: string,
    job: () => Promise<void>,
    intervalMs: number
  ): void {
    // Run immediately on first schedule
    this.executeJob(jobName, job);

    // Then schedule at interval
    const timeout = setInterval(() => {
      this.executeJob(jobName, job);
    }, intervalMs);

    this.jobs.set(jobName, timeout);
  }

  /**
   * Execute a job with error handling and stats tracking
   */
  private async executeJob(
    jobName: string,
    job: () => Promise<void>
  ): Promise<void> {
    const stats = this.jobStats.get(jobName);
    if (!stats) return;

    const startTime = Date.now();

    try {
      console.log(`[Scheduler] Starting job: ${jobName}`);
      await job();
      console.log(`[Scheduler] Job completed: ${jobName}`);

      stats.lastRun = new Date();
      stats.lastDuration = Date.now() - startTime;
      stats.runCount++;
      stats.successCount++;
      delete stats.lastError;
    } catch (error) {
      console.error(`[Scheduler] Job failed: ${jobName}`, error);

      stats.lastRun = new Date();
      stats.lastDuration = Date.now() - startTime;
      stats.runCount++;
      stats.failureCount++;
      stats.lastError = String(error);
    }
  }

  /**
   * JOB: Send scheduled notifications
   */
  private async sendScheduledNotifications(): Promise<void> {
    const readyNotifications = notificationEngine.getNotificationsReadyToSend();

    if (readyNotifications.length === 0) return;

    console.log(`[Scheduler] Processing ${readyNotifications.length} scheduled notifications`);

    for (const notification of readyNotifications) {
      try {
        // Determine channels to send
        const channels = notification.channels.filter(channel => {
          const isEnabled = notificationEngine.isChannelEnabled(notification.userId, channel);
          const isQuietHours = notificationEngine.isInQuietHours(notification.userId);

          // Skip notifications during quiet hours unless urgent
          if (isQuietHours && !notification.type.includes('urgent')) {
            return false;
          }

          return isEnabled;
        });

        if (channels.length > 0) {
          await notificationEngine.sendNotification(notification.notificationId, channels);
        }
      } catch (error) {
        console.error(`Failed to send notification ${notification.notificationId}:`, error);
      }
    }
  }

  /**
   * JOB: Check for renewal reminders
   */
  private async checkRenewalReminders(): Promise<void> {
    console.log('[Scheduler] Checking for renewal reminders');

    const state = notificationEngine.exportState();
    const userIds = new Set<string>();

    // Collect all unique user IDs
    for (const doc of Object.values(state.documentExpiries)) {
      userIds.add(doc.userId);
    }

    let created = 0;

    for (const userId of userIds) {
      const prefs = notificationEngine.getPreferences(userId);
      if (!prefs || !prefs.renewalReminders.enabled) continue;

      // Get documents expiring within reminder period
      const daysBeforeExpiry = prefs.renewalReminders.daysBeforeExpiry;
      const expiringDocs = notificationEngine.getDocumentsExpiringIn(userId, daysBeforeExpiry);

      for (const doc of expiringDocs) {
        // Check if reminder already exists
        const existing = notificationEngine.getUserNotifications(userId, {
          type: 'renewal_reminder'
        });

        const alreadyReminded = existing.some(n => n.documentId === doc.documentId);

        if (!alreadyReminded) {
          const channels = this.getActiveChannels(prefs);
          const notification = notificationEngine.createRenewalReminder(
            userId,
            doc.documentId,
            channels
          );

          if (notification) {
            await notificationEngine.sendNotification(notification.notificationId, channels);
            created++;
          }
        }
      }
    }

    console.log(`[Scheduler] Created ${created} renewal reminders`);
  }

  /**
   * JOB: Check for expiry alerts
   */
  private async checkExpiryAlerts(): Promise<void> {
    console.log('[Scheduler] Checking for expiry alerts');

    const state = notificationEngine.exportState();
    const userIds = new Set<string>();

    for (const doc of Object.values(state.documentExpiries)) {
      userIds.add(doc.userId);
    }

    let created = 0;

    for (const userId of userIds) {
      const prefs = notificationEngine.getPreferences(userId);
      if (!prefs || !prefs.expiryAlerts.enabled) continue;

      // Get recently expired documents
      const expiredDocs = notificationEngine.getExpiredDocuments(userId);

      for (const doc of expiredDocs) {
        const channels = this.getActiveChannels(prefs);
        const notification = notificationEngine.createExpiryAlert(
          userId,
          doc.documentId,
          'urgent'
        );

        if (notification) {
          await notificationEngine.sendNotification(notification.notificationId, channels);
          created++;
        }
      }

      // Check for documents expiring soon (based on alert thresholds)
      if (prefs.expiryAlerts.days30) {
        const docs30 = notificationEngine.getDocumentsExpiringIn(userId, 30);
        for (const doc of docs30) {
          const notification = notificationEngine.createExpiryAlert(userId, doc.documentId, 'alert');
          if (notification) {
            await notificationEngine.sendNotification(notification.notificationId, channels);
            created++;
          }
        }
      }
    }

    console.log(`[Scheduler] Created ${created} expiry alerts`);
  }

  /**
   * JOB: Retry failed notifications
   */
  private async retryFailedNotifications(): Promise<void> {
    console.log('[Scheduler] Retrying failed notifications');

    const retried = await notificationEngine.retryFailedNotifications();

    console.log(`[Scheduler] Retried ${retried} failed notifications`);
  }

  /**
   * JOB: Cleanup old notifications
   */
  private async cleanupOldNotifications(): Promise<void> {
    const daysOld = this.config.jobs.cleanupOldNotifications.daysOld;

    console.log(`[Scheduler] Cleaning up notifications older than ${daysOld} days`);

    const state = notificationEngine.exportState();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);

    let deleted = 0;

    for (const [notifId, notification] of Object.entries(state.notifications)) {
      if (notification.createdAt < cutoffDate) {
        notificationEngine.deleteNotification(notifId);
        deleted++;
      }
    }

    console.log(`[Scheduler] Deleted ${deleted} old notifications`);
  }

  /**
   * JOB: Archive notification logs
   */
  private async archiveNotificationLogs(): Promise<void> {
    const daysOld = this.config.jobs.archiveNotificationLogs.daysOld;

    console.log(`[Scheduler] Archiving logs older than ${daysOld} days`);

    // In production, implement actual archival to database
    // For now, just log the operation
    const state = notificationEngine.exportState();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysOld * 24 * 60 * 60 * 1000);

    const logsToArchive = state.logs.filter(log => log.timestamp < cutoffDate);

    console.log(`[Scheduler] Archived ${logsToArchive.length} log entries`);
  }

  /**
   * Helper: Get active channels based on preferences
   */
  private getActiveChannels(prefs: NotificationPreference) {
    const channels: ('email' | 'sms' | 'whatsapp')[] = [];
    if (prefs.channels.email) channels.push('email');
    if (prefs.channels.sms) channels.push('sms');
    if (prefs.channels.whatsapp) channels.push('whatsapp');
    return channels;
  }

  /**
   * Get scheduler statistics
   */
  public getStatistics(): SchedulerStats[] {
    return Array.from(this.jobStats.values());
  }

  /**
   * Get individual job statistics
   */
  public getJobStatistics(jobName: string): SchedulerStats | undefined {
    return this.jobStats.get(jobName);
  }

  /**
   * Check if scheduler is running
   */
  public isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger a job
   */
  public async triggerJob(jobName: string): Promise<void> {
    const jobMap: Record<string, () => Promise<void>> = {
      sendScheduledNotifications: () => this.sendScheduledNotifications(),
      checkRenewalReminders: () => this.checkRenewalReminders(),
      checkExpiryAlerts: () => this.checkExpiryAlerts(),
      retryFailedNotifications: () => this.retryFailedNotifications(),
      cleanupOldNotifications: () => this.cleanupOldNotifications(),
      archiveNotificationLogs: () => this.archiveNotificationLogs()
    };

    const job = jobMap[jobName];
    if (!job) {
      throw new Error(`Job not found: ${jobName}`);
    }

    console.log(`[Scheduler] Manually triggering job: ${jobName}`);
    await this.executeJob(jobName, job);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const notificationScheduler = new NotificationScheduler(DEFAULT_SCHEDULER_CONFIG);

// Auto-start if enabled
if (DEFAULT_SCHEDULER_CONFIG.enabled) {
  notificationScheduler.start();
}
