/**
 * Document Service Layer - Print & Download Module
 * 
 * Handles:
 * - Document management and retrieval
 * - File storage and verification
 * - Download link generation
 * - Format conversions
 * - Document metadata
 * - File cleanup and retention
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type DocumentFormat = 'pdf' | 'jpg' | 'png' | 'zip';
export type DocumentType = 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'kyc' | 'other';
export type AccessLevel = 'public' | 'private' | 'restricted';

/**
 * Document metadata
 */
export interface DocumentMetadata {
  documentId: string;
  userId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  format: DocumentFormat;
  mimeType: string;
  uploadedAt: Date;
  expiresAt?: Date;
  verified: boolean;
  accessLevel: AccessLevel;
  cloudStorageUrl?: string;
  localPath?: string;
  checksum?: string;
}

/**
 * Download record for audit trail
 */
export interface DownloadRecord {
  recordId: string;
  userId: string;
  documentId: string;
  downloadType: 'direct' | 'print' | 'bulk' | 'shared';
  format: DocumentFormat;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  accessGranted: boolean;
  denialReason?: string;
  expiryDate?: Date;
}

/**
 * Temporary secure download link
 */
export interface SecureDownloadLink {
  linkId: string;
  documentId: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccess: number;
  ipWhitelist?: string[];
  downloadsRemaining: number;
}

/**
 * Bulk download request
 */
export interface BulkDownloadRequest {
  requestId: string;
  userId: string;
  documentIds: string[];
  documentTypes?: DocumentType[];
  format: 'zip' | 'pdf-combined';
  includeWatermark: boolean;
  timestamp: Date;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  outputPath?: string;
  expiresAt: Date;
}

/**
 * Main Document Service
 */
export class DocumentService {
  private documents: Map<string, DocumentMetadata> = new Map();
  private downloadRecords: DownloadRecord[] = [];
  private secureLinks: Map<string, SecureDownloadLink> = new Map();
  private bulkRequests: Map<string, BulkDownloadRequest> = new Map();
  private tempDir: string;

  constructor(tempDir: string = './temp/documents') {
    this.tempDir = tempDir;
    this.initializeTempDirectory();
    this.startCleanupScheduler();
  }

  /**
   * Initialize temporary directory
   */
  private initializeTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Register a document
   */
  public registerDocument(
    userId: string,
    fileName: string,
    fileSize: number,
    format: DocumentFormat,
    documentType: DocumentType,
    cloudStorageUrl?: string,
    localPath?: string
  ): DocumentMetadata {
    const documentId = crypto.randomUUID();
    const mimeType = this.getMimeType(format);

    const metadata: DocumentMetadata = {
      documentId,
      userId,
      documentType,
      fileName,
      fileSize,
      format,
      mimeType,
      uploadedAt: new Date(),
      verified: false,
      accessLevel: 'private',
      cloudStorageUrl,
      localPath,
      checksum: this.generateChecksum(fileName, fileSize)
    };

    this.documents.set(documentId, metadata);
    return metadata;
  }

  /**
   * Get document metadata
   */
  public getDocument(documentId: string): DocumentMetadata | null {
    return this.documents.get(documentId) || null;
  }

  /**
   * Get secure link metadata
   */
  public getSecureLink(linkId: string): SecureDownloadLink | null {
    return this.secureLinks.get(linkId) || null;
  }

  /**
   * Get user's documents
   */
  public getUserDocuments(userId: string, documentType?: DocumentType): DocumentMetadata[] {
    return Array.from(this.documents.values()).filter(doc =>
      doc.userId === userId && (!documentType || doc.documentType === documentType)
    );
  }

  /**
   * Update document access level
   */
  public updateAccessLevel(documentId: string, accessLevel: AccessLevel): void {
    const doc = this.documents.get(documentId);
    if (doc) {
      doc.accessLevel = accessLevel;
    }
  }

  /**
   * Verify document access
   */
  public verifyAccess(
    documentId: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): { granted: boolean; reason?: string } {
    const doc = this.documents.get(documentId);

    if (!doc) {
      return { granted: false, reason: 'Document not found' };
    }

    // Owner can always access
    if (doc.userId === userId) {
      return { granted: true };
    }

    // Check expiry
    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return { granted: false, reason: 'Document expired' };
    }

    // Check access level
    if (doc.accessLevel === 'private' && doc.userId !== userId) {
      return { granted: false, reason: 'Insufficient permissions' };
    }

    return { granted: true };
  }

  /**
   * Create temporary secure download link
   */
  public createSecureLink(
    documentId: string,
    userId: string,
    expiryMinutes: number = 60,
    maxAccess: number = 5,
    ipWhitelist?: string[]
  ): SecureDownloadLink {
    const linkId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);

    const link: SecureDownloadLink = {
      linkId,
      documentId,
      userId,
      token,
      createdAt,
      expiresAt,
      accessCount: 0,
      maxAccess,
      ipWhitelist,
      downloadsRemaining: maxAccess
    };

    this.secureLinks.set(linkId, link);
    return link;
  }

  /**
   * Verify secure link
   */
  public verifySecureLink(
    linkId: string,
    token: string,
    ipAddress: string
  ): { valid: boolean; reason?: string } {
    const link = this.secureLinks.get(linkId);

    if (!link) {
      return { valid: false, reason: 'Link not found' };
    }

    // Check token
    if (link.token !== token) {
      return { valid: false, reason: 'Invalid token' };
    }

    // Check expiry
    if (link.expiresAt < new Date()) {
      this.secureLinks.delete(linkId);
      return { valid: false, reason: 'Link expired' };
    }

    // Check access count
    if (link.accessCount >= link.maxAccess) {
      this.secureLinks.delete(linkId);
      return { valid: false, reason: 'Max access limit reached' };
    }

    // Check IP whitelist
    if (link.ipWhitelist && !link.ipWhitelist.includes(ipAddress)) {
      return { valid: false, reason: 'IP not whitelisted' };
    }

    return { valid: true };
  }

  /**
   * Consume secure link (increment access count)
   */
  public consumeSecureLink(linkId: string): void {
    const link = this.secureLinks.get(linkId);
    if (link) {
      link.accessCount++;
      link.downloadsRemaining--;

      if (link.downloadsRemaining <= 0) {
        this.secureLinks.delete(linkId);
      }
    }
  }

  /**
   * Create bulk download request
   */
  public createBulkDownloadRequest(
    userId: string,
    documentIds: string[],
    format: 'zip' | 'pdf-combined' = 'zip',
    includeWatermark: boolean = false
  ): BulkDownloadRequest {
    const requestId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const request: BulkDownloadRequest = {
      requestId,
      userId,
      documentIds,
      format,
      includeWatermark,
      timestamp: new Date(),
      status: 'pending',
      expiresAt
    };

    this.bulkRequests.set(requestId, request);
    return request;
  }

  /**
   * Get bulk download request
   */
  public getBulkDownloadRequest(requestId: string): BulkDownloadRequest | null {
    return this.bulkRequests.get(requestId) || null;
  }

  /**
   * Update bulk download status
   */
  public updateBulkDownloadStatus(
    requestId: string,
    status: 'pending' | 'processing' | 'ready' | 'expired',
    outputPath?: string
  ): void {
    const request = this.bulkRequests.get(requestId);
    if (request) {
      request.status = status;
      if (outputPath) {
        request.outputPath = outputPath;
      }
    }
  }

  /**
   * Record download action for audit trail
   */
  public recordDownload(
    userId: string,
    documentId: string,
    downloadType: 'direct' | 'print' | 'bulk' | 'shared',
    format: DocumentFormat,
    ipAddress: string,
    userAgent: string,
    accessGranted: boolean,
    denialReason?: string
  ): DownloadRecord {
    const record: DownloadRecord = {
      recordId: crypto.randomUUID(),
      userId,
      documentId,
      downloadType,
      format,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      accessGranted,
      denialReason,
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days retention
    };

    this.downloadRecords.push(record);
    return record;
  }

  /**
   * Get download history for user
   */
  public getDownloadHistory(userId: string, limit: number = 100, offset: number = 0): DownloadRecord[] {
    return this.downloadRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get download statistics
   */
  public getDownloadStatistics(userId: string): {
    totalDownloads: number;
    successfulDownloads: number;
    failedDownloads: number;
    byType: Record<string, number>;
    byFormat: Record<string, number>;
  } {
    const records = this.downloadRecords.filter(r => r.userId === userId);

    const stats = {
      totalDownloads: records.length,
      successfulDownloads: records.filter(r => r.accessGranted).length,
      failedDownloads: records.filter(r => !r.accessGranted).length,
      byType: {} as Record<string, number>,
      byFormat: {} as Record<string, number>
    };

    records.forEach(record => {
      stats.byType[record.downloadType] = (stats.byType[record.downloadType] || 0) + 1;
      stats.byFormat[record.format] = (stats.byFormat[record.format] || 0) + 1;
    });

    return stats;
  }

  /**
   * Cleanup expired temporary files
   */
  private startCleanupScheduler(): void {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredFiles();
      this.cleanupExpiredLinks();
      this.cleanupExpiredBulkRequests();
      this.cleanupOldDownloadRecords();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up expired temporary files
   */
  private cleanupExpiredFiles(): void {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stat = fs.statSync(filePath);
        const fileAge = now - stat.mtimeMs;

        // Delete files older than 24 hours
        if (fileAge > 24 * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Clean up expired secure links
   */
  private cleanupExpiredLinks(): void {
    const now = new Date();
    for (const [linkId, link] of this.secureLinks.entries()) {
      if (link.expiresAt < now) {
        this.secureLinks.delete(linkId);
      }
    }
  }

  /**
   * Clean up expired bulk requests
   */
  private cleanupExpiredBulkRequests(): void {
    const now = new Date();
    for (const [requestId, request] of this.bulkRequests.entries()) {
      if (request.expiresAt < now) {
        if (request.outputPath && fs.existsSync(request.outputPath)) {
          fs.unlinkSync(request.outputPath);
        }
        this.bulkRequests.delete(requestId);
      }
    }
  }

  /**
   * Clean up old download records (keep 90 days)
   */
  private cleanupOldDownloadRecords(): void {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    this.downloadRecords = this.downloadRecords.filter(record => record.expiryDate! > cutoffDate);
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: DocumentFormat): string {
    const mimeTypes: Record<DocumentFormat, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      png: 'image/png',
      zip: 'application/zip'
    };
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Generate checksum for file verification
   */
  private generateChecksum(fileName: string, fileSize: number): string {
    return crypto
      .createHash('sha256')
      .update(fileName + fileSize)
      .digest('hex');
  }

  /**
   * Export statistics for admin dashboard
   */
  public exportStatistics(): {
    totalDocuments: number;
    totalDownloads: number;
    totalDownloadRecords: number;
    activeSecureLinks: number;
    pendingBulkRequests: number;
  } {
    return {
      totalDocuments: this.documents.size,
      totalDownloads: this.downloadRecords.filter(r => r.accessGranted).length,
      totalDownloadRecords: this.downloadRecords.length,
      activeSecureLinks: this.secureLinks.size,
      pendingBulkRequests: Array.from(this.bulkRequests.values()).filter(
        r => r.status === 'pending' || r.status === 'processing'
      ).length
    };
  }
}

// Export singleton instance
export const documentService = new DocumentService(process.env.TEMP_DIR || './temp/documents');
