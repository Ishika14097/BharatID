/**
 * Print & Download REST API Handlers
 * 
 * Endpoints:
 * - GET /api/documents/:documentId/download
 * - GET /api/documents/:documentId/preview
 * - POST /api/documents/print
 * - POST /api/documents/bulk-download
 * - GET /api/documents/download-history
 * - POST /api/documents/create-share-link
 * - GET /api/documents/verify-secure-link
 * - POST /api/documents/add-watermark
 * - GET /api/documents/statistics
 * - GET /api/security/audit-logs
 */

import { Request, Response } from 'express';
import { documentService, DocumentMetadata, BulkDownloadRequest } from './document-service';
import { pdfGenerationService } from './pdf-generation-service';
import { accessControlService } from './access-control-service';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Download document
 * GET /api/documents/:documentId/download
 */
export async function downloadDocument(req: Request, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id || '';
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const linkId = req.query.linkId as string | undefined;
    const token = req.query.token as string | undefined;

    const doc = documentService.getDocument(documentId);

    if (!doc) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // Verify access (either owner, secure link, or public)
    let accessGranted = false;
    let denialReason: string | undefined;

    if (linkId && token) {
      // Verify secure link
      const linkVerification = documentService.verifySecureLink(linkId, token, ipAddress);
      if (linkVerification.valid) {
        accessGranted = true;
        documentService.consumeSecureLink(linkId);
      } else {
        denialReason = linkVerification.reason;
      }
    } else if (userId) {
      // Verify regular access
      const accessVerification = documentService.verifyAccess(documentId, userId, ipAddress, userAgent);
      if (accessVerification.granted) {
        accessGranted = true;
      } else {
        denialReason = accessVerification.reason;
      }
    } else {
      denialReason = 'Authentication required';
    }

    // Record download attempt
    documentService.recordDownload(
      userId,
      documentId,
      'direct',
      doc.format,
      ipAddress,
      userAgent,
      accessGranted,
      denialReason
    );

    if (!accessGranted) {
      accessControlService.logAuditAction(
        userId,
        'document_download',
        'document',
        documentId,
        'denied',
        ipAddress,
        userAgent,
        { reason: denialReason }
      );

      res.status(403).json({
        success: false,
        error: denialReason || 'Access denied'
      });
      return;
    }

    // Log successful access
    accessControlService.logAuditAction(
      userId,
      'document_download',
      'document',
      documentId,
      'success',
      ipAddress,
      userAgent
    );

    // Send file
    const filePath = doc.localPath || doc.cloudStorageUrl;
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
      return;
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.setHeader('Content-Length', doc.fileSize);

    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      error: 'Download failed'
    });
  }
}

/**
 * Preview document
 * GET /api/documents/:documentId/preview
 */
export async function previewDocument(req: Request, res: Response): Promise<void> {
  try {
    const { documentId } = req.params;
    const userId = req.user?.id || '';
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    const doc = documentService.getDocument(documentId);

    if (!doc) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // Verify access
    const accessVerification = documentService.verifyAccess(documentId, userId, ipAddress, userAgent);
    if (!accessVerification.granted) {
      res.status(403).json({
        success: false,
        error: accessVerification.reason
      });
      return;
    }

    // Generate printable HTML
    const htmlContent = pdfGenerationService.generatePrintableHTML(
      doc.fileName,
      doc.documentType,
      { documentId: doc.documentId, status: doc.verified ? 'Verified' : 'Unverified' },
      false
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('Error previewing document:', error);
    res.status(500).json({
      success: false,
      error: 'Preview failed'
    });
  }
}

/**
 * Print document
 * POST /api/documents/print
 */
export async function printDocument(req: Request, res: Response): Promise<void> {
  try {
    const { documentId, includeWatermark } = req.body;
    const userId = req.user?.id || '';
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    if (!documentId) {
      res.status(400).json({
        success: false,
        error: 'documentId is required'
      });
      return;
    }

    // Check permission
    if (!accessControlService.hasPermission(userId, 'print')) {
      accessControlService.logAuditAction(
        userId,
        'document_print',
        'document',
        documentId,
        'denied',
        ipAddress,
        userAgent,
        { reason: 'Insufficient permissions' }
      );

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions for printing'
      });
      return;
    }

    // Verify access
    const doc = documentService.getDocument(documentId);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    const accessVerification = documentService.verifyAccess(documentId, userId, ipAddress, userAgent);
    if (!accessVerification.granted) {
      res.status(403).json({
        success: false,
        error: accessVerification.reason
      });
      return;
    }

    // Generate printable HTML
    const htmlContent = pdfGenerationService.generatePrintableHTML(
      doc.fileName,
      doc.documentType,
      { documentId: doc.documentId, status: doc.verified ? 'Verified' : 'Unverified' },
      includeWatermark
    );

    // Record print action
    documentService.recordDownload(
      userId,
      documentId,
      'print',
      'pdf',
      ipAddress,
      userAgent,
      true
    );

    // Log audit action
    accessControlService.logAuditAction(
      userId,
      'document_print',
      'document',
      documentId,
      'success',
      ipAddress,
      userAgent,
      { includeWatermark }
    );

    res.json({
      success: true,
      htmlContent,
      document: {
        name: doc.fileName,
        type: doc.documentType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error printing document:', error);
    res.status(500).json({
      success: false,
      error: 'Print operation failed'
    });
  }
}

/**
 * Bulk download documents
 * POST /api/documents/bulk-download
 */
export async function bulkDownload(req: Request, res: Response): Promise<void> {
  try {
    const { documentIds, format = 'zip', includeWatermark = false } = req.body;
    const userId = req.user?.id || '';
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'At least one documentId is required'
      });
      return;
    }

    // Check permission
    if (!accessControlService.hasPermission(userId, 'bulk_download')) {
      accessControlService.logAuditAction(
        userId,
        'bulk_download',
        'documents',
        documentIds[0],
        'denied',
        ipAddress,
        userAgent,
        { reason: 'Insufficient permissions', count: documentIds.length }
      );

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions for bulk download'
      });
      return;
    }

    // Create bulk download request
    const request = documentService.createBulkDownloadRequest(
      userId,
      documentIds,
      format as 'zip' | 'pdf-combined',
      includeWatermark
    );

    // Update status to processing
    documentService.updateBulkDownloadStatus(request.requestId, 'processing');

    // Process documents
    const outputPath = path.join('./temp/bulk', `${request.requestId}.${format === 'zip' ? 'zip' : 'pdf'}`);

    // Verify access and collect eligible documents
    const accessibleDocuments: Array<{ documentId: string; fileName: string; format: string; localPath?: string }> = [];

    for (const documentId of documentIds) {
      const doc = documentService.getDocument(documentId);

      if (!doc) continue;

      const accessVerification = documentService.verifyAccess(documentId, userId, ipAddress, userAgent);
      if (!accessVerification.granted) continue;

      accessibleDocuments.push({
        documentId: doc.documentId,
        fileName: doc.fileName,
        format: doc.format,
        localPath: doc.localPath
      });

      // Record each download
      documentService.recordDownload(
        userId,
        documentId,
        'bulk',
        doc.format,
        ipAddress,
        userAgent,
        true
      );
    }

    if (accessibleDocuments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No documents available for download'
      });
      return;
    }

    if (format === 'pdf-combined') {
      const pdfPaths = accessibleDocuments
        .map(doc => doc.localPath)
        .filter((filePath): filePath is string => Boolean(filePath) && fs.existsSync(filePath));

      if (pdfPaths.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No PDF files available for combined download'
        });
        return;
      }

      const merged = await pdfGenerationService.mergePDFs(
        pdfPaths,
        `${request.requestId}.pdf`,
        { includeWatermark }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="documents_${request.requestId}.pdf"`);
      fs.createReadStream(merged).pipe(res);
      documentService.updateBulkDownloadStatus(request.requestId, 'ready', merged);
    } else {
      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      accessibleDocuments.forEach(doc => {
        if (doc.localPath && fs.existsSync(doc.localPath)) {
          archive.file(doc.localPath, { name: doc.fileName });
        }
      });

      // Finalize archive
      archive.on('error', (err: any) => {
        console.error('Archive error:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to create archive'
        });
      });

      // Send archive
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="documents_${request.requestId}.zip"`);

      archive.pipe(res);
      archive.finalize();

      // Update status to ready
      documentService.updateBulkDownloadStatus(request.requestId, 'ready', outputPath);
    }

    // Log audit action
    accessControlService.logAuditAction(
      userId,
      'bulk_download',
      'documents',
      documentIds[0],
      'success',
      ipAddress,
      userAgent,
      { count: accessibleDocuments.length, format, includeWatermark }
    );
  } catch (error) {
    console.error('Error in bulk download:', error);
    res.status(500).json({
      success: false,
      error: 'Bulk download failed'
    });
  }
}

/**
 * Get download history
 * GET /api/documents/download-history?limit=50&offset=0
 */
export async function getDownloadHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id || '';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const history = documentService.getDownloadHistory(userId, limit, offset);
    const stats = documentService.getDownloadStatistics(userId);

    res.json({
      success: true,
      history,
      statistics: stats,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting download history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve history'
    });
  }
}

/**
 * Create share link
 * POST /api/documents/create-share-link
 */
export async function createShareLink(req: Request, res: Response): Promise<void> {
  try {
    const { documentId, expiryMinutes = 60, maxAccess = 5 } = req.body;
    const userId = req.user?.id || '';
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    if (!documentId) {
      res.status(400).json({
        success: false,
        error: 'documentId is required'
      });
      return;
    }

    // Check permission
    if (!accessControlService.hasPermission(userId, 'share')) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions for sharing'
      });
      return;
    }

    const doc = documentService.getDocument(documentId);

    if (!doc || doc.userId !== userId) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // Create secure link
    const link = documentService.createSecureLink(
      documentId,
      userId,
      expiryMinutes,
      maxAccess
    );

    // Log audit action
    accessControlService.logAuditAction(
      userId,
      'share_link_created',
      'document',
      documentId,
      'success',
      ipAddress,
      userAgent,
      { linkId: link.linkId, expiryMinutes, maxAccess }
    );

    res.json({
      success: true,
      link: {
        linkId: link.linkId,
        token: link.token,
        expiresAt: link.expiresAt,
        maxAccess: link.maxAccess,
        shareUrl: `${req.protocol}://${req.get('host')}/api/documents/secure-link/${link.linkId}?token=${link.token}`
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create share link'
    });
  }
}

/**
 * Get document statistics
 * GET /api/documents/statistics
 */
export async function getDocumentStatistics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id || '';

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userDocs = documentService.getUserDocuments(userId);
    const stats = documentService.getDownloadStatistics(userId);
    const serviceStats = documentService.exportStatistics();

    res.json({
      success: true,
      userStatistics: {
        totalDocuments: userDocs.length,
        verifiedDocuments: userDocs.filter(d => d.verified).length,
        ...stats
      },
      systemStatistics: serviceStats
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
}

/**
 * Get audit logs (admin only)
 * GET /api/security/audit-logs?limit=100&userId=xxx
 */
export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id || '';
    const userRole = req.user?.role || 'user';

    if (userRole !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
      return;
    }

    const targetUserId = (req.query.userId as string) || userId;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = accessControlService.getAuditLogs(targetUserId, limit, offset);
    const stats = accessControlService.getSecurityStatistics();

    res.json({
      success: true,
      logs,
      statistics: stats,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs'
    });
  }
}
