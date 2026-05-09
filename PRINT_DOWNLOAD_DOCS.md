# Print & Download Module Documentation

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: May 9, 2026  
**Author**: ID Hub Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Features](#security-features)
4. [API Reference](#api-reference)
5. [React Components](#react-components)
6. [Usage Examples](#usage-examples)
7. [Configuration](#configuration)
8. [Audit Logging](#audit-logging)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Print & Download module provides a secure, audited system for users to download, print, and share government ID documents. It integrates with the broader Bharat ID platform and provides:

- **Secure Downloads**: Token-based secure links with expiration and access limits
- **Watermarked PDFs**: Automatic watermarking of downloaded documents
- **Bulk Operations**: Download multiple documents as ZIP or combined PDF
- **Print-Ready HTML**: Browser-optimized printable layouts
- **Audit Trail**: Complete logging of all access and operations
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **IP Blocking**: Automatic blocking of suspicious IP addresses
- **Access Control**: Role-based permissions (Admin, User, Guest, Authorized Agent)

### Key Statistics

- **600+ lines**: DocumentService for lifecycle management
- **500+ lines**: PDFGenerationService for PDF creation and watermarking
- **550+ lines**: AccessControlService for security and permissions
- **400+ lines**: AuditLoggerService for comprehensive logging
- **Audit Retention**: 365 days of audit trail data
- **Rate Limits**: 100 downloads/hour, 50 prints/hour, 20 bulk/day, 30 shares/day

---

## Architecture

### Service Layer Pattern

The module follows a layered architecture with distinct services:

```
┌─────────────────────────────────────┐
│     REST API Endpoints (routes.ts)   │
├─────────────────────────────────────┤
│  Document Download Manager           │
│  Print Handler                       │
│  Bulk Download Processor             │
│  Share Link Manager                  │
├─────────────────────────────────────┤
│     Core Services                    │
├─────────────────────────────────────┤
│  DocumentService         ┐           │
│  PDFGenerationService    ├─ Audit ── AuditLoggerService
│  AccessControlService    ┘           │
├─────────────────────────────────────┤
│  Data Layer                          │
│  (In-Memory + File Persistence)      │
└─────────────────────────────────────┘
```

### Service Responsibilities

#### DocumentService
- **Register documents** with metadata
- **Verify access** via AccessControlService
- **Generate secure links** with token-based authentication
- **Track download history** and statistics
- **Manage bulk downloads** with expiration
- **Automatic cleanup** of expired links and requests (hourly)

**Key Methods**:
```typescript
registerDocument(userId, fileName, documentType, fileSize, format, mimeType, localPath)
verifyAccess(documentId, userId, ipAddress, userAgent)
createSecureLink(documentId, userId, expiryMinutes, maxAccess)
verifySecureLink(linkId, token, ipAddress)
recordDownload(userId, documentId, downloadType, format, ipAddress, userAgent, accessGranted)
getDownloadHistory(userId, limit, offset)
getDownloadStatistics(userId)
```

#### PDFGenerationService
- **Generate PDFs** from documents
- **Add watermarks** with customization (opacity, rotation, timestamp)
- **Merge multiple PDFs** into single document
- **Create print-ready HTML** with CSS media queries
- **Automatic cleanup** of temporary files (hourly)

**Key Methods**:
```typescript
generatePDF(sourcePath, documentName, options)
addWatermark(inputPath, config)
mergePDFs(pdfPaths, outputFileName, options)
generatePrintableHTML(documentName, documentType, metadata, includeWatermark)
cleanupOldFiles(maxAgeHours)
```

#### AccessControlService
- **Manage user profiles** with roles and permissions
- **Check permissions** for specific actions
- **Verify document access** with multi-layer checks
- **Block suspicious IPs** after threshold violations
- **Manage rate limits** per user and action
- **Log security events** for audit trail
- **Automatic cleanup** of old logs (hourly)

**Key Methods**:
```typescript
createUserProfile(userId, role, permissions)
hasPermission(userId, permission)
verifyDocumentAccess(userId, documentOwnerId, accessLevel, ipAddress, userAgent)
blockIP(ipAddress)
suspendUser(userId, reason)
logAuditAction(userId, action, resource, resourceId, status, ipAddress, userAgent, metadata)
getAuditLogs(userId, limit, offset)
getSecurityStatistics()
```

#### AuditLoggerService
- **Structured logging** with timestamps and metadata
- **Multiple log levels** (debug, info, warn, error, critical)
- **File persistence** with JSONL format (one entry per line)
- **Log filtering** and export (JSON/CSV)
- **Security event tracking** for compliance
- **Statistics and analytics** on platform usage

**Key Methods**:
```typescript
log(action, message, options)
info(action, message, options)
warn(action, message, options)
error(action, message, options)
critical(action, message, options)
filter(criteria)
getUserActivity(userId, limit)
getSecurityEvents(limit)
exportJSON(criteria)
exportCSV(criteria)
getStatistics(criteria)
getSystemHealth()
```

---

## Security Features

### 1. Access Control

**Four-tier permission system**:

| Role | Download | Print | Share | Bulk Download |
|------|----------|-------|-------|--------------|
| Admin | ✓ | ✓ | ✓ | ✓ |
| User | ✓ | ✓ | ✓ | ✓ |
| Guest | ✗ | ✗ | ✗ | ✗ |
| Authorized Agent | ✓ | ✓ | ✓ | ✗ |

**Document Access Levels**:
- `public`: Anyone can access (public documents)
- `private`: Only owner can access
- `restricted`: Owner + authorized users

### 2. Rate Limiting

Default limits (configurable):
- **100** downloads per hour per user
- **50** prints per hour per user
- **20** bulk downloads per day per user
- **30** share links per day per user

When exceeded: Returns 429 error with retry-after header

### 3. IP Blocking

Automatic IP blocking after 5 failed access attempts:
- Tracks failed attempts per IP
- Blocks IP for 15 minutes (configurable)
- Resets if no failures within 1 hour
- Admin can manually block/unblock IPs

### 4. Secure Links

Token-based temporary links:
- **Token**: 32-byte hexadecimal token (256-bit strength)
- **Expiration**: Configurable (default 60 minutes)
- **Max Access**: Configurable number of downloads (default 5)
- **IP Whitelist**: Optional IP restriction
- **Auto-cleanup**: Expired links removed hourly

Access requires: `linkId` + `token` + valid IP (if restricted)

### 5. Watermarking

Applied to all downloads:
- **Text**: "VERIFIED COPY" (customizable)
- **Opacity**: 15% (configurable, prevents obscuring content)
- **Rotation**: -45 degrees (diagonal)
- **Font Size**: 48px (configurable)
- **Timestamp**: Included with generation time

### 6. Audit Logging

Every action logged with:
- **User ID**: Who performed the action
- **Timestamp**: Exact time of action
- **IP Address**: Client IP address
- **User Agent**: Browser/app information
- **Action Type**: download, print, share, etc.
- **Resource**: Which document
- **Result**: success/failure/denied
- **Metadata**: Additional context (format, watermark, etc.)

**Retention**: 365 days (1 year)

---

## API Reference

### Base URL

```
http://localhost:3000/api
```

### Authentication

All endpoints (except `/health`) require Bearer token:

```
Authorization: Bearer <jwt-token>
```

### Common Response Format

**Success**:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### Endpoints

The module supports both the canonical routes and the compatibility aliases used by the current frontend. Prefer the `/api/documents/*` aliases when integrating from the browser.

#### 1. Download Document

```
POST /documents/download
GET /documents/:documentId/download[?linkId=xxx&token=yyy]
```

**Query Parameters**:
- `linkId` (optional): Share link ID
- `token` (optional): Share link token

**Response**: Binary file with appropriate content-type

**Status Codes**:
- `200`: Success
- `403`: Access denied
- `404`: Document not found
- `429`: Rate limit exceeded

**Example**:
```bash
# Direct download (owner only)
curl -H "Authorization: Bearer token" \
  http://localhost:3000/api/documents/doc-123/download

# Download via body alias
curl -X POST \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"doc-123"}' \
  http://localhost:3000/api/documents/download

# Via share link
curl http://localhost:3000/api/documents/secure-link/link-456?token=abc123def456
```

---

#### 2. Preview Document

```
GET /documents/:documentId/preview
GET /documents/preview/:documentId
```

**Response**: HTML document for in-browser preview

**Status Codes**:
- `200`: Success
- `403`: Access denied
- `404`: Document not found

**Example**:
```javascript
const response = await fetch('/api/documents/doc-123/preview', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const html = await response.text();
document.getElementById('preview').innerHTML = html;
```

---

#### 3. Print Document

```
POST /documents/print
```

**Body**:
```json
{
  "documentId": "doc-123",
  "includeWatermark": true
}
```

**Response**:
```json
{
  "success": true,
  "htmlContent": "<html>...</html>",
  "document": {
    "name": "document.pdf",
    "type": "aadhaar",
    "timestamp": "2026-05-09T10:30:00Z"
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `403`: Insufficient permissions
- `404`: Document not found

**Example**:
```javascript
const response = await fetch('/api/documents/print', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: 'doc-123',
    includeWatermark: true
  })
});
const data = await response.json();
const printWindow = window.open();
printWindow.document.write(data.htmlContent);
printWindow.print();
```

---

#### 4. Bulk Download

```
POST /documents/bulk-download
```

**Body**:
```json
{
  "documentIds": ["doc-1", "doc-2", "doc-3"],
  "format": "pdf-combined",
  "includeWatermark": false
}
```

**Body Parameters**:
- `format`: `zip` or `pdf-combined` (default: `zip`)
- `includeWatermark`: boolean (default: `false`)

**Response**: ZIP archive or combined PDF file

**Status Codes**:
- `200`: Success
- `400`: Invalid request / No documents
- `403`: Insufficient permissions
- `429`: Rate limit exceeded

**Example**:
```javascript
const response = await fetch('/api/documents/bulk-download', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentIds: ['doc-1', 'doc-2', 'doc-3'],
    format: 'zip',
    includeWatermark: true
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'documents.zip';
a.click();
```

---

#### 5. Download History

```
GET /documents/download-history?limit=50&offset=0
GET /documents/history?limit=50&offset=0
```

**Query Parameters**:
- `limit`: Number of records (default: 50, max: 1000)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "history": [
    {
      "recordId": "rec-123",
      "documentId": "doc-456",
      "downloadType": "direct",
      "format": "pdf",
      "timestamp": "2026-05-09T10:30:00Z",
      "accessGranted": true
    }
  ],
  "statistics": {
    "totalDownloads": 42,
    "totalPrints": 15,
    "totalBulkDownloads": 3,
    "totalShares": 8,
    "lastDownloadDate": "2026-05-09T10:30:00Z",
    "mostDownloadedDocumentType": "aadhaar"
  }
}
```

**Status Codes**:
- `200`: Success
- `401`: Authentication required

---

#### 6. Create Share Link

```
POST /documents/create-share-link
POST /documents/share
```

**Body**:
```json
{
  "documentId": "doc-123",
  "expiryMinutes": 60,
  "maxAccess": 5
}
```

**Response**:
```json
{
  "success": true,
  "link": {
    "linkId": "link-123",
    "token": "abc123def456...",
    "expiresAt": "2026-05-09T11:30:00Z",
    "maxAccess": 5,
    "shareUrl": "http://localhost:3000/api/documents/secure-link/link-123?token=abc123def456..."
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `403`: Insufficient permissions
- `404`: Document not found

**Example**:
```javascript
const response = await fetch('/api/documents/create-share-link', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: 'doc-123',
    expiryMinutes: 60,
    maxAccess: 5
  })
});
const data = await response.json();
console.log('Share link:', data.link.shareUrl);
```

---

#### 7. Document Statistics

```
GET /documents/statistics
```

**Response**:
```json
{
  "success": true,
  "userStatistics": {
    "totalDocuments": 10,
    "verifiedDocuments": 9,
    "totalDownloads": 42,
    "totalPrints": 15,
    "totalBulkDownloads": 3,
    "totalShares": 8,
    "lastDownloadDate": "2026-05-09T10:30:00Z"
  },
  "systemStatistics": {
    "totalDocuments": 1000,
    "totalDownloads": 5000,
    "totalPrints": 2000,
    "successfulDownloads": 4950,
    "deniedAttempts": 50
  }
}
```

---

#### 8. Audit Logs (Admin Only)

```
GET /security/audit-logs?limit=100&userId=user-123&offset=0
```

**Query Parameters**:
- `limit`: Number of records (default: 100)
- `offset`: Pagination offset (default: 0)
- `userId`: Filter by user ID (optional)

**Response**:
```json
{
  "success": true,
  "logs": [
    {
      "logId": "log-123",
      "timestamp": "2026-05-09T10:30:00Z",
      "userId": "user-123",
      "action": "document_download",
      "resource": "document",
      "resourceId": "doc-456",
      "status": "success",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": { "format": "pdf", "format": "pdf" }
    }
  ],
  "statistics": {
    "totalUsers": 100,
    "activeUsers": 95,
    "blockedIPs": 2,
    "lastHourAttempts": 150,
    "lastHourFailures": 3
  }
}
```

---

#### 9. Security Statistics (Admin Only)

```
GET /security/statistics
```

**Response**:
```json
{
  "success": true,
  "statistics": {
    "totalUsers": 1000,
    "activeUsers": 850,
    "suspendedUsers": 15,
    "mfaEnabledUsers": 750,
    "totalAuditLogs": 50000,
    "blockedIPs": 5,
    "lastHourAttempts": 500,
    "lastHourFailures": 20
  }
}
```

---

#### 10. Suspend User (Admin Only)

```
POST /security/users/:userId/suspend
```

**Body**:
```json
{
  "reason": "Suspicious activity detected"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User user-123 has been suspended"
}
```

---

#### 11. Block IP (Admin Only)

```
POST /security/ips/:ipAddress/block
```

**Response**:
```json
{
  "success": true,
  "message": "IP 192.168.1.1 has been blocked"
}
```

---

#### 12. Export Logs (Admin Only)

```
GET /security/logs/export?format=json&userId=user-123
```

**Query Parameters**:
- `format`: "json" or "csv" (default: "json")
- `userId`: Filter by user ID (optional)

**Response**: JSON or CSV file attachment

---

#### 13. System Health

```
GET /health
```

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 86400,
  "timestamp": "2026-05-09T10:30:00Z"
}
```

---

## React Components

### DocumentDownloadManager

Main component for managing document downloads, prints, and shares.

**Location**: `src/components/document-download-manager.tsx`

**Props**:

```typescript
interface DownloadManagerProps {
  userId: string;
  documents: Document[];
  onDownload?: (documentId: string) => void;
  onPrint?: (documentId: string) => void;
  compact?: boolean;
}

interface Document {
  documentId: string;
  fileName: string;
  documentType: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'kyc' | 'other';
  format: 'pdf' | 'jpg' | 'png';
  fileSize: number;
  uploadedAt: Date;
  verified: boolean;
  accessLevel: 'public' | 'private' | 'restricted';
}
```

**Features**:
- ✓ Single document download with progress
- ✓ Multi-select bulk download
- ✓ Print with watermark option
- ✓ Create share links
- ✓ Reusable document preview dialog
- ✓ Error/success notifications (Toast)
- ✓ Loading states
- ✓ Mobile responsive

### DocumentViewer

Reusable preview dialog used by the download manager.

**Location**: `src/components/document-viewer.tsx`

**Props**:

```typescript
interface DocumentViewerProps {
  document: DocumentViewerDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (documentId: string) => void;
  onPrint: (documentId: string) => void;
  onShare: (documentId: string) => void;
}
```

**Features**:
- Secure two-panel preview shell
- Document metadata and access-level display
- Download, print, and share actions
- Clear security guidance for protected content

**Example Usage**:

```tsx
import { DocumentDownloadManager } from '@/components/document-download-manager';

export function DocumentPage() {
  const documents = [
    {
      documentId: 'doc-1',
      fileName: 'Aadhaar_12345.pdf',
      documentType: 'aadhaar',
      format: 'pdf',
      fileSize: 2048576,
      uploadedAt: new Date(),
      verified: true,
      accessLevel: 'private'
    }
  ];

  return (
    <DocumentDownloadManager
      userId="user-123"
      documents={documents}
      onDownload={(id) => console.log('Downloaded:', id)}
      onPrint={(id) => console.log('Printed:', id)}
    />
  );
}
```

**Internal Functions**:

- `handleDownloadSingle(documentId)`: Download single document
- `handleBulkDownload()`: Download selected documents as ZIP
- `handlePrint(documentId)`: Open print dialog
- `handleShare(documentId)`: Create temporary share link
- `toggleDocumentSelection(documentId)`: Toggle selection for bulk download
- `copyShareLink()`: Copy share link to clipboard

---

## Usage Examples

### Example 1: Download Single Document

```typescript
async function downloadDocument(documentId: string) {
  try {
    const response = await fetch(`/api/documents/${documentId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.pdf';
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('Document downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
  }
}
```

### Example 2: Create and Share Secure Link

```typescript
async function createShareLink(documentId: string) {
  try {
    const response = await fetch('/api/documents/share', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId,
        expiryMinutes: 60,
        maxAccess: 5
      })
    });

    const data = await response.json();
    const shareUrl = data.link.shareUrl;

    // Share via email, SMS, etc.
    console.log('Share this link:', shareUrl);

  } catch (error) {
    console.error('Error creating share link:', error);
  }
}
```

### Example 3: Print with Watermark

```typescript
async function printDocument(documentId: string) {
  try {
    const response = await fetch('/api/documents/print', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId,
        includeWatermark: true
      })
    });

    const data = await response.json();
    
    // Open print dialog
    const printWindow = window.open();
    printWindow.document.write(data.htmlContent);
    printWindow.document.close();
    printWindow.print();

  } catch (error) {
    console.error('Print error:', error);
  }
}
```

### Example 4: Bulk Download Multiple Documents

```typescript
async function bulkDownload(documentIds: string[]) {
  try {
    const response = await fetch('/api/documents/bulk-download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentIds,
        format: 'pdf-combined',
        includeWatermark: false
      })
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents_${Date.now()}.zip`;
    a.click();

  } catch (error) {
    console.error('Bulk download error:', error);
  }
}
```

### Example 5: Get Download History with Statistics

```typescript
async function getDownloadHistory() {
  try {
    const response = await fetch('/api/documents/download-history?limit=50&offset=0', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    console.log('Download history:', data.history);
    console.log('Statistics:', data.statistics);
    console.log(`Total downloads: ${data.statistics.totalDownloads}`);
    console.log(`Total prints: ${data.statistics.totalPrints}`);
    console.log(`Most downloaded: ${data.statistics.mostDownloadedDocumentType}`);

  } catch (error) {
    console.error('Error retrieving history:', error);
  }
}
```

### Example 6: Admin - View Audit Logs

```typescript
async function viewAuditLogs() {
  try {
    const response = await fetch('/api/security/audit-logs?limit=100&offset=0', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await response.json();

    console.log('Audit logs:', data.logs);
    console.log('Security statistics:', data.statistics);
    console.log(`Active users: ${data.statistics.activeUsers}`);
    console.log(`Blocked IPs: ${data.statistics.blockedIPs}`);

  } catch (error) {
    console.error('Error retrieving audit logs:', error);
  }
}
```

### Example 7: Admin - Block Suspicious IP

```typescript
async function blockSuspiciousIP(ipAddress: string) {
  try {
    const response = await fetch(`/security/ips/${ipAddress}/block`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await response.json();
    console.log(data.message);

  } catch (error) {
    console.error('Error blocking IP:', error);
  }
}
```

---

## Configuration

### Environment Variables

```bash
# PDF Generation
PDF_TEMP_DIR=./temp/pdf
PDF_RETENTION_HOURS=24
PDF_QUALITY=high

# Logging
LOG_DIR=./logs
LOG_RETENTION_DAYS=365

# Rate Limiting
MAX_DOWNLOADS_PER_HOUR=100
MAX_PRINTS_PER_HOUR=50
MAX_BULK_PER_DAY=20
MAX_SHARES_PER_DAY=30

# Security
SUSPICIOUS_ACTIVITY_THRESHOLD=5
LOCKOUT_DURATION_MINUTES=15
IP_RESET_MINUTES=60

# Server
PORT=3000
NODE_ENV=production
```

### Rate Limit Configuration

Modify in `AccessControlService`:

```typescript
const rateLimitConfig: RateLimitConfig = {
  maxDownloadsPerHour: 100,
  maxPrintsPerHour: 50,
  maxBulkDownloadsPerDay: 20,
  maxShareLinksPerDay: 30
};
```

### Watermark Configuration

Modify in `PDFGenerationService`:

```typescript
const watermarkConfig: WatermarkConfig = {
  text: 'VERIFIED COPY',
  opacity: 0.15,      // 15%
  rotation: -45,      // degrees
  fontSize: 48        // pixels
};
```

---

## Audit Logging

### Log Levels

- **debug**: Detailed debugging information
- **info**: General informational messages
- **warn**: Warning messages for potentially problematic situations
- **error**: Error messages for failures
- **critical**: Critical errors requiring immediate attention

### Log Actions

Tracked actions:
- `document_registered`
- `document_downloaded`
- `document_printed`
- `document_shared`
- `bulk_download`
- `access_denied`
- `share_link_created`
- `share_link_verified`
- `user_login`
- `account_suspended`
- `ip_blocked`
- `suspicious_activity`
- And more...

### Log Export

**Export as JSON**:
```javascript
const logs = auditLogger.exportJSON({ userId: 'user-123' });
```

**Export as CSV**:
```javascript
const csv = auditLogger.exportCSV({ userId: 'user-123' });
```

**API Endpoint**:
```bash
GET /security/logs/export?format=json&userId=user-123
```

---

## Troubleshooting

### Problem: Downloads failing with 403 Forbidden

**Solution**: Check user permissions and document access level
```javascript
// Verify permission
const hasPermission = accessControlService.hasPermission(userId, 'download');
// Verify document access
const access = documentService.verifyAccess(documentId, userId, ipAddress, userAgent);
```

### Problem: Share links not working

**Solution**: Check link expiration and access count
```javascript
const link = documentService.getSecureLink(linkId);
if (link.expiresAt < new Date()) {
  // Link expired
}
if (link.downloadsRemaining <= 0) {
  // Max downloads reached
}
```

### Problem: Rate limit errors (429)

**Solution**: Wait before retrying or request higher limits
```javascript
// Current limits
MAX_DOWNLOADS_PER_HOUR=100
MAX_PRINTS_PER_HOUR=50

// Increase in config if needed
```

### Problem: Watermarks not visible

**Solution**: Ensure PDF generation uses configured watermark
```javascript
const options: PDFOptions = {
  includeWatermark: true,
  watermarkText: 'VERIFIED COPY',
  watermarkTimestamp: true
};
```

### Problem: Audit logs growing too large

**Solution**: Adjust retention or cleanup frequency
```typescript
// In AuditLoggerService
private retentionDays: number = 365;

// Manual cleanup
auditLogger.cleanupOldLogs(180); // Keep last 180 days
```

### Problem: Temporary files not cleaning up

**Solution**: Check cleanup scheduler and file permissions
```typescript
// Manual cleanup
pdfGenerationService.cleanupOldFiles(24); // Delete files >24 hours old
```

---

## Integration with Other Modules

### Notification Engine Integration

Notify users when share links are created:

```typescript
import { notificationService } from '@/server/notification-service';

// After creating share link
notificationService.sendNotification(userId, {
  type: 'share_link_created',
  title: 'Document Share Link Created',
  message: `A share link for ${documentName} expires in ${expiryMinutes} minutes`,
  link: shareUrl
});
```

### AI Assistant Integration

Provide AI responses about document status:

```typescript
import { aiAssistant } from '@/server/ai-assistant';

// Get document status from AI
const response = await aiAssistant.query(userId, 'How many documents have I downloaded this month?');
// AI retrieves stats: downloadService.getDownloadStatistics(userId)
```

---

## Performance Optimization

### Caching

Implement Redis caching for frequently accessed data:
```typescript
// Cache share link verification (5 min TTL)
const cacheKey = `share-link-${linkId}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

### Pagination

Always paginate download history:
```javascript
// Good
const history = await getDownloadHistory(userId, 50, 0);

// Avoid
const history = await getDownloadHistory(userId, 10000, 0);
```

### Batch Operations

Batch file operations when possible:
```typescript
// Good - batch cleanup
const expiredLinks = this.secureLinks.entries()
  .filter(([_, link]) => link.expiresAt < now)
  .map(([linkId]) => linkId);
expiredLinks.forEach(linkId => this.secureLinks.delete(linkId));
```

---

## Support & Contact

For issues, questions, or contributions:
- **Email**: support@id-hub.gov.in
- **Documentation**: https://docs.id-hub.gov.in
- **Status Page**: https://status.id-hub.gov.in

---

**End of Documentation**
