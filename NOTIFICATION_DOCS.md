# Notification Engine Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Features](#features)
5. [Getting Started](#getting-started)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)
8. [Cron Jobs](#cron-jobs)
9. [Database Schema](#database-schema)
10. [Examples](#examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Notification Engine is a comprehensive system for managing document renewal reminders, expiry alerts, and user communications across multiple channels (Email, SMS, WhatsApp) for the Bharat ID platform.

### Key Features

- 🔔 **Multi-channel delivery** (Email, SMS, WhatsApp)
- ⏰ **Scheduled notifications** with cron job support
- 📋 **Document expiry tracking** (Passport, DL, KYC, Aadhaar, PAN)
- 👤 **User preferences** for notification control
- 📊 **Admin logs** and audit trails
- 🔄 **Automatic retry** of failed notifications
- 📈 **Statistics and analytics**
- 🛠️ **Template-based messaging**

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Bharat ID Platform                        │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐         ┌─────────────┐      ┌────────────┐
   │   API   │         │ React UI    │      │ Scheduler  │
   │Handlers │         │ Components  │      │  (Cron)    │
   └────────┬┘         └─────────────┘      └────────┬───┘
            │                                         │
            └─────────────────┬───────────────────────┘
                              │
            ┌─────────────────▼────────────────────┐
            │  Notification Engine                 │
            │ ┌────────────────────────────────┐   │
            │ │ Field Matching & Validation    │   │
            │ │ Preference Management          │   │
            │ │ Document Expiry Tracking       │   │
            │ │ Notification Generation        │   │
            │ └────────────────────────────────┘   │
            └─────────────────┬────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌─────────┐         ┌──────────┐         ┌─────────────┐
   │  Email  │         │   SMS    │         │  WhatsApp   │
   │ Channel │         │ Channel  │         │   Channel   │
   └────┬────┘         └────┬─────┘         └────┬────────┘
        │                   │                    │
        ▼                   ▼                    ▼
   ┌─────────┐         ┌──────────┐         ┌─────────────┐
   │ SendGrid│         │  Twilio  │         │   Twilio    │
   │  / SES  │         │  / SNS   │         │  WhatsApp   │
   └─────────┘         └──────────┘         └─────────────┘
```

### Component Hierarchy

```
NotificationEngine (Core)
├── FieldMatchingEngine
│   ├── Document Type Support
│   └── Matching Algorithms
├── PreferenceManager
│   ├── Channel Configuration
│   ├── Document Type Selection
│   └── Schedule Management
├── DocumentExpiryTracker
│   ├── Days Until Expiry
│   ├── Expiring Documents
│   └── Expired Documents
├── NotificationFactory
│   ├── Renewal Reminder
│   ├── Expiry Alert
│   └── Countdown
└── NotificationManager
    ├── Send Operations
    ├── Status Tracking
    └── Audit Logging
```

---

## Core Components

### 1. NotificationEngine (`src/server/notification-engine.ts`)

**Purpose**: Core orchestration service for all notification operations

**Key Classes**:

#### DocumentExpiry
```typescript
interface DocumentExpiry {
  documentId: string;
  documentType: 'passport' | 'driving_license' | 'kyc' | 'aadhaar' | 'pan';
  expiryDate: Date;
  issuedDate: Date;
  issuingAuthority: string;
  documentNumber: string;
  userId: string;
}
```

#### NotificationPreference
```typescript
interface NotificationPreference {
  preferenceId: string;
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  renewalReminders: {
    enabled: boolean;
    daysBeforeExpiry: number;
    frequency: 'once' | 'weekly' | 'daily';
  };
  expiryAlerts: {
    enabled: boolean;
    days30: boolean;
    days14: boolean;
    days7: boolean;
    days1: boolean;
  };
  documentTypes: DocumentType[];
  timezone: string;
  quietHours: {
    enabled: boolean;
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
  };
}
```

#### Notification
```typescript
interface Notification {
  notificationId: string;
  userId: string;
  documentId: string;
  documentType: DocumentType;
  type: NotificationType;
  channels: NotificationChannel[];
  subject: string;
  message: string;
  daysUntilExpiry: number;
  expiryDate: Date;
  scheduled: boolean;
  scheduledTime?: Date;
  sentAt?: Date;
  deliveryStatus: {
    email: 'pending' | 'sent' | 'failed' | 'skipped';
    sms: 'pending' | 'sent' | 'failed' | 'skipped';
    whatsapp: 'pending' | 'sent' | 'failed' | 'skipped';
  };
  retryCount: number;
}
```

**Key Methods**:

```typescript
// Preferences
createOrUpdatePreferences(userId, preferences)
getPreferences(userId)
deletePreferences(userId)

// Document Tracking
registerDocument(expiry)
getDaysUntilExpiry(documentId)
getDocumentsExpiringIn(userId, daysThreshold)
getExpiredDocuments(userId)

// Notification Generation
createRenewalReminder(userId, documentId, channels)
createExpiryAlert(userId, documentId, severity)
createCountdownReminder(userId)

// Notification Operations
sendNotification(notificationId, channels)
retryFailedNotifications()
getUserNotifications(userId, options)
markAsRead(notificationId)
deleteNotification(notificationId)

// Scheduling
scheduleNotification(notificationId, scheduledTime)
getScheduledNotifications()
getNotificationsReadyToSend()

// Admin
getAdminLogs(options)
getStatistics(userId)
```

---

### 2. Channel Handlers (`src/server/notification-channels.ts`)

**Purpose**: Integrate with external notification providers

#### EmailChannelHandler
```typescript
async send(to: string, notification: Notification): Promise<EmailResult>
```

**Providers**: SendGrid, AWS SES, SMTP

#### SMSChannelHandler
```typescript
async send(phoneNumber: string, notification: Notification): Promise<SMSResult>
normalizePhoneNumber(phoneNumber): string
```

**Providers**: Twilio, AWS SNS

#### WhatsAppChannelHandler
```typescript
async send(phoneNumber: string, notification: Notification): Promise<WhatsAppResult>
async sendTemplate(phoneNumber: string, templateName: string, variables): Promise<WhatsAppResult>
```

**Providers**: Twilio WhatsApp, WhatsApp Business API

---

### 3. Notification Scheduler (`src/server/notification-scheduler.ts`)

**Purpose**: Cron job management for scheduled notifications

**Scheduler Configuration**:

```typescript
interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  jobs: {
    sendScheduledNotifications: { enabled: boolean; schedule: string };
    checkRenewalReminders: { enabled: boolean; schedule: string };
    checkExpiryAlerts: { enabled: boolean; schedule: string };
    retryFailedNotifications: { enabled: boolean; schedule: string };
    cleanupOldNotifications: { enabled: boolean; schedule: string; daysOld: number };
    archiveNotificationLogs: { enabled: boolean; schedule: string; daysOld: number };
  };
}
```

**Default Schedules**:

```
sendScheduledNotifications    : Every 5 minutes
checkRenewalReminders         : Daily at 9 AM
checkExpiryAlerts             : Every 6 hours
retryFailedNotifications      : Daily at 12 PM
cleanupOldNotifications       : Weekly Sunday at 2 AM
archiveNotificationLogs       : Monthly 1st at 3 AM
```

**Key Methods**:

```typescript
start()                    // Start scheduler
stop()                     // Stop scheduler
triggerJob(jobName)        // Manually run job
getStatistics()            // Get job statistics
isSchedulerRunning()       // Check status
```

---

## Features

### 1. Renewal Reminders

**Triggers**: Documents approaching expiry based on user preference

```typescript
const reminder = notificationEngine.createRenewalReminder(
  userId,
  documentId,
  ['email', 'sms']
);
```

**Customizable**:
- Days before expiry (1-365 days)
- Frequency (once, weekly, daily)
- Selected channels
- Quiet hours support

### 2. Expiry Alerts

**Auto-escalating based on urgency**:

| Days Remaining | Alert Type | Urgency |
|---|---|---|
| 30 days | Expiry Alert | Normal |
| 14 days | Expiry Alert | Medium |
| 7 days | Expiry Critical | High |
| 1 day | Expiry Urgent | Critical |

### 3. Countdown Reminders

**Regular status updates** showing days until expiry:

```typescript
const countdowns = notificationEngine.createCountdownReminder(userId);
```

### 4. Document Expiry Tracking

**Supported Documents**:
- Passport
- Driving License (DL)
- KYC
- Aadhaar
- PAN Card

**Tracking Capabilities**:
```typescript
// Register document
notificationEngine.registerDocument({
  documentId: 'passport_001',
  documentType: 'passport',
  expiryDate: new Date('2026-12-31'),
  userId: 'user_123'
});

// Get days until expiry
const days = notificationEngine.getDaysUntilExpiry('passport_001');

// Get expiring documents
const expiring = notificationEngine.getDocumentsExpiringIn(userId, 30);

// Get expired documents
const expired = notificationEngine.getExpiredDocuments(userId);
```

### 5. User Preferences

**Channel Selection**:
- Email notifications
- SMS notifications
- WhatsApp notifications
- Quiet hours (do-not-disturb)
- Document type filtering

**Example**:
```typescript
const prefs = notificationEngine.createOrUpdatePreferences(userId, {
  channels: { email: true, sms: true, whatsapp: false },
  renewalReminders: {
    enabled: true,
    daysBeforeExpiry: 30,
    frequency: 'once'
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  }
});
```

### 6. Scheduled Notifications

**Schedule for specific time**:
```typescript
const scheduledTime = new Date('2026-06-15 09:00:00');
notificationEngine.scheduleNotification(notificationId, scheduledTime);
```

### 7. Admin Logs & Audit Trail

**Track all operations**:
```typescript
const logs = notificationEngine.getAdminLogs({
  userId: 'user_123',
  action: 'sent',
  limit: 100
});
```

**Log Actions**:
- `created` - Notification created
- `scheduled` - Notification scheduled
- `sent` - Notification sent
- `failed` - Delivery failed
- `retried` - Retry attempted
- `read` - User read notification
- `deleted` - Notification deleted

---

## Getting Started

### 1. Installation

```bash
# Dependencies already included in package.json
npm install

# Notification engine is auto-initialized
```

### 2. Initialize Engine

```typescript
import { notificationEngine } from '@/server/notification-engine';
import { notificationScheduler } from '@/server/notification-scheduler';

// Engine is singleton, automatically initialized
// Scheduler auto-starts if enabled
```

### 3. Set User Preferences

```typescript
notificationEngine.createOrUpdatePreferences('user_123', {
  channels: {
    email: true,
    sms: true,
    whatsapp: false
  },
  renewalReminders: {
    enabled: true,
    daysBeforeExpiry: 30,
    frequency: 'once'
  },
  documentTypes: ['passport', 'driving_license', 'kyc']
});
```

### 4. Register Documents

```typescript
notificationEngine.registerDocument({
  documentId: 'passport_001',
  documentType: 'passport',
  expiryDate: new Date('2026-12-31'),
  issuedDate: new Date('2021-12-31'),
  issuingAuthority: 'Ministry of External Affairs',
  documentNumber: 'A12345678',
  userId: 'user_123'
});
```

### 5. Generate Notifications

```typescript
// Manual reminder
const reminder = notificationEngine.createRenewalReminder(
  'user_123',
  'passport_001',
  ['email', 'sms']
);

// Send immediately
await notificationEngine.sendNotification(reminder.notificationId);

// Or schedule for later
notificationEngine.scheduleNotification(
  reminder.notificationId,
  new Date('2026-06-15 09:00:00')
);
```

### 6. Use React Components

```typescript
import { NotificationPreferencesComponent } from '@/components/notification-preferences';
import { NotificationLogsComponent } from '@/components/notification-logs';

export function NotificationPage() {
  return (
    <div className="space-y-6">
      <NotificationPreferencesComponent userId="user_123" />
      <NotificationLogsComponent isAdmin={true} />
    </div>
  );
}
```

---

## API Reference

### Preference Management

#### Save Preferences
```
POST /api/notifications/preferences/:userId
Body: NotificationPreference
Response: { success: boolean; preferences: NotificationPreference }
```

#### Get Preferences
```
GET /api/notifications/preferences/:userId
Response: { success: boolean; preferences: NotificationPreference }
```

#### Delete Preferences
```
DELETE /api/notifications/preferences/:userId
Response: { success: boolean }
```

### Document Management

#### Register Document
```
POST /api/notifications/documents
Body: DocumentExpiry
Response: { success: boolean; document: DocumentExpiry }
```

#### Get Expiring Documents
```
GET /api/notifications/users/:userId/expiring?days=30
Response: { success: boolean; documents: DocumentExpiry[] }
```

#### Get Expired Documents
```
GET /api/notifications/users/:userId/expired
Response: { success: boolean; documents: DocumentExpiry[] }
```

#### Update Expiry Date
```
PUT /api/notifications/documents/:documentId
Body: { expiryDate: Date }
Response: { success: boolean }
```

### Notification Operations

#### Generate Renewal Reminder
```
POST /api/notifications/generate/renewal-reminder
Body: { userId: string; documentId: string; channels: string[] }
Response: { success: boolean; notification: Notification }
```

#### Generate Expiry Alert
```
POST /api/notifications/generate/expiry-alert
Body: { userId: string; documentId: string; severity: 'alert' | 'critical' | 'urgent' }
Response: { success: boolean; notification: Notification }
```

#### Generate Countdown
```
POST /api/notifications/generate/countdown
Body: { userId: string }
Response: { success: boolean; notifications: Notification[] }
```

#### Send Notification
```
POST /api/notifications/:notificationId/send
Body: { channels?: string[] }
Response: { success: boolean; notification: Notification }
```

#### Get User Notifications
```
GET /api/notifications/users/:userId?limit=50&offset=0&type=renewal_reminder&status=pending
Response: { success: boolean; notifications: Notification[] }
```

#### Mark as Read
```
PUT /api/notifications/:notificationId/read
Response: { success: boolean }
```

#### Delete Notification
```
DELETE /api/notifications/:notificationId
Response: { success: boolean }
```

#### Schedule Notification
```
POST /api/notifications/:notificationId/schedule
Body: { scheduledTime: Date }
Response: { success: boolean }
```

### Admin Operations

#### Get Admin Logs
```
GET /api/notifications/admin-logs?userId=user_123&action=sent&limit=100
Response: { success: boolean; logs: NotificationLog[] }
```

#### Get Statistics
```
GET /api/notifications/statistics?userId=user_123
Response: { success: boolean; statistics: NotificationStats }
```

#### Retry Failed Notifications
```
POST /api/notifications/admin/retry-failed
Response: { success: boolean; retried: number }
```

#### Get Notification Logs
```
GET /api/notifications/scheduler/logs
Response: { success: boolean; notifications: any[] }
```

### Scheduler Management

#### Get Scheduler Status
```
GET /api/notifications/scheduler/status
Response: { success: boolean; isRunning: boolean; stats: SchedulerStats[] }
```

#### Start Scheduler
```
POST /api/notifications/scheduler/start
Response: { success: boolean; message: string }
```

#### Stop Scheduler
```
POST /api/notifications/scheduler/stop
Response: { success: boolean; message: string }
```

#### Trigger Job
```
POST /api/notifications/scheduler/trigger/:jobName
Response: { success: boolean; message: string }
```

---

## Configuration

### Environment Variables

```bash
# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@bharat-id.gov.in
EMAIL_FROM_NAME="Bharat ID Platform"

# SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+919999999999

# WhatsApp Configuration
WHATSAPP_FROM_NUMBER=whatsapp:+919999999999

# Scheduler Configuration
NOTIFICATION_SCHEDULER_ENABLED=true
NOTIFICATION_SCHEDULER_TIMEZONE=Asia/Kolkata
```

### Custom Channel Configuration

```typescript
import { channelFactory } from '@/server/notification-channels';

// Override defaults
channelFactory.initializeEmail({
  provider: 'sesaws',
  region: 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  from: 'notifications@bharat-id.gov.in',
  fromName: 'Bharat ID'
});

channelFactory.initializeSMS({
  provider: 'sns',
  region: 'ap-south-1',
  fromNumber: '+919999999999'
});
```

---

## Cron Jobs

### Job: sendScheduledNotifications

**Schedule**: Every 5 minutes
**Function**: Send notifications scheduled for the current time
**Actions**:
- Fetch notifications ready to send
- Check quiet hours
- Send via active channels
- Update delivery status

### Job: checkRenewalReminders

**Schedule**: Daily at 9 AM
**Function**: Check for documents approaching expiry
**Actions**:
- Get all users with preferences
- Check documents expiring within threshold
- Generate renewal reminders
- Send to active channels

### Job: checkExpiryAlerts

**Schedule**: Every 6 hours
**Function**: Generate escalating expiry alerts
**Actions**:
- Check 30-day threshold
- Check 14-day threshold
- Check 7-day threshold
- Check 1-day urgent threshold
- Generate alerts based on severity

### Job: retryFailedNotifications

**Schedule**: Daily at 12 PM
**Function**: Retry notifications that failed
**Actions**:
- Get failed notifications
- Check retry count < max
- Retry via failed channels
- Update delivery status

### Job: cleanupOldNotifications

**Schedule**: Weekly (Sunday 2 AM)
**Function**: Delete old notifications
**Actions**:
- Delete notifications older than configured days
- Remove associated logs
- Clean up storage

### Job: archiveNotificationLogs

**Schedule**: Monthly (1st at 3 AM)
**Function**: Archive old audit logs
**Actions**:
- Archive logs older than 180 days
- Compress archived data
- Update statistics

---

## Database Schema

### PostgreSQL Schema

```sql
-- Users' notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  channels JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "whatsapp": false}',
  renewal_reminders JSONB NOT NULL,
  expiry_alerts JSONB NOT NULL,
  countdown_reminders JSONB NOT NULL,
  document_types TEXT[] NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  quiet_hours JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document expiry tracking
CREATE TABLE document_expiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  expiry_date DATE NOT NULL,
  issued_date DATE,
  issuing_authority VARCHAR(255),
  document_number VARCHAR(100),
  last_notified TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications sent/scheduled
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  document_id VARCHAR(255),
  document_type VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  channels TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  message TEXT,
  body TEXT,
  days_until_expiry INT,
  expiry_date DATE,
  scheduled BOOLEAN DEFAULT false,
  scheduled_time TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  delivery_status JSONB NOT NULL DEFAULT '{"email": "pending", "sms": "pending", "whatsapp": "pending"}',
  delivery_error TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin audit logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id VARCHAR(255),
  user_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  channel VARCHAR(50),
  status VARCHAR(50),
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  document_type VARCHAR(50),
  subject TEXT NOT NULL,
  email_template TEXT,
  sms_template TEXT,
  whatsapp_template TEXT,
  variables TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, document_type)
);

-- Create indexes for performance
CREATE INDEX idx_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_expiries_user_id ON document_expiries(user_id);
CREATE INDEX idx_expiries_expiry_date ON document_expiries(expiry_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(delivery_status);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_logs_timestamp ON notification_logs(timestamp);
```

### Prisma Schema

```prisma
model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  channels        Json     @default("{\"email\": true, \"sms\": false, \"whatsapp\": false}")
  renewalReminders Json
  expiryAlerts    Json
  countdownReminders Json
  documentTypes   String[]
  timezone        String   @default("UTC")
  quietHours      Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("notification_preferences")
}

model DocumentExpiry {
  id               String   @id @default(cuid())
  documentId       String   @unique
  userId           String
  documentType     String
  expiryDate       DateTime
  issuedDate       DateTime?
  issuingAuthority String?
  documentNumber   String?
  lastNotified     DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("document_expiries")
  @@index([userId])
  @@index([expiryDate])
}

model Notification {
  id               String   @id @default(cuid())
  notificationId   String   @unique
  userId           String
  documentId       String?
  documentType     String?
  type             String
  channels         String[]
  subject          String
  message          String?
  body             String?
  daysUntilExpiry  Int?
  expiryDate       DateTime?
  scheduled        Boolean  @default(false)
  scheduledTime    DateTime?
  sentAt           DateTime?
  readAt           DateTime?
  deliveryStatus   Json     @default("{\"email\": \"pending\", \"sms\": \"pending\", \"whatsapp\": \"pending\"}")
  deliveryError    String?
  retryCount       Int      @default(0)
  maxRetries       Int      @default(3)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("notifications")
  @@index([userId])
  @@index([createdAt])
}

model NotificationLog {
  id               String   @id @default(cuid())
  notificationId   String?
  userId           String?
  action           String
  channel          String?
  status           String?
  details          Json?
  timestamp        DateTime @default(now())

  @@map("notification_logs")
  @@index([userId])
  @@index([timestamp])
}

model NotificationTemplate {
  id              String   @id @default(cuid())
  type            String
  documentType    String?
  subject         String
  emailTemplate   String?
  smsTemplate     String?
  whatsappTemplate String?
  variables       String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("notification_templates")
  @@unique([type, documentType])
}
```

---

## Examples

### Example 1: Set Up User Preferences

```typescript
import { notificationEngine } from '@/server/notification-engine';

// Create preferences for user
const userId = 'user_123';

notificationEngine.createOrUpdatePreferences(userId, {
  channels: {
    email: true,
    sms: true,
    whatsapp: true
  },
  renewalReminders: {
    enabled: true,
    daysBeforeExpiry: 30,
    frequency: 'once'
  },
  expiryAlerts: {
    enabled: true,
    days30: true,
    days14: true,
    days7: true,
    days1: false
  },
  countdownReminders: {
    enabled: true,
    frequency: 'weekly'
  },
  documentTypes: ['passport', 'driving_license', 'kyc'],
  timezone: 'Asia/Kolkata',
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00'
  }
});
```

### Example 2: Track Documents and Generate Reminders

```typescript
import { notificationEngine } from '@/server/notification-engine';

const userId = 'user_123';

// Register passport for tracking
notificationEngine.registerDocument({
  documentId: 'passport_001',
  documentType: 'passport',
  expiryDate: new Date('2026-12-31'),
  issuedDate: new Date('2021-12-31'),
  issuingAuthority: 'Ministry of External Affairs',
  documentNumber: 'P1234567',
  userId
});

// Get documents expiring in 30 days
const expiringDocs = notificationEngine.getDocumentsExpiringIn(userId, 30);

// Create renewal reminder
for (const doc of expiringDocs) {
  const reminder = notificationEngine.createRenewalReminder(
    userId,
    doc.documentId,
    ['email', 'sms']
  );

  // Send immediately
  await notificationEngine.sendNotification(reminder.notificationId);
}
```

### Example 3: Use React Preferences Component

```typescript
import { NotificationPreferencesComponent } from '@/components/notification-preferences';

export function SettingsPage({ userId }: { userId: string }) {
  const handleSavePreferences = (preferences) => {
    console.log('Preferences saved:', preferences);
  };

  return (
    <div className="p-6">
      <NotificationPreferencesComponent
        userId={userId}
        onSave={handleSavePreferences}
      />
    </div>
  );
}
```

### Example 4: View Admin Logs

```typescript
import { NotificationLogsComponent } from '@/components/notification-logs';

export function AdminDashboard() {
  return (
    <div className="p-6">
      <NotificationLogsComponent isAdmin={true} />
    </div>
  );
}
```

### Example 5: Manual Scheduler Job Trigger

```typescript
import { notificationScheduler } from '@/server/notification-scheduler';

// Manually trigger renewal reminder check
await notificationScheduler.triggerJob('checkRenewalReminders');

// Get scheduler status
const stats = notificationScheduler.getStatistics();
console.log('Scheduler running:', notificationScheduler.isSchedulerRunning());
console.log('Job statistics:', stats);
```

---

## Best Practices

### 1. User Preferences
- ✅ Always create user preferences before generating notifications
- ✅ Respect quiet hours unless notification is critical
- ✅ Allow users to customize channels and document types

### 2. Document Registration
- ✅ Register documents immediately after issuance
- ✅ Update expiry dates when documents are renewed
- ✅ Use accurate document numbers for identification

### 3. Notification Generation
- ✅ Don't send duplicate notifications for same document/period
- ✅ Schedule non-urgent notifications during preferred times
- ✅ Use escalating severity levels (alert → critical → urgent)

### 4. Channel Selection
- ✅ Default to email for most notifications
- ✅ Use SMS for time-sensitive alerts
- ✅ Use WhatsApp for direct, interactive communication
- ✅ Always check channel enabled status

### 5. Error Handling
- ✅ Implement retry logic for failed notifications
- ✅ Log all failures for debugging
- ✅ Set reasonable max retry counts (3-5)

### 6. Performance
- ✅ Use pagination when fetching large result sets
- ✅ Index database columns frequently queried
- ✅ Archive old notifications monthly
- ✅ Batch process notifications when possible

### 7. Security
- ✅ Never expose user IDs in logs
- ✅ Mask sensitive data (phone, email) in non-admin views
- ✅ Validate all user inputs
- ✅ Use HTTPS for all API calls
- ✅ Implement rate limiting on notification endpoints

---

## Troubleshooting

### Issue: Notifications not being sent

**Possible Causes**:
1. Channel not enabled in user preferences
2. Quiet hours preventing send
3. Scheduler not running
4. Invalid channel configuration

**Solutions**:
```typescript
// Check preferences
const prefs = notificationEngine.getPreferences(userId);
console.log('Email enabled:', prefs.channels.email);
console.log('In quiet hours:', notificationEngine.isInQuietHours(userId));

// Check scheduler status
console.log('Scheduler running:', notificationScheduler.isSchedulerRunning());

// Check notification status
const notif = notificationEngine.getNotification(notificationId);
console.log('Delivery status:', notif.deliveryStatus);
```

### Issue: Cron jobs not executing

**Possible Causes**:
1. Scheduler disabled in config
2. Node process stopped
3. Memory issues

**Solutions**:
```typescript
// Restart scheduler
notificationScheduler.stop();
notificationScheduler.start();

// Check job statistics
const stats = notificationScheduler.getStatistics();
for (const stat of stats) {
  console.log(`${stat.jobName}:`, {
    lastRun: stat.lastRun,
    lastError: stat.lastError
  });
}
```

### Issue: High delivery failures

**Possible Causes**:
1. Invalid phone numbers/emails
2. Provider rate limiting
3. Invalid API credentials
4. Wrong channel configuration

**Solutions**:
```typescript
// Normalize phone numbers
const handler = channelFactory.getSMSHandler();
const normalized = handler.normalizePhoneNumber(phoneNumber);

// Retry failed notifications
const retried = await notificationEngine.retryFailedNotifications();

// Check provider credentials in env vars
console.log({
  sendgridKey: !!process.env.SENDGRID_API_KEY,
  twilioSid: !!process.env.TWILIO_ACCOUNT_SID
});
```

---

## License

Part of Bharat ID Platform © 2026
