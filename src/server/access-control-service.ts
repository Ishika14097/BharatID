/**
 * Access Control & Security Service
 * 
 * Handles:
 * - Permission verification
 * - Access control policies
 * - Rate limiting
 * - IP-based restrictions
 * - User role validation
 */

import crypto from 'crypto';

export type UserRole = 'admin' | 'user' | 'guest' | 'authorized_agent';
export type Permission = 'download' | 'print' | 'share' | 'bulk_download' | 'view_history';

/**
 * User security profile
 */
export interface UserSecurityProfile {
  userId: string;
  role: UserRole;
  permissions: Set<Permission>;
  ipAddresses: string[];
  lastActivity: Date;
  accountStatus: 'active' | 'suspended' | 'locked';
  mfaEnabled: boolean;
  loginAttempts: number;
  lastLoginDate: Date;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxDownloadsPerHour: number;
  maxPrintsPerHour: number;
  maxBulkDownloadsPerDay: number;
  maxShareLinksPerDay: number;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  logId: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  status: 'success' | 'failure' | 'denied';
  denialReason?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  retentionDays: number;
}

/**
 * Access Control Service
 */
export class AccessControlService {
  private userProfiles: Map<string, UserSecurityProfile> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private rateLimitConfig: RateLimitConfig = {
    maxDownloadsPerHour: 100,
    maxPrintsPerHour: 50,
    maxBulkDownloadsPerDay: 20,
    maxShareLinksPerDay: 30
  };
  private suspiciousActivities: Map<string, number> = new Map(); // IP -> fail count
  private suspiciousThreshold: number = 5;
  private lockoutDuration: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.startSecurityMonitoring();
  }

  /**
   * Create or get user security profile
   */
  public createUserProfile(
    userId: string,
    role: UserRole = 'user',
    permissions: Permission[] = ['download', 'print']
  ): UserSecurityProfile {
    if (!this.userProfiles.has(userId)) {
      const profile: UserSecurityProfile = {
        userId,
        role,
        permissions: new Set(permissions),
        ipAddresses: [],
        lastActivity: new Date(),
        accountStatus: 'active',
        mfaEnabled: false,
        loginAttempts: 0,
        lastLoginDate: new Date()
      };
      this.userProfiles.set(userId, profile);
      return profile;
    }
    return this.userProfiles.get(userId)!;
  }

  /**
   * Get user profile
   */
  public getUserProfile(userId: string): UserSecurityProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Update user permissions
   */
  public updateUserPermissions(userId: string, permissions: Permission[]): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.permissions = new Set(permissions);
    }
  }

  /**
   * Update user role
   */
  public updateUserRole(userId: string, role: UserRole): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.role = role;
    }
  }

  /**
   * Check if user has permission
   */
  public hasPermission(userId: string, permission: Permission): boolean {
    const profile = this.userProfiles.get(userId);

    if (!profile) {
      return false;
    }

    if (profile.accountStatus !== 'active') {
      return false;
    }

    if (profile.role === 'admin') {
      return true; // Admins have all permissions
    }

    return profile.permissions.has(permission);
  }

  /**
   * Verify access to document
   */
  public verifyDocumentAccess(
    userId: string,
    documentOwnerId: string,
    accessLevel: 'public' | 'private' | 'restricted',
    ipAddress: string,
    userAgent: string
  ): { allowed: boolean; reason?: string } {
    // Owner can always access
    if (userId === documentOwnerId) {
      this.logAuditAction(userId, 'document_access', 'document', documentOwnerId, 'success', ipAddress, userAgent);
      return { allowed: true };
    }

    // Check access level
    if (accessLevel === 'private') {
      this.logAuditAction(userId, 'document_access', 'document', documentOwnerId, 'denied', ipAddress, userAgent, {
        reason: 'Private document'
      });
      return { allowed: false, reason: 'This document is private' };
    }

    // Check IP restrictions
    if (this.isIPBlocked(ipAddress)) {
      this.logAuditAction(userId, 'document_access', 'document', documentOwnerId, 'denied', ipAddress, userAgent, {
        reason: 'IP blocked'
      });
      return { allowed: false, reason: 'Access denied from your IP address' };
    }

    // Check rate limits
    const rateLimitStatus = this.checkRateLimit(userId, 'download', ipAddress);
    if (!rateLimitStatus.allowed) {
      this.logAuditAction(userId, 'document_access', 'document', documentOwnerId, 'denied', ipAddress, userAgent, {
        reason: 'Rate limit exceeded'
      });
      return { allowed: false, reason: rateLimitStatus.reason };
    }

    this.logAuditAction(userId, 'document_access', 'document', documentOwnerId, 'success', ipAddress, userAgent);
    return { allowed: true };
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(
    userId: string,
    action: string,
    ipAddress: string
  ): { allowed: boolean; reason?: string } {
    const recentLogs = this.auditLogs.filter(log => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return log.userId === userId && log.timestamp > oneHourAgo && log.action === action;
    });

    const maxAttempts = action === 'download' ? this.rateLimitConfig.maxDownloadsPerHour : 50;

    if (recentLogs.length >= maxAttempts) {
      return {
        allowed: false,
        reason: `Rate limit exceeded. Maximum ${maxAttempts} ${action}s per hour.`
      };
    }

    return { allowed: true };
  }

  /**
   * Add IP to whitelist for user
   */
  public addIPToWhitelist(userId: string, ipAddress: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      if (!profile.ipAddresses.includes(ipAddress)) {
        profile.ipAddresses.push(ipAddress);
      }
    }
  }

  /**
   * Block IP address
   */
  public blockIP(ipAddress: string): void {
    this.suspiciousActivities.set(ipAddress, this.suspiciousThreshold + 1);
  }

  /**
   * Unblock IP address
   */
  public unblockIP(ipAddress: string): void {
    this.suspiciousActivities.delete(ipAddress);
  }

  /**
   * Check if IP is blocked
   */
  private isIPBlocked(ipAddress: string): boolean {
    const failCount = this.suspiciousActivities.get(ipAddress) || 0;
    return failCount >= this.suspiciousThreshold;
  }

  /**
   * Record failed access attempt
   */
  public recordFailedAttempt(ipAddress: string): void {
    const currentCount = this.suspiciousActivities.get(ipAddress) || 0;
    this.suspiciousActivities.set(ipAddress, currentCount + 1);

    if (currentCount + 1 >= this.suspiciousThreshold) {
      console.warn(`IP ${ipAddress} blocked due to suspicious activity`);
    }
  }

  /**
   * Suspend user account
   */
  public suspendUser(userId: string, reason: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.accountStatus = 'suspended';
      this.logAuditAction('system', 'account_suspend', 'user', userId, 'success', '0.0.0.0', 'system', {
        reason
      });
    }
  }

  /**
   * Reactivate user account
   */
  public reactivateUser(userId: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.accountStatus = 'active';
      profile.loginAttempts = 0;
      this.logAuditAction('system', 'account_reactivate', 'user', userId, 'success', '0.0.0.0', 'system');
    }
  }

  /**
   * Enable MFA for user
   */
  public enableMFA(userId: string): { secret: string; qrCode: string } {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.mfaEnabled = true;
    }

    // Mock MFA setup
    return {
      secret: crypto.randomBytes(32).toString('hex'),
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    };
  }

  /**
   * Log audit action
   */
  public logAuditAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    status: 'success' | 'failure' | 'denied',
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): AuditLogEntry {
    const logId = crypto.randomUUID();

    const entry: AuditLogEntry = {
      logId,
      timestamp: new Date(),
      userId,
      action,
      resource,
      resourceId,
      status,
      ipAddress,
      userAgent,
      metadata,
      retentionDays: 365 // 1 year retention
    };

    this.auditLogs.push(entry);

    // Record failed attempt for suspicious activity monitoring
    if (status === 'denied' || status === 'failure') {
      this.recordFailedAttempt(ipAddress);
    }

    return entry;
  }

  /**
   * Get audit logs for user
   */
  public getAuditLogs(userId: string, limit: number = 100, offset: number = 0): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get audit logs for resource
   */
  public getResourceAuditLogs(resourceId: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get suspicious activities
   */
  public getSuspiciousActivities(): Array<{ ipAddress: string; failCount: number }> {
    return Array.from(this.suspiciousActivities.entries())
      .map(([ip, count]) => ({ ipAddress: ip, failCount: count }))
      .filter(item => item.failCount >= this.suspiciousThreshold);
  }

  /**
   * Get security statistics
   */
  public getSecurityStatistics(): {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    mfaEnabledUsers: number;
    totalAuditLogs: number;
    blockedIPs: number;
    lastHourAttempts: number;
    lastHourFailures: number;
  } {
    const profiles = Array.from(this.userProfiles.values());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogs = this.auditLogs.filter(log => log.timestamp > oneHourAgo);

    return {
      totalUsers: profiles.length,
      activeUsers: profiles.filter(p => p.accountStatus === 'active').length,
      suspendedUsers: profiles.filter(p => p.accountStatus === 'suspended').length,
      mfaEnabledUsers: profiles.filter(p => p.mfaEnabled).length,
      totalAuditLogs: this.auditLogs.length,
      blockedIPs: this.getSuspiciousActivities().length,
      lastHourAttempts: recentLogs.length,
      lastHourFailures: recentLogs.filter(log => log.status !== 'success').length
    };
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Run security checks every hour
    setInterval(() => {
      this.cleanupOldLogs();
      this.resetSuspiciousActivities();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old audit logs
   */
  private cleanupOldLogs(): void {
    const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffDate);
  }

  /**
   * Reset suspicious activities for IPs that have been clean
   */
  private resetSuspiciousActivities(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const ipsToReset: string[] = [];

    for (const [ip, count] of this.suspiciousActivities.entries()) {
      const recentFailures = this.auditLogs.filter(
        log => log.ipAddress === ip && log.timestamp > oneHourAgo && log.status !== 'success'
      );

      if (recentFailures.length === 0) {
        ipsToReset.push(ip);
      }
    }

    ipsToReset.forEach(ip => this.suspiciousActivities.delete(ip));
  }
}

// Export singleton instance
export const accessControlService = new AccessControlService();
