/**
 * Notification Engine for Bharat ID Platform
 * 
 * Handles:
 * - Renewal reminders (Passport, DL, KYC)
 * - Multi-channel notifications (Email, SMS, WhatsApp)
 * - User preferences
 * - Scheduled reminders
 * - Expiry tracking
 * - Real-time alerts
 * - Admin notification logs
 */

import crypto from 'crypto';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Supported document types for renewal tracking
 */
export type DocumentType = 'passport' | 'driving_license' | 'kyc' | 'aadhaar' | 'pan';

/**
 * Supported notification channels
 */
export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

/**
 * Types of notifications
 */
export type NotificationType = 
  | 'renewal_reminder'      // General renewal reminder
  | 'expiry_alert'          // Document is expiring soon (30 days)
  | 'expiry_critical'       // Document expiring very soon (7 days)
  | 'expiry_urgent'         // Document expiring in 24 hours
  | 'countdown'             // Regular expiry countdown
  | 'renewal_confirmation'  // Renewal completed
  | 'verification_request'; // KYC verification needed

/**
 * Document expiry information
 */
export interface DocumentExpiry {
  documentId: string;
  documentType: DocumentType;
  expiryDate: Date;
  issuedDate: Date;
  issuingAuthority: string;
  documentNumber: string;
  userId: string;
}

/**
 * Notification preference settings
 */
export interface NotificationPreference {
  preferenceId: string;
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  renewalReminders: {
    enabled: boolean;
    daysBeforeExpiry: number;      // How many days before expiry
    frequency: 'once' | 'weekly' | 'daily';  // How often to remind
  };
  expiryAlerts: {
    enabled: boolean;
    days30: boolean;               // Remind at 30 days
    days14: boolean;               // Remind at 14 days
    days7: boolean;                // Remind at 7 days
    days1: boolean;                // Remind at 1 day
  };
  countdownReminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'biweekly';
  };
  documentTypes: DocumentType[];   // Which documents to track
  timezone: string;                // User's timezone for scheduling
  quietHours: {
    enabled: boolean;
    startTime: string;            // HH:mm format
    endTime: string;              // HH:mm format
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual notification record
 */
export interface Notification {
  notificationId: string;
  userId: string;
  documentId: string;
  documentType: DocumentType;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  message: string;
  body: string;
  daysUntilExpiry: number;
  expiryDate: Date;
  scheduled: boolean;
  scheduledTime?: Date;
  sentAt?: Date;
  readAt?: Date;
  deliveryStatus: {
    email: 'pending' | 'sent' | 'failed' | 'skipped';
    sms: 'pending' | 'sent' | 'failed' | 'skipped';
    whatsapp: 'pending' | 'sent' | 'failed' | 'skipped';
  };
  deliveryError?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  templateId: string;
  type: NotificationType;
  documentType: DocumentType;
  subject: string;
  emailTemplate: string;
  smsTemplate: string;
  whatsappTemplate: string;
  variables: string[];  // {{documentName}}, {{expiryDate}}, etc.
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Admin notification log entry
 */
export interface NotificationLog {
  logId: string;
  notificationId: string;
  userId: string;
  action: 'created' | 'scheduled' | 'sent' | 'failed' | 'retried' | 'read' | 'deleted';
  channel: NotificationChannel;
  status: string;
  details: Record<string, any>;
  timestamp: Date;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  totalNotifications: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  deliveryRate: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  byDocumentType: Record<DocumentType, number>;
}

// ============================================================================
// NOTIFICATION ENGINE CLASS
// ============================================================================

export class NotificationEngine {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private logs: NotificationLog[] = [];
  private documentExpiries: Map<string, DocumentExpiry> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // ========================================================================
  // PREFERENCE MANAGEMENT
  // ========================================================================

  /**
   * Create or update user notification preferences
   */
  public createOrUpdatePreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): NotificationPreference {
    const existing = this.preferences.get(userId);

    const preference: NotificationPreference = {
      preferenceId: existing?.preferenceId || crypto.randomUUID(),
      userId,
      channels: preferences.channels || {
        email: true,
        sms: false,
        whatsapp: false
      },
      renewalReminders: preferences.renewalReminders || {
        enabled: true,
        daysBeforeExpiry: 30,
        frequency: 'once'
      },
      expiryAlerts: preferences.expiryAlerts || {
        enabled: true,
        days30: true,
        days14: true,
        days7: true,
        days1: false
      },
      countdownReminders: preferences.countdownReminders || {
        enabled: false,
        frequency: 'weekly'
      },
      documentTypes: preferences.documentTypes || [
        'passport',
        'driving_license',
        'kyc'
      ],
      timezone: preferences.timezone || 'UTC',
      quietHours: preferences.quietHours || {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };

    this.preferences.set(userId, preference);
    return preference;
  }

  /**
   * Get user notification preferences
   */
  public getPreferences(userId: string): NotificationPreference | undefined {
    return this.preferences.get(userId);
  }

  /**
   * Delete user notification preferences
   */
  public deletePreferences(userId: string): boolean {
    return this.preferences.delete(userId);
  }

  /**
   * Check if channel is enabled for user
   */
  public isChannelEnabled(
    userId: string,
    channel: NotificationChannel
  ): boolean {
    const prefs = this.getPreferences(userId);
    if (!prefs) return false;
    return prefs.channels[channel];
  }

  /**
   * Check if user is in quiet hours
   */
  public isInQuietHours(userId: string): boolean {
    const prefs = this.getPreferences(userId);
    if (!prefs || !prefs.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      currentTime >= prefs.quietHours.startTime &&
      currentTime <= prefs.quietHours.endTime
    );
  }

  // ========================================================================
  // DOCUMENT EXPIRY TRACKING
  // ========================================================================

  /**
   * Register document for expiry tracking
   */
  public registerDocument(expiry: DocumentExpiry): DocumentExpiry {
    this.documentExpiries.set(expiry.documentId, expiry);
    return expiry;
  }

  /**
   * Get days until document expiry
   */
  public getDaysUntilExpiry(documentId: string): number | null {
    const expiry = this.documentExpiries.get(documentId);
    if (!expiry) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(expiry.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);

    const timeDiff = expiryDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Get documents expiring soon
   */
  public getDocumentsExpiringIn(
    userId: string,
    daysThreshold: number
  ): DocumentExpiry[] {
    return Array.from(this.documentExpiries.values()).filter(doc => {
      if (doc.userId !== userId) return false;
      const daysUntil = this.getDaysUntilExpiry(doc.documentId);
      return daysUntil !== null && daysUntil <= daysThreshold && daysUntil > 0;
    });
  }

  /**
   * Get expired documents
   */
  public getExpiredDocuments(userId: string): DocumentExpiry[] {
    return Array.from(this.documentExpiries.values()).filter(doc => {
      if (doc.userId !== userId) return false;
      const daysUntil = this.getDaysUntilExpiry(doc.documentId);
      return daysUntil !== null && daysUntil <= 0;
    });
  }

  /**
   * Update document expiry date
   */
  public updateDocumentExpiry(documentId: string, newExpiryDate: Date): boolean {
    const doc = this.documentExpiries.get(documentId);
    if (!doc) return false;

    doc.expiryDate = newExpiryDate;
    this.documentExpiries.set(documentId, doc);
    return true;
  }

  // ========================================================================
  // NOTIFICATION GENERATION
  // ========================================================================

  /**
   * Create renewal reminder notification
   */
  public createRenewalReminder(
    userId: string,
    documentId: string,
    channels: NotificationChannel[] = ['email']
  ): Notification | null {
    const expiry = this.documentExpiries.get(documentId);
    if (!expiry || expiry.userId !== userId) return null;

    const daysUntilExpiry = this.getDaysUntilExpiry(documentId);
    if (daysUntilExpiry === null || daysUntilExpiry < 0) return null;

    const template = this.getTemplateForType(
      'renewal_reminder',
      expiry.documentType
    );

    const notification: Notification = {
      notificationId: crypto.randomUUID(),
      userId,
      documentId,
      documentType: expiry.documentType,
      type: 'renewal_reminder',
      channels,
      subject: template?.subject || 'Document Renewal Reminder',
      message: this.formatTemplate(
        template?.emailTemplate || '',
        expiry,
        daysUntilExpiry
      ),
      body: this.formatTemplate(
        template?.smsTemplate || '',
        expiry,
        daysUntilExpiry
      ),
      daysUntilExpiry,
      expiryDate: expiry.expiryDate,
      scheduled: false,
      deliveryStatus: {
        email: channels.includes('email') ? 'pending' : 'skipped',
        sms: channels.includes('sms') ? 'pending' : 'skipped',
        whatsapp: channels.includes('whatsapp') ? 'pending' : 'skipped'
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notifications.set(notification.notificationId, notification);
    this.log(notification.notificationId, userId, 'created', 'system', 'Notification created');

    return notification;
  }

  /**
   * Create expiry alert notification
   */
  public createExpiryAlert(
    userId: string,
    documentId: string,
    severity: 'alert' | 'critical' | 'urgent' = 'alert'
  ): Notification | null {
    const expiry = this.documentExpiries.get(documentId);
    if (!expiry || expiry.userId !== userId) return null;

    const daysUntilExpiry = this.getDaysUntilExpiry(documentId);
    if (daysUntilExpiry === null || daysUntilExpiry < 0) return null;

    // Determine notification type based on days remaining
    let notificationType: NotificationType = 'expiry_alert';
    if (daysUntilExpiry <= 1) notificationType = 'expiry_urgent';
    else if (daysUntilExpiry <= 7) notificationType = 'expiry_critical';

    const prefs = this.getPreferences(userId);
    const channels: NotificationChannel[] = [];
    if (prefs?.channels.email) channels.push('email');
    if (prefs?.channels.sms) channels.push('sms');
    if (prefs?.channels.whatsapp) channels.push('whatsapp');

    const template = this.getTemplateForType(notificationType, expiry.documentType);

    const notification: Notification = {
      notificationId: crypto.randomUUID(),
      userId,
      documentId,
      documentType: expiry.documentType,
      type: notificationType,
      channels,
      subject: template?.subject || `${this.documentTypeLabel(expiry.documentType)} Expiring Soon`,
      message: this.formatTemplate(
        template?.emailTemplate || '',
        expiry,
        daysUntilExpiry
      ),
      body: this.formatTemplate(
        template?.smsTemplate || '',
        expiry,
        daysUntilExpiry
      ),
      daysUntilExpiry,
      expiryDate: expiry.expiryDate,
      scheduled: false,
      deliveryStatus: {
        email: channels.includes('email') ? 'pending' : 'skipped',
        sms: channels.includes('sms') ? 'pending' : 'skipped',
        whatsapp: channels.includes('whatsapp') ? 'pending' : 'skipped'
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notifications.set(notification.notificationId, notification);
    this.log(notification.notificationId, userId, 'created', 'system', `${notificationType} created`);

    return notification;
  }

  /**
   * Create countdown reminder
   */
  public createCountdownReminder(userId: string): Notification[] {
    const prefs = this.getPreferences(userId);
    if (!prefs || !prefs.countdownReminders.enabled) return [];

    const expiringDocs = this.getDocumentsExpiringIn(userId, 90);
    const notifications: Notification[] = [];

    for (const doc of expiringDocs) {
      const daysUntil = this.getDaysUntilExpiry(doc.documentId);
      if (daysUntil === null) continue;

      const channels: NotificationChannel[] = [];
      if (prefs.channels.email) channels.push('email');
      if (prefs.channels.sms) channels.push('sms');
      if (prefs.channels.whatsapp) channels.push('whatsapp');

      const notification: Notification = {
        notificationId: crypto.randomUUID(),
        userId,
        documentId: doc.documentId,
        documentType: doc.documentType,
        type: 'countdown',
        channels,
        subject: `${this.documentTypeLabel(doc.documentType)} expires in ${daysUntil} days`,
        message: `Your ${this.documentTypeLabel(doc.documentType)} will expire on ${doc.expiryDate.toLocaleDateString()}`,
        body: `${this.documentTypeLabel(doc.documentType)} expires in ${daysUntil} days`,
        daysUntilExpiry: daysUntil,
        expiryDate: doc.expiryDate,
        scheduled: false,
        deliveryStatus: {
          email: channels.includes('email') ? 'pending' : 'skipped',
          sms: channels.includes('sms') ? 'pending' : 'skipped',
          whatsapp: channels.includes('whatsapp') ? 'pending' : 'skipped'
        },
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.notifications.set(notification.notificationId, notification);
      notifications.push(notification);
    }

    return notifications;
  }

  // ========================================================================
  // NOTIFICATION DELIVERY
  // ========================================================================

  /**
   * Send notification via specified channels
   */
  public async sendNotification(
    notificationId: string,
    channels?: NotificationChannel[]
  ): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    const channelsToSend = channels || notification.channels;
    let allSuccessful = true;

    for (const channel of channelsToSend) {
      try {
        const success = await this.sendViaChannel(notification, channel);
        if (success) {
          notification.deliveryStatus[channel] = 'sent';
          notification.sentAt = new Date();
          this.log(notificationId, notification.userId, 'sent', channel, 'Sent successfully');
        } else {
          notification.deliveryStatus[channel] = 'failed';
          notification.retryCount++;
          this.log(notificationId, notification.userId, 'failed', channel, 'Send failed');
          allSuccessful = false;
        }
      } catch (error) {
        notification.deliveryStatus[channel] = 'failed';
        notification.deliveryError = String(error);
        notification.retryCount++;
        allSuccessful = false;
      }
    }

    notification.updatedAt = new Date();
    this.notifications.set(notificationId, notification);

    return allSuccessful;
  }

  /**
   * Send via individual channel
   */
  private async sendViaChannel(
    notification: Notification,
    channel: NotificationChannel
  ): Promise<boolean> {
    // In production, integrate with actual providers
    // For now, simulate successful send
    console.log(`[${channel.toUpperCase()}] Sending to user ${notification.userId}:`, {
      type: notification.type,
      documentType: notification.documentType,
      subject: notification.subject,
      message: notification.message
    });

    return true;
  }

  /**
   * Retry failed notifications
   */
  public async retryFailedNotifications(): Promise<number> {
    let retried = 0;

    for (const [id, notification] of this.notifications) {
      if (notification.retryCount < notification.maxRetries) {
        // Find failed channels
        const failedChannels: NotificationChannel[] = [];
        for (const channel of notification.channels) {
          if (notification.deliveryStatus[channel] === 'failed') {
            failedChannels.push(channel);
          }
        }

        if (failedChannels.length > 0) {
          await this.sendNotification(id, failedChannels);
          retried++;
        }
      }
    }

    return retried;
  }

  // ========================================================================
  // NOTIFICATION RETRIEVAL
  // ========================================================================

  /**
   * Get notification by ID
   */
  public getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  /**
   * Get all notifications for user
   */
  public getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: NotificationType;
      status?: 'pending' | 'sent' | 'read';
    }
  ): Notification[] {
    let notifications = Array.from(this.notifications.values()).filter(
      n => n.userId === userId
    );

    // Filter by type
    if (options?.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }

    // Filter by status
    if (options?.status) {
      if (options.status === 'pending') {
        notifications = notifications.filter(
          n =>
            n.deliveryStatus.email === 'pending' ||
            n.deliveryStatus.sms === 'pending' ||
            n.deliveryStatus.whatsapp === 'pending'
        );
      } else if (options.status === 'sent') {
        notifications = notifications.filter(
          n =>
            (n.deliveryStatus.email === 'sent' ||
              n.deliveryStatus.email === 'skipped') &&
            (n.deliveryStatus.sms === 'sent' ||
              n.deliveryStatus.sms === 'skipped') &&
            (n.deliveryStatus.whatsapp === 'sent' ||
              n.deliveryStatus.whatsapp === 'skipped')
        );
      } else if (options.status === 'read') {
        notifications = notifications.filter(n => !!n.readAt);
      }
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return notifications.slice(offset, offset + limit);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.readAt = new Date();
    this.log(notificationId, notification.userId, 'read', 'system', 'Marked as read');

    return true;
  }

  /**
   * Delete notification
   */
  public deleteNotification(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    this.log(notificationId, notification.userId, 'deleted', 'system', 'Notification deleted');
    return this.notifications.delete(notificationId);
  }

  // ========================================================================
  // SCHEDULED NOTIFICATIONS
  // ========================================================================

  /**
   * Schedule notification for specific time
   */
  public scheduleNotification(
    notificationId: string,
    scheduledTime: Date
  ): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.scheduled = true;
    notification.scheduledTime = scheduledTime;
    this.log(notificationId, notification.userId, 'scheduled', 'system', `Scheduled for ${scheduledTime}`);

    return true;
  }

  /**
   * Get scheduled notifications
   */
  public getScheduledNotifications(): Notification[] {
    return Array.from(this.notifications.values()).filter(
      n => n.scheduled && !n.sentAt
    );
  }

  /**
   * Get notifications ready to send (scheduled time has passed)
   */
  public getNotificationsReadyToSend(): Notification[] {
    const now = new Date();
    return this.getScheduledNotifications().filter(
      n => n.scheduledTime && n.scheduledTime <= now
    );
  }

  // ========================================================================
  // ADMIN LOGGING
  // ========================================================================

  /**
   * Log notification action for audit trail
   */
  private log(
    notificationId: string,
    userId: string,
    action: 'created' | 'scheduled' | 'sent' | 'failed' | 'retried' | 'read' | 'deleted',
    channel: NotificationChannel | 'system',
    details: string
  ): void {
    const logEntry: NotificationLog = {
      logId: crypto.randomUUID(),
      notificationId,
      userId,
      action,
      channel: channel as any,
      status: action,
      details: { message: details },
      timestamp: new Date()
    };

    this.logs.push(logEntry);
  }

  /**
   * Get admin notification logs
   */
  public getAdminLogs(options?: {
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): NotificationLog[] {
    let logs = [...this.logs];

    if (options?.userId) {
      logs = logs.filter(l => l.userId === options.userId);
    }

    if (options?.action) {
      logs = logs.filter(l => l.action === options.action);
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    return logs.slice(offset, offset + limit);
  }

  /**
   * Get notification statistics
   */
  public getStatistics(userId?: string): NotificationStats {
    let notifications = Array.from(this.notifications.values());

    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    const stats: NotificationStats = {
      totalNotifications: notifications.length,
      sentCount: notifications.filter(
        n =>
          n.deliveryStatus.email === 'sent' ||
          n.deliveryStatus.sms === 'sent' ||
          n.deliveryStatus.whatsapp === 'sent'
      ).length,
      failedCount: notifications.filter(
        n =>
          n.deliveryStatus.email === 'failed' ||
          n.deliveryStatus.sms === 'failed' ||
          n.deliveryStatus.whatsapp === 'failed'
      ).length,
      pendingCount: notifications.filter(
        n =>
          n.deliveryStatus.email === 'pending' ||
          n.deliveryStatus.sms === 'pending' ||
          n.deliveryStatus.whatsapp === 'pending'
      ).length,
      deliveryRate: 0,
      byType: {} as Record<NotificationType, number>,
      byChannel: {} as Record<NotificationChannel, number>,
      byDocumentType: {} as Record<DocumentType, number>
    };

    // Calculate delivery rate
    if (stats.totalNotifications > 0) {
      stats.deliveryRate = Math.round(
        ((stats.sentCount + stats.failedCount) / stats.totalNotifications) * 100
      );
    }

    // Count by type
    for (const notif of notifications) {
      stats.byType[notif.type] = (stats.byType[notif.type] || 0) + 1;
      stats.byDocumentType[notif.documentType] = (stats.byDocumentType[notif.documentType] || 0) + 1;

      for (const channel of notif.channels) {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
      }
    }

    return stats;
  }

  // ========================================================================
  // TEMPLATES
  // ========================================================================

  /**
   * Initialize default notification templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        templateId: crypto.randomUUID(),
        type: 'renewal_reminder',
        documentType: 'passport',
        subject: 'Time to Renew Your Passport',
        emailTemplate: `Dear {{firstName}},

Your passport ({{documentNumber}}) will expire on {{expiryDate}}.

To avoid any inconvenience, we recommend renewing your passport now.

Best regards,
Bharat ID Team`,
        smsTemplate: 'Your passport expires on {{expiryDate}}. Renew now to avoid delays. Visit Bharat ID platform.',
        whatsappTemplate: 'Hi {{firstName}}, your passport expires on {{expiryDate}}. Tap to renew: {{link}}',
        variables: ['firstName', 'documentNumber', 'expiryDate', 'link'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        templateId: crypto.randomUUID(),
        type: 'expiry_critical',
        documentType: 'passport',
        subject: 'URGENT: Your Passport Expires in {{daysUntilExpiry}} Days',
        emailTemplate: `Dear {{firstName}},

URGENT: Your passport ({{documentNumber}}) will expire in {{daysUntilExpiry}} days ({{expiryDate}}).

Renew immediately to avoid travel disruptions.

Visit: {{link}}

Best regards,
Bharat ID Team`,
        smsTemplate: 'URGENT: Your passport expires in {{daysUntilExpiry}} days. Renew NOW at {{link}}',
        whatsappTemplate: '⚠️ Your passport expires in {{daysUntilExpiry}} days! Renew now: {{link}}',
        variables: ['firstName', 'documentNumber', 'expiryDate', 'daysUntilExpiry', 'link'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        templateId: crypto.randomUUID(),
        type: 'renewal_reminder',
        documentType: 'driving_license',
        subject: 'Renew Your Driving License',
        emailTemplate: `Dear {{firstName}},

Your driving license ({{documentNumber}}) will expire on {{expiryDate}}.

Renew your license before expiry to continue driving legally.

Best regards,
Bharat ID Team`,
        smsTemplate: 'Your driving license expires on {{expiryDate}}. Renew now. Visit Bharat ID platform.',
        whatsappTemplate: 'Hi {{firstName}}, renew your driving license before {{expiryDate}}. Link: {{link}}',
        variables: ['firstName', 'documentNumber', 'expiryDate', 'link'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        templateId: crypto.randomUUID(),
        type: 'expiry_alert',
        documentType: 'kyc',
        subject: 'Your KYC Verification Expires Soon',
        emailTemplate: `Dear {{firstName}},

Your KYC verification will expire on {{expiryDate}}.

Complete your KYC re-verification to maintain account access.

Best regards,
Bharat ID Team`,
        smsTemplate: 'Your KYC expires on {{expiryDate}}. Re-verify now at Bharat ID platform.',
        whatsappTemplate: 'Your KYC expires on {{expiryDate}}. Verify now: {{link}}',
        variables: ['firstName', 'expiryDate', 'link'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.templateId, template);
    }
  }

  /**
   * Get template for notification type and document
   */
  private getTemplateForType(
    type: NotificationType,
    documentType: DocumentType
  ): NotificationTemplate | undefined {
    return Array.from(this.templates.values()).find(
      t => t.type === type && t.documentType === documentType
    );
  }

  /**
   * Format template with variables
   */
  private formatTemplate(
    template: string,
    expiry: DocumentExpiry,
    daysUntilExpiry: number
  ): string {
    return template
      .replace(/{{documentNumber}}/g, expiry.documentNumber)
      .replace(/{{expiryDate}}/g, expiry.expiryDate.toLocaleDateString())
      .replace(/{{daysUntilExpiry}}/g, String(daysUntilExpiry))
      .replace(/{{documentType}}/g, this.documentTypeLabel(expiry.documentType))
      .replace(/{{issuingAuthority}}/g, expiry.issuingAuthority);
  }

  /**
   * Get human-readable label for document type
   */
  private documentTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      passport: 'Passport',
      driving_license: 'Driving License',
      kyc: 'KYC',
      aadhaar: 'Aadhaar',
      pan: 'PAN'
    };
    return labels[type];
  }

  /**
   * Export engine state
   */
  public exportState(): {
    notifications: Record<string, Notification>;
    preferences: Record<string, NotificationPreference>;
    documentExpiries: Record<string, DocumentExpiry>;
    logs: NotificationLog[];
  } {
    return {
      notifications: Object.fromEntries(this.notifications),
      preferences: Object.fromEntries(this.preferences),
      documentExpiries: Object.fromEntries(this.documentExpiries),
      logs: this.logs
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const notificationEngine = new NotificationEngine();
