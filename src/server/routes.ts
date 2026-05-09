/**
 * Express Routes Configuration
 * 
 * Integrates all print & download services into REST API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { documentService } from './document-service';
import { aiSuggest } from './api-assistant';
import {
  downloadDocument,
  previewDocument,
  printDocument,
  bulkDownload,
  getDownloadHistory,
  createShareLink,
  getDocumentStatistics,
  getAuditLogs
} from './api-print-download';
import { accessControlService } from './access-control-service';
import { auditLogger } from './audit-logger';

const router = Router();

/**
 * Authentication middleware
 */
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Mock authentication - replace with real JWT validation
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    req.user = { id: 'anonymous', role: 'guest' };
  } else {
    // In production, verify JWT token
    req.user = {
      id: token.split('-')[0] || 'user',
      role: token.includes('admin') ? 'admin' : 'user'
    };
  }

  next();
}

/**
 * Request logging middleware
 */
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    auditLogger.log('security_check', `${req.method} ${req.path}`, {
      level: statusCode >= 400 ? 'warn' : 'info',
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      statusCode,
      duration
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Apply middleware
 */
router.use(authMiddleware);
router.use(requestLogger);

/**
 * Health check
 */
router.get('/health', (req: Request, res: Response) => {
  const health = auditLogger.getSystemHealth();

  res.json({
    success: true,
    status: health.status,
    uptime: health.uptime,
    timestamp: new Date().toISOString()
  });
});

/**
 * Lightweight AI autofill suggestion endpoint
 */
router.post('/ai/suggest', aiSuggest);
/**
 * Document endpoints
 */

// Download single document
router.get('/documents/:documentId/download', downloadDocument);

// Download single document via request body
router.post('/documents/download', (req: Request, res: Response) => {
  const { documentId } = req.body || {};

  if (!documentId) {
    res.status(400).json({
      success: false,
      error: 'documentId is required'
    });
    return;
  }

  req.params = { ...req.params, documentId };
  return downloadDocument(req, res);
});

// Preview document
router.get('/documents/:documentId/preview', previewDocument);

// Preview document via alias route
router.get('/documents/preview/:documentId', previewDocument);

// Print document
router.post('/documents/print', printDocument);

// Bulk download documents
router.post('/documents/bulk-download', bulkDownload);

// Get download history
router.get('/documents/download-history', getDownloadHistory);

// Get download history alias
router.get('/documents/history', getDownloadHistory);

// Create share link
router.post('/documents/create-share-link', createShareLink);

// Create share link alias
router.post('/documents/share', createShareLink);

// Access secure temporary link
router.get('/documents/secure-link/:linkId', (req: Request, res: Response) => {
  const { linkId } = req.params;
  const token = req.query.token as string | undefined;
  const secureLink = documentService.getSecureLink(linkId);

  if (!token) {
    res.status(400).json({
      success: false,
      error: 'token is required'
    });
    return;
  }

  if (!secureLink) {
    res.status(404).json({
      success: false,
      error: 'Secure link not found'
    });
    return;
  }

  req.params = { ...req.params, documentId: secureLink.documentId };
  req.query = { ...req.query, linkId, token };
  return downloadDocument(req, res);
});

// Get document statistics
router.get('/documents/statistics', getDocumentStatistics);

/**
 * Security endpoints (admin only)
 */

// Get audit logs
router.get('/security/audit-logs', getAuditLogs);

// Get security statistics
router.get('/security/statistics', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  const stats = accessControlService.getSecurityStatistics();

  res.json({
    success: true,
    statistics: stats
  });
});

// Get suspicious activities
router.get('/security/suspicious-activities', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  const activities = accessControlService.getSuspiciousActivities();

  res.json({
    success: true,
    activities
  });
});

// Get system health
router.get('/security/health', (req: Request, res: Response) => {
  const health = auditLogger.getSystemHealth();

  res.json({
    success: true,
    health
  });
});

// Suspend user (admin only)
router.post('/security/users/:userId/suspend', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';
  const { userId } = req.params;
  const { reason } = req.body;

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  accessControlService.suspendUser(userId, reason || 'No reason provided');

  auditLogger.info('account_suspended', `User ${userId} suspended by admin`, {
    userId: req.user?.id,
    resourceId: userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: { reason }
  });

  res.json({
    success: true,
    message: `User ${userId} has been suspended`
  });
});

// Reactivate user (admin only)
router.post('/security/users/:userId/reactivate', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';
  const { userId } = req.params;

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  accessControlService.reactivateUser(userId);

  auditLogger.info('account_reactivated', `User ${userId} reactivated by admin`, {
    userId: req.user?.id,
    resourceId: userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json({
    success: true,
    message: `User ${userId} has been reactivated`
  });
});

// Block IP (admin only)
router.post('/security/ips/:ipAddress/block', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';
  const { ipAddress } = req.params;

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  accessControlService.blockIP(ipAddress);

  auditLogger.info('ip_blocked', `IP ${ipAddress} blocked by admin`, {
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: { blockedIP: ipAddress }
  });

  res.json({
    success: true,
    message: `IP ${ipAddress} has been blocked`
  });
});

// Unblock IP (admin only)
router.post('/security/ips/:ipAddress/unblock', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';
  const { ipAddress } = req.params;

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  accessControlService.unblockIP(ipAddress);

  auditLogger.info('ip_unblocked', `IP ${ipAddress} unblocked by admin`, {
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: { unblockedIP: ipAddress }
  });

  res.json({
    success: true,
    message: `IP ${ipAddress} has been unblocked`
  });
});

/**
 * Export logs (admin only)
 */
router.get('/security/logs/export', (req: Request, res: Response) => {
  const userRole = req.user?.role || 'user';
  const format = req.query.format as string || 'json';
  const userId = req.query.userId as string;

  if (userRole !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  const criteria = userId ? { userId } : undefined;

  let exportData: string;
  let contentType: string;
  let filename: string;

  if (format === 'csv') {
    exportData = auditLogger.exportCSV(criteria);
    contentType = 'text/csv';
    filename = `audit-logs-${new Date().toISOString()}.csv`;
  } else {
    exportData = auditLogger.exportJSON(criteria);
    contentType = 'application/json';
    filename = `audit-logs-${new Date().toISOString()}.json`;
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(exportData);
});

/**
 * Error handling middleware
 */
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  auditLogger.error('system_error', err.message, {
    userId: req.user?.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    details: { error: err.message, stack: err.stack }
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

export default router;

/**
 * Type augmentation for Express Request
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
