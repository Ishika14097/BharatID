# Print & Download Module - Quick Start Guide

**Get up and running with document downloads, prints, and secure sharing in 15 minutes.**

---

## Installation

### 1. Install Dependencies

```bash
npm install express archiver cors dotenv
```

### 2. Set Up Environment

Create `.env` file:

```bash
PORT=3000
NODE_ENV=production

# PDF Configuration
PDF_TEMP_DIR=./temp/pdf
PDF_RETENTION_HOURS=24

# Logging
LOG_DIR=./logs
LOG_RETENTION_DAYS=365

# Security
MAX_DOWNLOADS_PER_HOUR=100
MAX_PRINTS_PER_HOUR=50
MAX_BULK_DOWNLOADS_PER_DAY=20
MAX_SHARE_LINKS_PER_DAY=30
```

### 3. Create Required Directories

```bash
mkdir -p temp/pdf
mkdir -p logs
mkdir -p temp/bulk
```

---

## Basic Setup

### 1. Initialize Services

```typescript
// In your main server file
import { documentService } from '@/server/document-service';
import { pdfGenerationService } from '@/server/pdf-generation-service';
import { accessControlService } from '@/server/access-control-service';
import { auditLogger } from '@/server/audit-logger';

// Services are automatically initialized as singletons
```

### 2. Register API Routes

```typescript
import express from 'express';
import routes from '@/server/routes';

const app = express();

app.use(express.json());
app.use('/api', routes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 3. Register Users

```typescript
import { accessControlService } from '@/server/access-control-service';

// Create user profile
accessControlService.createUserProfile(
  'user-123',
  'user',
  ['download', 'print', 'share', 'bulk_download', 'view_history']
);
```

### 4. Register Documents

```typescript
import { documentService } from '@/server/document-service';

// Register a document
const doc = documentService.registerDocument(
  'user-123',                    // userId
  'aadhaar_card.pdf',           // fileName
  'aadhaar',                    // documentType
  2048576,                      // fileSize (2MB)
  'pdf',                        // format
  'application/pdf',            // mimeType
  '/path/to/aadhaar_card.pdf', // localPath
  true,                         // verified
  'private'                     // accessLevel
);

console.log('Document registered:', doc.documentId);
```

---

## Common Tasks

### Task 1: Allow User to Download Document

```typescript
// Frontend
const response = await fetch('/api/documents/download', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ documentId: 'doc-123' })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'document.pdf';
a.click();
```

### Task 2: Create Shareable Link

```typescript
// Backend API call
const response = await fetch('/api/documents/share', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentId: 'doc-123',
    expiryMinutes: 24 * 60,  // 24 hours
    maxAccess: 10              // 10 downloads
  })
});

const { link } = await response.json();
console.log('Share this:', link.shareUrl);

// Share user can use this link without login
```

### Task 3: Print with Watermark

```typescript
// Frontend
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

const { htmlContent } = await response.json();

// Open in new window and print
const printWindow = window.open();
printWindow.document.write(htmlContent);
printWindow.print();
```

### Task 4: Download Multiple Documents

```typescript
// Frontend
const response = await fetch('/api/documents/bulk-download', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentIds: ['doc-1', 'doc-2', 'doc-3'],
        format: 'pdf-combined',
    includeWatermark: false
  })
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'documents.zip';
a.click();
```

### Task 5: View Download History

```typescript
// Frontend
const response = await fetch('/api/documents/download-history?limit=50', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { history, statistics } = await response.json();

console.log('Downloads this month:', statistics.totalDownloads);
console.log('Recent downloads:', history);
```

---

## React Component Usage

### Basic Implementation

```tsx
'use client';

import { useState } from 'react';
import { DocumentDownloadManager } from '@/components/document-download-manager';

export function MyDocumentsPage() {
  const [documents, setDocuments] = useState([
    {
      documentId: 'doc-1',
      fileName: 'Aadhaar_12345.pdf',
      documentType: 'aadhaar',
      format: 'pdf',
      fileSize: 2048576,
      uploadedAt: new Date(),
      verified: true,
      accessLevel: 'private'
    },
    {
      documentId: 'doc-2',
      fileName: 'PAN_67890.pdf',
      documentType: 'pan',
      format: 'pdf',
      fileSize: 1024768,
      uploadedAt: new Date('2026-05-01'),
      verified: true,
      accessLevel: 'private'
    }
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Documents</h1>
      
      <DocumentDownloadManager
        userId="user-123"
        documents={documents}
        onDownload={(docId) => console.log('Downloaded:', docId)}
        onPrint={(docId) => console.log('Printed:', docId)}
      />
    </div>
  );
}
```

---

## Admin Operations

### View Security Statistics

```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:3000/api/security/statistics
```

### Block Suspicious IP

```bash
curl -X POST \
  -H "Authorization: Bearer admin-token" \
  http://localhost:3000/api/security/ips/192.168.1.100/block
```

### View Audit Logs

```bash
curl -H "Authorization: Bearer admin-token" \
  "http://localhost:3000/api/security/audit-logs?limit=100"
```

### Export Audit Logs as CSV

```bash
curl -H "Authorization: Bearer admin-token" \
  "http://localhost:3000/api/security/logs/export?format=csv" \
  > audit-logs.csv
```

### Suspend User

```bash
curl -X POST \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Suspicious activity"}' \
  http://localhost:3000/api/security/users/user-123/suspend
```

---

## Monitoring

### Check System Health

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 86400,
  "timestamp": "2026-05-09T10:30:00Z"
}
```

### Get System Health Details

```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:3000/api/security/health
```

Response:
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "errorRate": 0.5,
    "uptime": 86400,
    "totalLogs": 5000,
    "recentErrors": 25,
    "recentWarnings": 10
  }
}
```

---

## Troubleshooting

### Issue: File not found errors

**Solution**: Verify file paths in environment variables and document registration

```bash
# Check temp directories exist
ls -la temp/pdf
ls -la logs
ls -la temp/bulk

# Create if missing
mkdir -p temp/pdf logs temp/bulk
```

### Issue: Download fails with 403

**Solution**: Check user permissions

```javascript
// Verify user has download permission
const hasPermission = accessControlService.hasPermission('user-123', 'download');
console.log('Has download permission:', hasPermission);

// Verify document access
const access = documentService.verifyAccess('doc-123', 'user-123', '127.0.0.1', 'Mozilla...');
console.log('Access:', access);
```

### Issue: Rate limit errors

**Solution**: Increase limits or wait before retrying

```bash
# Check current limits in .env
MAX_DOWNLOADS_PER_HOUR=100

# Increase if needed
MAX_DOWNLOADS_PER_HOUR=200
```

### Issue: Share links not working

**Solution**: Verify link hasn't expired

```javascript
const link = documentService.getSecureLink(linkId);
console.log('Expires at:', link.expiresAt);
console.log('Downloads remaining:', link.downloadsRemaining);
```

---

## Best Practices

### 1. Always Verify Permissions

```javascript
// Before processing any download/print
if (!accessControlService.hasPermission(userId, 'download')) {
  throw new Error('User lacks download permission');
}
```

### 2. Use Share Links for Guests

```javascript
// Instead of giving direct access
const link = documentService.createSecureLink(documentId, userId, 60, 5);
// Share with guest: link.shareUrl
```

### 3. Enable Watermarks for Sensitive Docs

```javascript
// Always watermark sensitive documents
const doc = documentService.registerDocument(..., true, 'private');
const pdfPath = await pdfGenerationService.generatePDF(filePath, name, {
  includeWatermark: true
});
```

### 4. Monitor Audit Logs Regularly

```bash
# Daily audit log check
0 0 * * * curl -H "Authorization: Bearer admin-token" \
  "http://localhost:3000/api/security/logs/export?format=csv" > audit-$(date +%Y%m%d).csv
```

### 5. Clean Up Old Files

```javascript
// Automatic (hourly) but can manual trigger
pdfGenerationService.cleanupOldFiles(24);
auditLogger.cleanupOldLogs(365);
```

---

## API Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/documents/download` | Download document by body |
| GET | `/documents/:id/download` | Download document |
| GET | `/documents/:id/preview` | Preview in browser |
| GET | `/documents/preview/:documentId` | Preview alias |
| POST | `/documents/print` | Prepare for printing |
| POST | `/documents/bulk-download` | Download multiple |
| GET | `/documents/download-history` | View history |
| GET | `/documents/history` | History alias |
| POST | `/documents/create-share-link` | Create share link |
| POST | `/documents/share` | Share alias |
| GET | `/documents/secure-link/:linkId` | Access secure share |
| GET | `/documents/statistics` | Get stats |
| GET | `/security/audit-logs` | View audit logs (admin) |
| GET | `/security/statistics` | Security stats (admin) |
| POST | `/security/users/:id/suspend` | Suspend user (admin) |
| POST | `/security/ips/:ip/block` | Block IP (admin) |
| GET | `/health` | System status |

---

## Next Steps

1. **Customize watermark**: Edit `pdfGenerationService.ts`
2. **Adjust rate limits**: Update `rateLimitConfig` in `accessControlService.ts`
3. **Configure retention**: Set `retentionDays` in `auditLogger.ts`
4. **Style components**: Customize React components with your brand colors
5. **Add email notifications**: Integrate with notification service for share links

---

**Happy documenting! 📄✨**
