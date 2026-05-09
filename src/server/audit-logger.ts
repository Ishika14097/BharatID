/**
 * Audit Logger Service
 * 
 * Comprehensive audit logging with:
 * - Structured logging
 * - Multiple log levels
 * - IP tracking
 * - User tracking
 * - Log filtering and export
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogAction = 
  | 'document_registered'
  | 'document_downloaded'
  | 'document_printed'
  | 'document_shared'
  | 'bulk_download'
  | 'access_denied'
  | 'share_link_created'
  | 'share_link_verified'
  | 'share_link_expired'
  | 'user_login'
  | 'user_logout'
  | 'user_profile_updated'
  | 'permission_changed'
  | 'account_suspended'
  | 'account_reactivated'
  | 'ip_blocked'
  | 'ip_unblocked'
  | 'suspicious_activity'
  | 'security_check'
  | 'system_error';

/**
 * Audit log entry
 */
export interface AuditLog {
  logId: string;
  timestamp: Date;
  level: LogLevel;
  action: LogAction;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  message: string;
  details?: Record<string, any>;
  duration?: number; // milliseconds
}

/**
 * Log filter criteria
 */
export interface LogFilter {
  userId?: string;
  action?: LogAction;
  level?: LogLevel;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  resourceId?: string;
  statusCode?: number;
}

/**
 * Audit Logger Service
 */
export class AuditLoggerService {
  private logs: AuditLog[] = [];
  private logDir: string;
  private maxLogsInMemory: number = 10000;
  private retentionDays: number = 365;
  private startTime: number = Date.now();

  constructor(logDir: string = './logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();
    this.startCleanupScheduler();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log an action
   */
  public log(
    action: LogAction,
    message: string,
    options: {
      level?: LogLevel;
      userId?: string;
      resourceId?: string;
      resourceType?: string;
      ipAddress?: string;
      userAgent?: string;
      statusCode?: number;
      details?: Record<string, any>;
      duration?: number;
    } = {}
  ): AuditLog {
    const logId = crypto.randomUUID();
    const timestamp = new Date();

    const entry: AuditLog = {
      logId,
      timestamp,
      level: options.level || 'info',
      action,
      userId: options.userId,
      resourceId: options.resourceId,
      resourceType: options.resourceType,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      statusCode: options.statusCode,
      message,
      details: options.details,
      duration: options.duration
    };

    this.logs.push(entry);

    // Also write to file for persistence
    this.writeLogToFile(entry);

    // Enforce max logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Log to console for debugging
    this.logToConsole(entry);

    return entry;
  }

  /**
   * Convenience method: log info
   */
  public info(
    action: LogAction,
    message: string,
    options?: Parameters<typeof this.log>[2]
  ): AuditLog {
    return this.log(action, message, { ...options, level: 'info' });
  }

  /**
   * Convenience method: log warning
   */
  public warn(
    action: LogAction,
    message: string,
    options?: Parameters<typeof this.log>[2]
  ): AuditLog {
    return this.log(action, message, { ...options, level: 'warn' });
  }

  /**
   * Convenience method: log error
   */
  public error(
    action: LogAction,
    message: string,
    options?: Parameters<typeof this.log>[2]
  ): AuditLog {
    return this.log(action, message, { ...options, level: 'error' });
  }

  /**
   * Convenience method: log critical
   */
  public critical(
    action: LogAction,
    message: string,
    options?: Parameters<typeof this.log>[2]
  ): AuditLog {
    return this.log(action, message, { ...options, level: 'critical' });
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: AuditLog): void {
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[32m',     // Green
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      critical: '\x1b[41m'  // Red background
    };

    const color = levelColors[entry.level];
    const reset = '\x1b[0m';

    const timestamp = entry.timestamp.toISOString();
    const prefix = `${color}[${timestamp}] ${entry.level.toUpperCase()}${reset}`;

    console.log(`${prefix} ${entry.action}: ${entry.message}`);
  }

  /**
   * Write log to file
   */
  private writeLogToFile(entry: AuditLog): void {
    try {
      const logFile = path.join(this.logDir, `audit-${entry.timestamp.toISOString().split('T')[0]}.jsonl`);
      const logLine = JSON.stringify(entry) + '\n';

      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Filter logs
   */
  public filter(criteria: LogFilter): AuditLog[] {
    return this.logs.filter(log => {
      if (criteria.userId && log.userId !== criteria.userId) return false;
      if (criteria.action && log.action !== criteria.action) return false;
      if (criteria.level && log.level !== criteria.level) return false;
      if (criteria.startDate && log.timestamp < criteria.startDate) return false;
      if (criteria.endDate && log.timestamp > criteria.endDate) return false;
      if (criteria.ipAddress && log.ipAddress !== criteria.ipAddress) return false;
      if (criteria.resourceId && log.resourceId !== criteria.resourceId) return false;
      if (criteria.statusCode && log.statusCode !== criteria.statusCode) return false;

      return true;
    });
  }

  /**
   * Get user activity
   */
  public getUserActivity(userId: string, limit: number = 100): AuditLog[] {
    return this.filter({ userId })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get resource activity
   */
  public getResourceActivity(resourceId: string, limit: number = 100): AuditLog[] {
    return this.filter({ resourceId })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get IP activity
   */
  public getIPActivity(ipAddress: string, limit: number = 100): AuditLog[] {
    return this.filter({ ipAddress })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get suspicious activities
   */
  public getSuspiciousActivities(limit: number = 100): AuditLog[] {
    const suspicious = this.logs.filter(
      log => log.level === 'warn' || log.level === 'error' || log.level === 'critical'
    );

    return suspicious
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security events
   */
  public getSecurityEvents(limit: number = 100): AuditLog[] {
    const securityActions: LogAction[] = [
      'access_denied',
      'ip_blocked',
      'account_suspended',
      'suspicious_activity',
      'security_check'
    ];

    const events = this.logs.filter(log => securityActions.includes(log.action));

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Export logs as JSON
   */
  public exportJSON(criteria?: LogFilter): string {
    const logsToExport = criteria ? this.filter(criteria) : this.logs;
    return JSON.stringify(logsToExport, null, 2);
  }

  /**
   * Export logs as CSV
   */
  public exportCSV(criteria?: LogFilter): string {
    const logsToExport = criteria ? this.filter(criteria) : this.logs;

    const headers = ['Timestamp', 'Level', 'Action', 'UserId', 'ResourceId', 'IP', 'Message', 'StatusCode'];
    const rows = logsToExport.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.action,
      log.userId || '-',
      log.resourceId || '-',
      log.ipAddress || '-',
      log.message.replace(/"/g, '""'),
      log.statusCode || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get statistics
   */
  public getStatistics(criteria?: LogFilter) {
    const logsToAnalyze = criteria ? this.filter(criteria) : this.logs;

    const stats = {
      totalLogs: logsToAnalyze.length,
      logsByLevel: {} as Record<LogLevel, number>,
      logsByAction: {} as Record<string, number>,
      logsByUser: {} as Record<string, number>,
      errorCount: 0,
      warningCount: 0,
      averageResponseTime: 0,
      oldestLog: null as Date | null,
      newestLog: null as Date | null
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logsToAnalyze) {
      // By level
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;

      // By action
      stats.logsByAction[log.action] = (stats.logsByAction[log.action] || 0) + 1;

      // By user
      if (log.userId) {
        stats.logsByUser[log.userId] = (stats.logsByUser[log.userId] || 0) + 1;
      }

      // Counters
      if (log.level === 'error') stats.errorCount++;
      if (log.level === 'warn') stats.warningCount++;

      // Duration
      if (log.duration) {
        totalDuration += log.duration;
        durationCount++;
      }

      // Date range
      if (!stats.oldestLog || log.timestamp < stats.oldestLog) {
        stats.oldestLog = log.timestamp;
      }
      if (!stats.newestLog || log.timestamp > stats.newestLog) {
        stats.newestLog = log.timestamp;
      }
    }

    if (durationCount > 0) {
      stats.averageResponseTime = Math.round(totalDuration / durationCount);
    }

    return stats;
  }

  /**
   * Clean up old logs
   */
  public cleanupOldLogs(retentionDays: number = this.retentionDays): number {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const originalCount = this.logs.length;

    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);

    const deletedCount = originalCount - this.logs.length;

    if (deletedCount > 0) {
      this.info('security_check', `Cleaned up ${deletedCount} old logs`);
    }

    return deletedCount;
  }

  /**
   * Start cleanup scheduler
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  /**
   * Get uptime
   */
  public getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get system health
   */
  public getSystemHealth() {
    const stats = this.getStatistics();
    const uptime = this.getUptime();

    const errorRate = stats.totalLogs > 0 ? (stats.errorCount / stats.totalLogs) * 100 : 0;
    const health = {
      status: errorRate < 1 ? 'healthy' : errorRate < 5 ? 'warning' : 'critical',
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: Math.round(uptime / 1000), // seconds
      totalLogs: stats.totalLogs,
      recentErrors: stats.errorCount,
      recentWarnings: stats.warningCount
    };

    return health;
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggerService(process.env.LOG_DIR || './logs');
