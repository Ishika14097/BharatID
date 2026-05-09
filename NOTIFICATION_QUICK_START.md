# Notification Engine - Quick Start Guide

## 5-Minute Setup

Get started with the Bharat ID Notification Engine in 5 minutes!

### Step 1: Initialize Engine (Automatic)

The notification engine auto-initializes as a singleton. Just import it:

```typescript
import { notificationEngine } from '@/server/notification-engine';

// Engine is ready to use immediately
```

### Step 2: Create User Preferences

```typescript
// Set up notification preferences for a user
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

### Step 3: Register Documents

```typescript
// Register a passport for expiry tracking
notificationEngine.registerDocument({
  documentId: 'passport_001',
  documentType: 'passport',
  expiryDate: new Date('2026-12-31'),
  issuingAuthority: 'MEA',
  documentNumber: 'P1234567',
  userId: 'user_123'
});
```

### Step 4: Generate & Send Notification

```typescript
// Create renewal reminder
const reminder = notificationEngine.createRenewalReminder(
  'user_123',
  'passport_001',
  ['email', 'sms']
);

// Send immediately
await notificationEngine.sendNotification(reminder.notificationId);
```

### Step 5: Use in React

```typescript
import { NotificationPreferencesComponent } from '@/components/notification-preferences';

export function Settings() {
  return <NotificationPreferencesComponent userId="user_123" />;
}
```

---

## Common Use Cases

### Use Case 1: Send Email Reminder for Expiring Passport

```typescript
// 1. Get user preferences
const prefs = notificationEngine.getPreferences('user_123');

// 2. Register document
notificationEngine.registerDocument({
  documentId: 'passport_001',
  documentType: 'passport',
  expiryDate: new Date('2026-06-30'),
  userId: 'user_123'
});

// 3. Create reminder
const reminder = notificationEngine.createRenewalReminder(
  'user_123',
  'passport_001',
  ['email']
);

// 4. Send
await notificationEngine.sendNotification(reminder.notificationId);
```

### Use Case 2: Get All Expiring Documents

```typescript
// Get documents expiring within 30 days
const expiringDocs = notificationEngine.getDocumentsExpiringIn('user_123', 30);

console.log(`Found ${expiringDocs.length} documents expiring soon`);
expiringDocs.forEach(doc => {
  const daysUntil = notificationEngine.getDaysUntilExpiry(doc.documentId);
  console.log(`${doc.documentType}: ${daysUntil} days until expiry`);
});
```

### Use Case 3: Handle Multi-Channel Notification

```typescript
// Send via multiple channels
const notification = notificationEngine.createRenewalReminder(
  'user_123',
  'kyc_001',
  ['email', 'sms', 'whatsapp']
);

await notificationEngine.sendNotification(notification.notificationId);

// Check delivery status
const sent = notificationEngine.getNotification(notification.notificationId);
console.log('Email:', sent.deliveryStatus.email);
console.log('SMS:', sent.deliveryStatus.sms);
console.log('WhatsApp:', sent.deliveryStatus.whatsapp);
```

### Use Case 4: Schedule Notification for Later

```typescript
// Create notification
const reminder = notificationEngine.createRenewalReminder(
  'user_123',
  'dl_001',
  ['email']
);

// Schedule for tomorrow 9 AM
const tomorrow9am = new Date();
tomorrow9am.setDate(tomorrow9am.getDate() + 1);
tomorrow9am.setHours(9, 0, 0, 0);

notificationEngine.scheduleNotification(
  reminder.notificationId,
  tomorrow9am
);

// Scheduler will auto-send when time arrives
```

### Use Case 5: Create Admin Notification Log Dashboard

```typescript
// Get last 50 admin logs
const logs = notificationEngine.getAdminLogs({
  limit: 50,
  offset: 0
});

// Get statistics
const stats = notificationEngine.getStatistics();

console.log(`Total sent: ${stats.sentCount}`);
console.log(`Failed: ${stats.failedCount}`);
console.log(`Success rate: ${stats.deliveryRate}%`);

// Show by type
Object.entries(stats.byType).forEach(([type, count]) => {
  console.log(`${type}: ${count}`);
});
```

### Use Case 6: Handle Failed Notifications

```typescript
// Get user's notifications with errors
const notifications = notificationEngine.getUserNotifications('user_123', {
  status: 'pending',
  limit: 100
});

// Filter failed ones
const failedNotifs = notifications.filter(n =>
  n.deliveryStatus.email === 'failed' ||
  n.deliveryStatus.sms === 'failed' ||
  n.deliveryStatus.whatsapp === 'failed'
);

// Retry them
const retried = await notificationEngine.retryFailedNotifications();
console.log(`Retried ${retried} notifications`);
```

### Use Case 7: Disable Notifications During Quiet Hours

```typescript
// Check if user is in quiet hours
const inQuietHours = notificationEngine.isInQuietHours('user_123');

if (inQuietHours) {
  console.log('User is in quiet hours - scheduling for morning');
  
  const morning = new Date();
  morning.setHours(9, 0, 0, 0);
  
  notificationEngine.scheduleNotification(notificationId, morning);
} else {
  // Send immediately
  await notificationEngine.sendNotification(notificationId);
}
```

---

## API Quick Reference

| Method | Purpose | Example |
|--------|---------|---------|
| `createOrUpdatePreferences()` | Set user preferences | `notificationEngine.createOrUpdatePreferences(userId, prefs)` |
| `registerDocument()` | Track document | `notificationEngine.registerDocument(expiry)` |
| `getDaysUntilExpiry()` | Check days left | `notificationEngine.getDaysUntilExpiry(docId)` |
| `getDocumentsExpiringIn()` | Get expiring docs | `notificationEngine.getDocumentsExpiringIn(userId, 30)` |
| `createRenewalReminder()` | Create reminder | `notificationEngine.createRenewalReminder(userId, docId, channels)` |
| `createExpiryAlert()` | Create alert | `notificationEngine.createExpiryAlert(userId, docId)` |
| `createCountdownReminder()` | Create countdown | `notificationEngine.createCountdownReminder(userId)` |
| `sendNotification()` | Send now | `await notificationEngine.sendNotification(notifId)` |
| `scheduleNotification()` | Send later | `notificationEngine.scheduleNotification(notifId, date)` |
| `getUserNotifications()` | List notifications | `notificationEngine.getUserNotifications(userId)` |
| `getStatistics()` | Get stats | `notificationEngine.getStatistics()` |
| `getAdminLogs()` | View audit log | `notificationEngine.getAdminLogs(options)` |

---

## REST API Quick Reference

```bash
# Create/Update Preferences
POST /api/notifications/preferences/:userId
{
  "channels": { "email": true, "sms": true, "whatsapp": false },
  "renewalReminders": { "enabled": true, "daysBeforeExpiry": 30 }
}

# Register Document
POST /api/notifications/documents
{
  "documentId": "passport_001",
  "documentType": "passport",
  "expiryDate": "2026-12-31",
  "userId": "user_123"
}

# Get Expiring Documents
GET /api/notifications/users/user_123/expiring?days=30

# Generate Renewal Reminder
POST /api/notifications/generate/renewal-reminder
{
  "userId": "user_123",
  "documentId": "passport_001",
  "channels": ["email", "sms"]
}

# Send Notification
POST /api/notifications/notification_id/send
{
  "channels": ["email"]
}

# Get User Notifications
GET /api/notifications/users/user_123?limit=50&status=sent

# Get Statistics
GET /api/notifications/statistics

# Scheduler Status
GET /api/notifications/scheduler/status

# Trigger Job
POST /api/notifications/scheduler/trigger/checkRenewalReminders
```

---

## Component Usage

### Notification Preferences Component

```typescript
import { NotificationPreferencesComponent } from '@/components/notification-preferences';

export function UserSettings() {
  return (
    <NotificationPreferencesComponent
      userId="user_123"
      onSave={(prefs) => console.log('Saved:', prefs)}
    />
  );
}
```

Features:
- ✅ Channel selection (Email, SMS, WhatsApp)
- ✅ Renewal reminder configuration
- ✅ Expiry alert thresholds
- ✅ Document type selection
- ✅ Quiet hours setup
- ✅ Timezone configuration

### Notification Logs Component

```typescript
import { NotificationLogsComponent } from '@/components/notification-logs';

export function AdminDashboard() {
  return <NotificationLogsComponent isAdmin={true} />;
}
```

Features:
- ✅ Notification history
- ✅ Delivery status tracking
- ✅ Audit logs
- ✅ Channel statistics
- ✅ Search and filter
- ✅ Retry failed notifications

---

## Pro Tips

### Tip 1: Bulk Register Documents

```typescript
const documents = [
  { documentId: 'passport_001', documentType: 'passport', expiryDate: '2026-12-31' },
  { documentId: 'dl_001', documentType: 'driving_license', expiryDate: '2028-06-30' },
  { documentId: 'kyc_001', documentType: 'kyc', expiryDate: '2025-12-31' }
];

documents.forEach(doc => {
  notificationEngine.registerDocument({
    ...doc,
    userId: 'user_123',
    expiryDate: new Date(doc.expiryDate)
  });
});
```

### Tip 2: Batch Send Notifications

```typescript
const userIds = ['user_1', 'user_2', 'user_3'];

for (const userId of userIds) {
  const reminders = notificationEngine.createCountdownReminder(userId);
  
  for (const reminder of reminders) {
    await notificationEngine.sendNotification(reminder.notificationId);
  }
}
```

### Tip 3: Get Statistics by Channel

```typescript
const stats = notificationEngine.getStatistics();

console.log('Delivery by channel:');
Object.entries(stats.byChannel).forEach(([channel, count]) => {
  console.log(`  ${channel}: ${count}`);
});
```

### Tip 4: Export User Data

```typescript
// Get all user's notifications
const userNotifs = notificationEngine.getUserNotifications('user_123', {
  limit: 1000
});

// Get user preferences
const prefs = notificationEngine.getPreferences('user_123');

// Create export
const exportData = {
  preferences: prefs,
  notificationHistory: userNotifs,
  exportedAt: new Date()
};

console.log(JSON.stringify(exportData, null, 2));
```

### Tip 5: Monitor Scheduler

```typescript
setInterval(() => {
  const stats = notificationScheduler.getStatistics();
  
  stats.forEach(stat => {
    if (stat.failureCount > 0) {
      console.warn(`⚠️ ${stat.jobName}: ${stat.failureCount} failures`);
      console.warn(`Last error: ${stat.lastError}`);
    }
  });
}, 60000); // Check every minute
```

---

## Frequently Asked Questions

**Q: How do I disable notifications?**
A: Set `channels` all to false:
```typescript
notificationEngine.createOrUpdatePreferences(userId, {
  channels: { email: false, sms: false, whatsapp: false }
});
```

**Q: Can I send to multiple channels simultaneously?**
A: Yes! Pass array: `['email', 'sms', 'whatsapp']`

**Q: What happens if SMS fails?**
A: Scheduled daily retry job will attempt resend. Check `deliveryStatus.sms` for status.

**Q: How do I delete old notifications?**
A: Automatic cleanup runs weekly. Manually delete with:
```typescript
notificationEngine.deleteNotification(notificationId);
```

**Q: Can I modify notification template?**
A: Notification templates are defined in engine. Customize in `notification-engine.ts`

**Q: Is WhatsApp integration automatic?**
A: Channels are prepared but require Twilio/WhatsApp Business API credentials in env vars

**Q: How do I test notifications?**
A: Use mock channels or trigger scheduler jobs manually:
```typescript
await notificationScheduler.triggerJob('checkRenewalReminders');
```

**Q: Can I schedule bulk notifications?**
A: Yes, create individual notifications and schedule each with same time:
```typescript
reminders.forEach(r => 
  notificationEngine.scheduleNotification(r.notificationId, futureDate)
);
```

---

## Environment Setup

### Required Env Vars (Production)

```bash
# Email (SendGrid or AWS SES)
SENDGRID_API_KEY=your_key_here
# OR
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1

# SMS (Twilio or AWS SNS)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+91999999999
# OR
AWS_SNS_REGION=ap-south-1

# WhatsApp
WHATSAPP_FROM_NUMBER=whatsapp:+919999999999

# Scheduler
NOTIFICATION_SCHEDULER_ENABLED=true
NOTIFICATION_SCHEDULER_TIMEZONE=Asia/Kolkata
```

### Local Development

The system includes mock implementations. Just import and use!

---

## Next Steps

1. ✅ Read [NOTIFICATION_DOCS.md](NOTIFICATION_DOCS.md) for complete reference
2. ✅ Integrate with existing Bharat ID authentication
3. ✅ Set up production email/SMS providers
4. ✅ Configure database for persistence
5. ✅ Set up cron job monitoring
6. ✅ Create admin dashboard
7. ✅ Deploy and test

---

## Support

For issues or questions:
1. Check troubleshooting section in main docs
2. Review examples in this guide
3. Check admin logs for detailed error info
4. Enable debug logging: `DEBUG=bharat:notification:*`

---

**Happy notifying! 🚀**
