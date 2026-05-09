/**
 * Notification Channel Handlers
 * 
 * Integrations for:
 * - Email (SendGrid, AWS SES)
 * - SMS (Twilio, AWS SNS)
 * - WhatsApp (Twilio, WhatsApp Business API)
 */

import { Notification, DocumentExpiry } from '@/server/notification-engine';

// ============================================================================
// EMAIL CHANNEL
// ============================================================================

export interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp';
  apiKey?: string;
  from: string;
  fromName: string;
  replyTo?: string;
  region?: string;
  host?: string;
  port?: number;
  secure?: boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailChannelHandler {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send email notification
   */
  async send(
    to: string,
    notification: Notification,
    recipientName?: string
  ): Promise<EmailResult> {
    try {
      // In production, implement actual provider integration
      const emailContent = this.buildEmailContent(notification, recipientName);

      console.log('[EMAIL] Sending notification:', {
        to,
        from: this.config.from,
        subject: notification.subject,
        messageId: notification.notificationId
      });

      // Simulate provider response
      return {
        success: true,
        messageId: `email_${notification.notificationId}_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Build HTML email content
   */
  private buildEmailContent(
    notification: Notification,
    recipientName?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #004aad; color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background-color: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
            .alert { color: #d9534f; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Bharat ID Notification</h2>
            </div>
            <div class="content">
              ${recipientName ? `<p>Dear ${recipientName},</p>` : '<p>Dear User,</p>'}
              <p>${notification.message}</p>
              <p class="alert">Action Required: ${this.getActionText(notification.type)}</p>
              <p>
                <a href="https://bharat-id.gov.in/dashboard" style="
                  display: inline-block;
                  padding: 10px 20px;
                  background-color: #004aad;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                ">
                  View in Dashboard
                </a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message from Bharat ID Platform</p>
              <p>Notification ID: ${notification.notificationId}</p>
              <p>&copy; 2026 Bharat ID. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getActionText(type: string): string {
    const actions: Record<string, string> = {
      renewal_reminder: 'Renew your document to maintain validity',
      expiry_alert: 'Your document is expiring soon. Renew immediately',
      expiry_critical: 'URGENT: Document expiring very soon. Renew now',
      expiry_urgent: 'CRITICAL: Document expires tomorrow. Renew immediately',
      countdown: 'Check your document status',
      renewal_confirmation: 'Your renewal has been processed',
      verification_request: 'Complete your verification'
    };
    return actions[type] || 'Take action';
  }
}

// ============================================================================
// SMS CHANNEL
// ============================================================================

export interface SMSConfig {
  provider: 'twilio' | 'sns';
  accountSid?: string;
  authToken?: string;
  fromNumber: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export class SMSChannelHandler {
  private config: SMSConfig;
  private charLimit = 160;  // Standard SMS character limit

  constructor(config: SMSConfig) {
    this.config = config;
  }

  /**
   * Send SMS notification
   */
  async send(
    phoneNumber: string,
    notification: Notification
  ): Promise<SMSResult> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        };
      }

      // Build SMS content
      const smsContent = this.buildSMSContent(notification);

      // Check if message needs to be split
      const messages = this.splitSMS(smsContent);

      console.log('[SMS] Sending notification:', {
        to: phoneNumber,
        parts: messages.length,
        totalChars: smsContent.length,
        messageId: notification.notificationId
      });

      // Simulate provider response
      return {
        success: true,
        messageId: `sms_${notification.notificationId}_${Date.now()}`,
        cost: messages.length * 0.05  // Approx cost per SMS part
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Build SMS content with character limit
   */
  private buildSMSContent(notification: Notification): string {
    const urgencyPrefix = this.getUrgencyPrefix(notification.type);
    let content = `${urgencyPrefix}${notification.body}\n\nBharat ID Platform`;

    // Truncate if too long
    if (content.length > 320) {
      content = content.substring(0, 317) + '...';
    }

    return content;
  }

  /**
   * Get urgency prefix for SMS
   */
  private getUrgencyPrefix(type: string): string {
    if (type === 'expiry_urgent') return '⚠️ URGENT: ';
    if (type === 'expiry_critical') return '🚨 CRITICAL: ';
    if (type.includes('expiry')) return '⏰ ';
    return '';
  }

  /**
   * Split SMS into 160-character chunks
   */
  private splitSMS(content: string): string[] {
    const messages: string[] = [];
    let remaining = content;

    while (remaining.length > 0) {
      if (remaining.length <= this.charLimit) {
        messages.push(remaining);
        break;
      }

      messages.push(remaining.substring(0, this.charLimit));
      remaining = remaining.substring(this.charLimit);
    }

    return messages;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Support: +919876543210, 919876543210, 9876543210
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
    return phoneRegex.test(cleaned);
  }

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[\s\-()]/g, '');

    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('91')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+91' + cleaned;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// WHATSAPP CHANNEL
// ============================================================================

export interface WhatsAppConfig {
  provider: 'twilio' | 'whatsapp_business';
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  templateNamespace?: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
}

export class WhatsAppChannelHandler {
  private config: WhatsAppConfig;
  private charLimit = 4096;  // WhatsApp message character limit

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  /**
   * Send WhatsApp notification
   */
  async send(
    phoneNumber: string,
    notification: Notification,
    recipientName?: string
  ): Promise<WhatsAppResult> {
    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      // Build WhatsApp message
      const messageContent = this.buildWhatsAppMessage(notification, recipientName);

      console.log('[WhatsApp] Sending notification:', {
        to: normalizedPhone,
        type: notification.type,
        messageId: notification.notificationId
      });

      // Simulate provider response
      return {
        success: true,
        messageId: `wa_${notification.notificationId}_${Date.now()}`,
        status: 'queued'
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Send WhatsApp template message
   */
  async sendTemplate(
    phoneNumber: string,
    templateName: string,
    variables: Record<string, string>,
    notification: Notification
  ): Promise<WhatsAppResult> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      console.log('[WhatsApp Template] Sending:', {
        to: normalizedPhone,
        template: templateName,
        variables,
        messageId: notification.notificationId
      });

      return {
        success: true,
        messageId: `wa_tmpl_${notification.notificationId}_${Date.now()}`,
        status: 'queued'
      };
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Build WhatsApp message with rich formatting
   */
  private buildWhatsAppMessage(
    notification: Notification,
    recipientName?: string
  ): string {
    const emoji = this.getNotificationEmoji(notification.type);
    const urgency = this.getUrgencyLevel(notification.type);

    let message = `${emoji} *${notification.subject}*\n\n`;

    if (recipientName) {
      message += `Hi ${recipientName},\n\n`;
    }

    message += `${notification.body}\n\n`;

    if (notification.daysUntilExpiry <= 7) {
      message += `⏱️ *Days Remaining: ${notification.daysUntilExpiry}*\n\n`;
    }

    message += `*Action:* Tap the link below to ${this.getActionDescription(notification.type)}\n`;
    message += `https://bharat-id.gov.in/dash?ref=${notification.notificationId}\n\n`;
    message += `_Bharat ID Platform_`;

    return message;
  }

  /**
   * Get emoji for notification type
   */
  private getNotificationEmoji(type: string): string {
    const emojis: Record<string, string> = {
      renewal_reminder: '📋',
      expiry_alert: '⏰',
      expiry_critical: '🚨',
      expiry_urgent: '🆘',
      countdown: '📊',
      renewal_confirmation: '✅',
      verification_request: '🔐'
    };
    return emojis[type] || '📢';
  }

  /**
   * Get urgency level
   */
  private getUrgencyLevel(type: string): 'low' | 'medium' | 'high' | 'critical' {
    if (type === 'expiry_urgent') return 'critical';
    if (type === 'expiry_critical') return 'high';
    if (type.includes('expiry')) return 'medium';
    return 'low';
  }

  /**
   * Get action description
   */
  private getActionDescription(type: string): string {
    const actions: Record<string, string> = {
      renewal_reminder: 'renew your document',
      expiry_alert: 'renew your document now',
      expiry_critical: 'renew immediately',
      expiry_urgent: 'renew right now',
      countdown: 'view your status',
      renewal_confirmation: 'view confirmation',
      verification_request: 'complete verification'
    };
    return actions[type] || 'take action';
  }

  /**
   * Normalize phone number to format expected by WhatsApp
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/[\s\-()]/g, '');

    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      }
      cleaned = '91' + cleaned;
    } else {
      cleaned = cleaned.substring(1);
    }

    return cleaned;
  }
}

// ============================================================================
// CHANNEL FACTORY
// ============================================================================

export type ChannelConfig = EmailConfig | SMSConfig | WhatsAppConfig;

export class NotificationChannelFactory {
  private emailHandler?: EmailChannelHandler;
  private smsHandler?: SMSChannelHandler;
  private whatsappHandler?: WhatsAppChannelHandler;

  /**
   * Initialize email channel
   */
  public initializeEmail(config: EmailConfig): void {
    this.emailHandler = new EmailChannelHandler(config);
  }

  /**
   * Initialize SMS channel
   */
  public initializeSMS(config: SMSConfig): void {
    this.smsHandler = new SMSChannelHandler(config);
  }

  /**
   * Initialize WhatsApp channel
   */
  public initializeWhatsApp(config: WhatsAppConfig): void {
    this.whatsappHandler = new WhatsAppChannelHandler(config);
  }

  /**
   * Get email handler
   */
  public getEmailHandler(): EmailChannelHandler {
    if (!this.emailHandler) {
      throw new Error('Email handler not initialized');
    }
    return this.emailHandler;
  }

  /**
   * Get SMS handler
   */
  public getSMSHandler(): SMSChannelHandler {
    if (!this.smsHandler) {
      throw new Error('SMS handler not initialized');
    }
    return this.smsHandler;
  }

  /**
   * Get WhatsApp handler
   */
  public getWhatsAppHandler(): WhatsAppChannelHandler {
    if (!this.whatsappHandler) {
      throw new Error('WhatsApp handler not initialized');
    }
    return this.whatsappHandler;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const channelFactory = new NotificationChannelFactory();

// Initialize with default configs (customize in production)
channelFactory.initializeEmail({
  provider: 'sendgrid',
  apiKey: process.env.SENDGRID_API_KEY || 'demo_key',
  from: 'noreply@bharat-id.gov.in',
  fromName: 'Bharat ID Platform'
});

channelFactory.initializeSMS({
  provider: 'twilio',
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'demo_sid',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'demo_token',
  fromNumber: process.env.TWILIO_PHONE_NUMBER || '+919999999999'
});

channelFactory.initializeWhatsApp({
  provider: 'twilio',
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'demo_sid',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'demo_token',
  fromNumber: process.env.WHATSAPP_FROM_NUMBER || 'whatsapp:+919999999999'
});
