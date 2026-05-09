# Document Upload System - Backend Setup Guide

## Overview

This document upload system with OCR extraction includes:

- **Frontend**: React component with drag-and-drop UI (`src/routes/upload.tsx`)
- **OCR Engine**: Automated document type detection and field extraction (`src/server/ocr.ts`)
- **File Encryption**: AES-256-CBC encryption for secure storage (`src/server/encryption.ts`)
- **Database**: Dexie.js (IndexedDB) for client-side and server-side database (`src/server/database.ts`)
- **API Routes**: Express.js endpoints for document handling (`src/server/routes/documents.ts`)
- **Mock API**: Development implementation with in-memory storage (`src/server/api-mock.ts`)

## Frontend Features

### Upload Component (`src/routes/upload.tsx`)
- **Drag-and-drop UI**: Drop files or click to upload
- **File validation**: PDF, JPG, PNG only (max 10MB)
- **Processing progress**: Visual feedback during upload
- **Editable preview**: Review and edit extracted data
- **Status indicators**: Verified, Processing, Error states
- **Security info panel**: Shows encryption and security features

### Supported Document Types
- Aadhaar
- PAN
- Passport
- Driving License
- Voter ID

### Extracted Fields
- Name
- Date of Birth (DOB)
- Address
- ID Number
- Document Type (auto-detected)

## Backend Setup

### Installation

```bash
# Install dependencies
npm install express multer sharp tesseract.js crypto-js dexie

# Optional: For database (PostgreSQL/MongoDB)
npm install prisma mongoose
npm install --save-dev @prisma/client
```

### Environment Variables

Create a `.env` file:

```env
# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bharat_id
# or for MongoDB
MONGODB_URI=mongodb://username:password@host:27017/bharat_id

# Storage
UPLOAD_DIR=./uploads
ENCRYPTED_DIR=./uploads/encrypted

# Security
ENABLE_VIRUS_SCAN=true
VIRUS_SCAN_API_KEY=your-api-key

# OCR
OCR_ENGINE=tesseract
TESSERACT_PATH=/usr/share/tesseract-ocr
```

### Configuration

#### 1. Express Server Setup

```typescript
import express from 'express';
import documentRoutes from './routes/documents';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/documents', documentRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 2. Database Setup

**PostgreSQL with Prisma:**

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Document {
  id            String   @id @default(uuid())
  userId        String
  filename      String
  fileHash      String   @unique
  encryptedPath String
  uploadedAt    DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  extractedData ExtractedData?
  status        String   @default("verified") // verified, pending, failed
  virusScanResult Boolean?
  notes         String?

  @@index([userId])
  @@index([createdAt])
}

model ExtractedData {
  id            String   @id @default(uuid())
  documentId    String   @unique
  document      Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  name          String
  dob           String
  address       String
  idNumber      String
  documentType  String
}
```

**MongoDB with Mongoose:**

```typescript
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  filename: String,
  fileHash: { type: String, unique: true },
  encryptedPath: String,
  uploadedAt: { type: Date, default: Date.now },
  extractedData: {
    name: String,
    dob: String,
    address: String,
    idNumber: String,
    documentType: String,
  },
  status: { type: String, default: 'verified' },
  virusScanResult: Boolean,
  notes: String,
});

export const Document = mongoose.model('Document', documentSchema);
```

#### 3. OCR Configuration

**Tesseract Setup:**

```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

**Alternative: Cloud OCR Services**

```typescript
// Google Cloud Vision
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();
const result = await client.textDetection(imagePath);

// AWS Textract
import AWS from 'aws-sdk';
const textract = new AWS.Textract();
const result = await textract.analyzeDocument({
  Document: { Bytes: imageBuffer }
}).promise();

// Azure Computer Vision
import { ComputerVisionClient } from "@azure/cognitiveservices-vision-computervision";
const client = new ComputerVisionClient(endpoint, key);
const result = await client.recognizePrintedTextInStream(true, imageStream);
```

#### 4. Virus Scanning

**ClamAV Setup:**

```bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon

# Start daemon
sudo systemctl start clamav-daemon

# Update virus definitions
sudo freshclam
```

**Implement in Node.js:**

```typescript
import NodeClam from 'clamscan';

const clamscan = await new NodeClam().init({
  clamdscan: {
    host: 'localhost',
    port: 3310,
  },
});

const { isInfected, viruses } = await clamscan.scanFile(filePath);
```

**Alternative: VirusTotal API**

```typescript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function scanWithVirusTotal(filePath: string) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post(
    'https://www.virustotal.com/api/v3/files',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'x-apikey': process.env.VIRUSTOTAL_API_KEY,
      },
    }
  );

  return response.data;
}
```

#### 5. File Encryption/Decryption

```typescript
// For production, use industry-standard libraries
import crypto from 'crypto';
import { SecretKey, XChaCha20Poly1305, randombytes } from 'libsodium.js';

// Or use TweetNaCl
import nacl from 'tweetnacl';

function encryptFile(filePath: string, key: Buffer): Buffer {
  const nonce = randombytes(24);
  const cipher = new XChaCha20Poly1305(key);
  const fileContent = fs.readFileSync(filePath);
  const encrypted = cipher.encrypt(nonce, fileContent);
  return Buffer.concat([nonce, encrypted]);
}

function decryptFile(encrypted: Buffer, key: Buffer): Buffer {
  const nonce = encrypted.slice(0, 24);
  const ciphertext = encrypted.slice(24);
  const decipher = new XChaCha20Poly1305(key);
  return decipher.decrypt(nonce, ciphertext);
}
```

## API Endpoints

### POST `/api/documents/upload`
Upload and process a document

**Request:**
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@document.pdf" \
  -H "x-user-id: user123"
```

**Response:**
```json
{
  "documentId": "doc_1234567890",
  "filename": "aadhaar.pdf",
  "extractedData": {
    "name": "Rajesh Kumar",
    "dob": "15/06/1990",
    "address": "123, MG Road, Bangalore",
    "idNumber": "1234 5678 9012",
    "documentType": "Aadhaar"
  }
}
```

### PATCH `/api/documents/:id`
Update extracted fields

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/documents/doc_1234567890 \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"name": "Rajesh Kumar Singh", "dob": "15/06/1990"}'
```

### POST `/api/documents/:id/save-to-vault`
Save document to vault

**Request:**
```bash
curl -X POST http://localhost:3000/api/documents/doc_1234567890/save-to-vault \
  -H "x-user-id: user123"
```

### GET `/api/documents`
List all documents for user

**Request:**
```bash
curl http://localhost:3000/api/documents \
  -H "x-user-id: user123"
```

### DELETE `/api/documents/:id`
Delete a document

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/documents/doc_1234567890 \
  -H "x-user-id: user123"
```

## Security Best Practices

1. **File Encryption**
   - Always encrypt files before storage
   - Use AES-256 or XChaCha20-Poly1305
   - Store encryption key securely (AWS KMS, HashiCorp Vault)

2. **Access Control**
   - Implement user authentication (JWT, OAuth2)
   - Verify user ID in requests
   - Add rate limiting

3. **Virus Scanning**
   - Scan all uploads immediately
   - Quarantine suspicious files
   - Maintain updated virus definitions

4. **Data Validation**
   - Validate file types server-side
   - Sanitize extracted text
   - Implement CAPTCHAs if needed

5. **Audit Logging**
   - Log all document uploads/downloads
   - Track field modifications
   - Monitor access patterns

6. **Compliance**
   - GDPR: Right to be forgotten
   - HIPAA: Secure health data (if applicable)
   - PII: Protect personally identifiable information
   - Data retention policies

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "server"]
```

```bash
docker build -t bharat-id-api .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e ENCRYPTION_KEY="..." \
  bharat-id-api
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bharat-id-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bharat-id-api
  template:
    metadata:
      labels:
        app: bharat-id-api
    spec:
      containers:
      - name: api
        image: bharat-id-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bharat-id-secrets
              key: database-url
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: bharat-id-secrets
              key: encryption-key
```

## Monitoring & Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Log document uploads
logger.info('Document uploaded', {
  documentId,
  userId,
  filename,
  documentType,
  timestamp: new Date(),
});
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Load testing
npm run test:load
```

## Troubleshooting

### OCR Not Extracting Correctly
- Check image quality (min 150 DPI)
- Try preprocessing: contrast adjustment, deskew
- Use language-specific Tesseract models

### File Encryption Issues
- Verify encryption key format (32 bytes for AES-256)
- Check file permissions on encrypted storage
- Ensure key is properly loaded from environment

### Virus Scan Failures
- Update ClamAV definitions: `sudo freshclam`
- Check ClamAV daemon status
- Review virus definition cache

## Support & Documentation

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [Express.js](https://expressjs.com/)
- [Multer](https://github.com/expressjs/multer)
- [Crypto Documentation](https://nodejs.org/api/crypto.html)
