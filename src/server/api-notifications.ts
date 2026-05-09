/**
 * Notification API Handlers
 * 
 * REST endpoints for:
 * - Preference management
 * - Notification operations
 * - Document expiry tracking
 * - Admin operations
 * - Scheduler management
 */

import { Request, Response } from 'express';
import {
  notificationEngine,
  type DocumentExpiry,
  type NotificationPreference,
} from '@/server/notification-engine';
import { notificationScheduler } from '@/server/notification-scheduler';
import { channelFactory } from '@/server/notification-channels';

// ============================================================================
// PREFERENCE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/notifications/preferences/:userId
 * Create or update user notification preferences
 */
export async function handleSavePreferences(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const saved = notificationEngine.createOrUpdatePreferences(userId, preferences);

    res.json({
      success: true,
      preferences: saved,
      message: 'Preferences saved successfully'
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save preferences'
    });
  }
}

/**
 * GET /api/notifications/preferences/:userId
 * Get user notification preferences
 */
export async function handleGetPreferences(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const preferences = notificationEngine.getPreferences(userId);
    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences'
    });
  }
}

/**
 * DELETE /api/notifications/preferences/:userId
 * Delete user notification preferences
 */
export async function handleDeletePreferences(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const deleted = notificationEngine.deletePreferences(userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferences deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete preferences'
    });
  }
}

// ============================================================================
// DOCUMENT EXPIRY ENDPOINTS
// ============================================================================

/**
 * POST /api/notifications/documents
 * Register document for expiry tracking
 */
export async function handleRegisterDocument(req: Request, res: Response) {
  try {
    const {
      documentId,
      documentType,
      expiryDate,
      issuedDate,
      issuingAuthority,
      documentNumber,
      userId
    } = req.body;

    if (!documentId || !documentType || !expiryDate || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Document ID, type, expiry date, and user ID are required'
      });
    }

    const expiry: DocumentExpiry = {
      documentId,
      documentType,
      expiryDate: new Date(expiryDate),
      issuedDate: new Date(issuedDate || Date.now()),
      issuingAuthority: issuingAuthority || 'Unknown',
      documentNumber: documentNumber || '',
      userId
    };

    const registered = notificationEngine.registerDocument(expiry);

    res.status(201).json({
      success: true,
      document: registered,
      message: 'Document registered for tracking'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to register document'
    });
  }
}

/**
 * GET /api/notifications/documents/:documentId
 * Get document expiry information
 */
export async function handleGetDocument(req: Request, res: Response) {
  try {
    const { documentId } = req.params;

    const daysUntilExpiry = notificationEngine.getDaysUntilExpiry(documentId);

    if (daysUntilExpiry === null) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      documentId,
      daysUntilExpiry,
      isExpired: daysUntilExpiry <= 0,
      isExpiring: daysUntilExpiry <= 30
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get document'
    });
  }
}

/**
 * GET /api/notifications/users/:userId/expiring
 * Get user's documents expiring soon
 */
export async function handleGetExpiringDocuments(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const daysThreshold = parseInt(req.query.days as string) || 30;

    const expiringDocs = notificationEngine.getDocumentsExpiringIn(userId, daysThreshold);

    res.json({
      success: true,
      userId,
      daysThreshold,
      documents: expiringDocs,
      total: expiringDocs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get expiring documents'
    });
  }
}

/**
 * GET /api/notifications/users/:userId/expired
 * Get user's expired documents
 */
export async function handleGetExpiredDocuments(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const expiredDocs = notificationEngine.getExpiredDocuments(userId);

    res.json({
      success: true,
      userId,
      documents: expiredDocs,
      total: expiredDocs.length,
      message: expiredDocs.length > 0
        ? `Warning: ${expiredDocs.length} document(s) have expired`
        : 'No expired documents'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get expired documents'
    });
  }
}

/**
 * PUT /api/notifications/documents/:documentId
 * Update document expiry date
 */
export async function handleUpdateDocumentExpiry(req: Request, res: Response) {
  try {
    const { documentId } = req.params;
    const { expiryDate } = req.body;

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        error: 'Expiry date is required'
      });
    }

    const updated = notificationEngine.updateDocumentExpiry(
      documentId,
      new Date(expiryDate)
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      message: 'Document expiry date updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update document expiry'
    });
  }
}

// ============================================================================
// NOTIFICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/notifications/generate/renewal-reminder
 * Generate renewal reminder notification
 */
export async function handleGenerateRenewalReminder(req: Request, res: Response) {
  try {
    const { userId, documentId, channels } = req.body;

    if (!userId || !documentId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and document ID are required'
      });
    }

    const notification = notificationEngine.createRenewalReminder(
      userId,
      documentId,
      channels || ['email']
    );

    if (!notification) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create reminder'
      });
    }

    res.status(201).json({
      success: true,
      notification,
      message: 'Renewal reminder created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate renewal reminder'
    });
  }
}

/**
 * POST /api/notifications/generate/expiry-alert
 * Generate expiry alert notification
 */
export async function handleGenerateExpiryAlert(req: Request, res: Response) {
  try {
    const { userId, documentId, severity } = req.body;

    if (!userId || !documentId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and document ID are required'
      });
    }

    const notification = notificationEngine.createExpiryAlert(
      userId,
      documentId,
      severity || 'alert'
    );

    if (!notification) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create alert'
      });
    }

    res.status(201).json({
      success: true,
      notification,
      message: 'Expiry alert created'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate expiry alert'
    });
  }
}

/**
 * POST /api/notifications/generate/countdown
 * Generate countdown reminders for user
 */
export async function handleGenerateCountdown(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const notifications = notificationEngine.createCountdownReminder(userId);

    res.status(201).json({
      success: true,
      notifications,
      total: notifications.length,
      message: `${notifications.length} countdown reminder(s) created`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate countdown reminders'
    });
  }
}

/**
 * POST /api/notifications/:notificationId/send
 * Send a notification
 */
export async function handleSendNotification(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;
    const { channels } = req.body;

    const success = await notificationEngine.sendNotification(notificationId, channels);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const notification = notificationEngine.getNotification(notificationId);

    res.json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
}

/**
 * GET /api/notifications/users/:userId
 * Get user's notifications
 */
export async function handleGetUserNotifications(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const notifications = notificationEngine.getUserNotifications(userId, {
      limit,
      offset,
      type: type as any,
      status: status as any
    });

    res.json({
      success: true,
      notifications,
      total: notifications.length,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
}

/**
 * PUT /api/notifications/:notificationId/read
 * Mark notification as read
 */
export async function handleMarkAsRead(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;

    const marked = notificationEngine.markAsRead(notificationId);

    if (!marked) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark as read'
    });
  }
}

/**
 * DELETE /api/notifications/:notificationId
 * Delete notification
 */
export async function handleDeleteNotification(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;

    const deleted = notificationEngine.deleteNotification(notificationId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
}

/**
 * POST /api/notifications/:notificationId/schedule
 * Schedule notification for later
 */
export async function handleScheduleNotification(req: Request, res: Response) {
  try {
    const { notificationId } = req.params;
    const { scheduledTime } = req.body;

    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled time is required'
      });
    }

    const scheduled = notificationEngine.scheduleNotification(
      notificationId,
      new Date(scheduledTime)
    );

    if (!scheduled) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: `Notification scheduled for ${scheduledTime}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to schedule notification'
    });
  }
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/notifications/admin-logs
 * Get admin notification logs
 */
export async function handleGetAdminLogs(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = notificationEngine.getAdminLogs({
      userId,
      action,
      limit,
      offset
    });

    res.json({
      success: true,
      logs,
      total: logs.length,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get admin logs'
    });
  }
}

/**
 * GET /api/notifications/statistics
 * Get notification statistics
 */
export async function handleGetStatistics(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;

    const statistics = notificationEngine.getStatistics(userId);

    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
}

/**
 * POST /api/notifications/admin/retry-failed
 * Retry all failed notifications
 */
export async function handleRetryFailed(req: Request, res: Response) {
  try {
    const retried = await notificationEngine.retryFailedNotifications();

    res.json({
      success: true,
      retried,
      message: `${retried} notification(s) retried`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retry notifications'
    });
  }
}

// ============================================================================
// SCHEDULER ENDPOINTS
// ============================================================================

/**
 * GET /api/notifications/scheduler/status
 * Get scheduler status
 */
export async function handleSchedulerStatus(req: Request, res: Response) {
  try {
    const isRunning = notificationScheduler.isSchedulerRunning();
    const stats = notificationScheduler.getStatistics();

    res.json({
      success: true,
      isRunning,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status'
    });
  }
}

/**
 * POST /api/notifications/scheduler/start
 * Start the scheduler
 */
export async function handleStartScheduler(req: Request, res: Response) {
  try {
    notificationScheduler.start();

    res.json({
      success: true,
      message: 'Scheduler started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler'
    });
  }
}

/**
 * POST /api/notifications/scheduler/stop
 * Stop the scheduler
 */
export async function handleStopScheduler(req: Request, res: Response) {
  try {
    notificationScheduler.stop();

    res.json({
      success: true,
      message: 'Scheduler stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler'
    });
  }
}

/**
 * POST /api/notifications/scheduler/trigger/:jobName
 * Manually trigger a scheduler job
 */
export async function handleTriggerJob(req: Request, res: Response) {
  try {
    const { jobName } = req.params;

    await notificationScheduler.triggerJob(jobName);

    res.json({
      success: true,
      message: `Job '${jobName}' triggered successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: String(error)
    });
  }
}

/**
 * GET /api/notifications/scheduler/logs
 * Get notification logs (alias for admin logs)
 */
export async function handleGetNotificationLogs(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = notificationEngine.getAdminLogs({
      limit,
      offset
    });

    res.json({
      success: true,
      notifications: logs.map(log => ({
        notificationId: log.notificationId,
        userId: log.userId,
        action: log.action,
        channel: log.channel,
        status: log.status,
        timestamp: log.timestamp
      })),
      total: logs.length,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get notification logs'
    });
  }
}

// ============================================================================
// EXPORT HANDLERS
// ============================================================================

export const notificationHandlers = {
  // Preferences
  handleSavePreferences,
  handleGetPreferences,
  handleDeletePreferences,

  // Documents
  handleRegisterDocument,
  handleGetDocument,
  handleGetExpiringDocuments,
  handleGetExpiredDocuments,
  handleUpdateDocumentExpiry,

  // Notifications
  handleGenerateRenewalReminder,
  handleGenerateExpiryAlert,
  handleGenerateCountdown,
  handleSendNotification,
  handleGetUserNotifications,
  handleMarkAsRead,
  handleDeleteNotification,
  handleScheduleNotification,

  // Admin
  handleGetAdminLogs,
  handleGetStatistics,
  handleRetryFailed,
  handleGetNotificationLogs,

  // Scheduler
  handleSchedulerStatus,
  handleStartScheduler,
  handleStopScheduler,
  handleTriggerJob
};
