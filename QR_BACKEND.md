# QR Verification System - Backend Integration Guide

## 🔧 Backend Setup

### Prerequisites
- Node.js 18+
- TypeScript
- Express.js
- PostgreSQL or MongoDB (optional)
- Redis (optional, for caching)

### Installation

```bash
# Install required packages
npm install express multer crypto cors helmet

# Optional packages
npm install redis pg mongoose prisma @prisma/client
```

## 🗄️ Database Schema

### PostgreSQL (Recommended)

```sql
-- QR Codes Table
CREATE TABLE qr_codes (
  id VARCHAR(50) PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  document_id VARCHAR(50) NOT NULL,
  document_type VARCHAR(30) NOT NULL,
  owner_id VARCHAR(50) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,
  owner_email VARCHAR(100),
  document_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  issued_at TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- active, expired, revoked
  metadata JSON,
  created_by VARCHAR(50),
  
  INDEX idx_owner (owner_id),
  INDEX idx_document (document_id),
  INDEX idx_expires (expires_at),
  INDEX idx_status (status)
);

-- Verifications Table
CREATE TABLE qr_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  qr_id VARCHAR(50) NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  country VARCHAR(2),
  verification_result VARCHAR(20), -- valid, expired, tampered
  
  FOREIGN KEY (qr_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
  INDEX idx_qr (qr_id),
  INDEX idx_verified_at (verified_at)
);

-- Audit Log Table
CREATE TABLE qr_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(50), -- generate, verify, revoke, etc.
  qr_id VARCHAR(50),
  user_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSON,
  
  INDEX idx_action (action),
  INDEX idx_user (user_id),
  INDEX idx_timestamp (timestamp)
);
```

### Prisma Schema

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model QRCode {
  id            String @id @default(cuid())
  token         String @unique
  documentId    String
  documentType  String
  ownerId       String
  ownerName     String
  ownerEmail    String?
  documentHash  String?
  
  issuedAt      DateTime
  expiresAt     DateTime
  status        String @default("active") // active, expired, revoked
  
  metadata      Json?
  createdBy     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  verifications QRVerification[]
  auditLogs     AuditLog[]
  
  @@index([ownerId])
  @@index([documentId])
  @@index([expiresAt])
}

model QRVerification {
  id                  Int @id @default(autoincrement())
  qrId                String
  verifiedAt          DateTime @default(now())
  ipAddress           String?
  userAgent           String?
  country             String?
  verificationResult  String
  
  qrCode              QRCode @relation(fields: [qrId], references: [id], onDelete: Cascade)
  
  @@index([qrId])
  @@index([verifiedAt])
}

model AuditLog {
  id        Int @id @default(autoincrement())
  action    String
  qrId      String?
  userId    String?
  timestamp DateTime @default(now())
  details   Json?
  
  @@index([action])
  @@index([userId])
}
```

### MongoDB Schema

```javascript
// models/QRCode.js
db.createCollection("qrCodes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["token", "documentId", "ownerId", "expiresAt"],
      properties: {
        _id: { bsonType: "objectId" },
        token: { bsonType: "string" },
        documentId: { bsonType: "string" },
        documentType: { bsonType: "string" },
        ownerId: { bsonType: "string" },
        ownerName: { bsonType: "string" },
        ownerEmail: { bsonType: "string" },
        documentHash: { bsonType: "string" },
        
        issuedAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" },
        status: { enum: ["active", "expired", "revoked"] },
        
        metadata: { bsonType: "object" },
        createdBy: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Create indexes
db.qrCodes.createIndex({ token: 1 }, { unique: true });
db.qrCodes.createIndex({ ownerId: 1 });
db.qrCodes.createIndex({ documentId: 1 });
db.qrCodes.createIndex({ expiresAt: 1 });
```

## 🌐 Express.js Routes

### Basic Setup

```typescript
// src/routes/qr.ts
import express from "express";
import { QRCodeAPI } from "@/server/api-qr";
import { authMiddleware, rateLimitMiddleware } from "@/middleware";

const router = express.Router();

// Apply middleware
router.use(rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 }));
router.use(authMiddleware);

// Routes
router.post("/generate", handleGenerateQR);
router.post("/verify", handleVerifyQR);
router.get("/list", handleListQRCodes);
router.get("/:id", handleGetQRDetails);
router.get("/:id/analytics", handleGetAnalytics);
router.delete("/:id", handleRevokeQR);
router.post("/batch", handleBatchGenerate);

export default router;
```

### Route Handlers

```typescript
// Generate QR Endpoint
async function handleGenerateQR(req: Request, res: Response) {
  try {
    const { documentId, documentType, ownerName, documentHash, expirationDays, metadata } = req.body;
    
    // Validate input
    if (!documentId || !documentType || !ownerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Generate QR
    const response = await QRCodeAPI.generateQR({
      documentId,
      documentType,
      ownerName,
      documentHash,
      expirationDays: expirationDays || 365,
      metadata
    });
    
    if (!response.success) {
      return res.status(400).json({ error: response.error });
    }
    
    // Save to database
    await saveQRToDatabase(response);
    
    // Log action
    await logAuditAction("generate", response.qrId, req.user.id, {
      documentId,
      documentType
    });
    
    res.json(response);
  } catch (error) {
    logger.error("Generate QR failed:", error);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
}

// Verify QR Endpoint
async function handleVerifyQR(req: Request, res: Response) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }
    
    // Check rate limit
    const ipAddress = req.ip;
    if (await isRateLimited(ipAddress)) {
      return res.status(429).json({ error: "Too many verification attempts" });
    }
    
    // Verify token
    const result = await QRCodeAPI.verifyQR({ token });
    
    // Record verification
    if (result.valid || result.expired) {
      const qrId = await getQRIdFromToken(token);
      await recordVerification(qrId, {
        ipAddress,
        userAgent: req.headers["user-agent"],
        country: await getCountryFromIP(ipAddress),
        result: result.valid ? "valid" : "expired"
      });
    }
    
    // Detect tampering
    if (result.tampered) {
      await logSecurityAlert("Tampering detected", token, ipAddress);
    }
    
    res.json(result);
  } catch (error) {
    logger.error("Verify QR failed:", error);
    res.status(500).json({ error: "Verification failed" });
  }
}

// List QR Codes Endpoint
async function handleListQRCodes(req: Request, res: Response) {
  try {
    const { skip = 0, limit = 20, status = "active" } = req.query;
    const userId = req.user.id;
    
    const qrCodes = await QRCode.find({
      ownerId: userId,
      status
    })
      .skip(parseInt(skip as string))
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });
    
    const total = await QRCode.countDocuments({
      ownerId: userId,
      status
    });
    
    res.json({
      qrCodes,
      total,
      skip,
      limit,
      hasMore: skip + limit < total
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to list QR codes" });
  }
}

// Get Analytics Endpoint
async function handleGetAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get verification count
    const verificationCount = await QRVerification.countDocuments({ qrId: id });
    
    // Get last verification
    const lastVerification = await QRVerification.findOne({ qrId: id })
      .sort({ verifiedAt: -1 });
    
    // Get verification breakdown
    const breakdown = await QRVerification.aggregate([
      { $match: { qrId: id } },
      { $group: {
          _id: "$verificationResult",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      qrId: id,
      totalVerifications: verificationCount,
      lastVerification: lastVerification?.verifiedAt,
      breakdown: breakdown,
      topCountries: await getTopCountries(id)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get analytics" });
  }
}

// Revoke QR Endpoint
async function handleRevokeQR(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check ownership
    const qrCode = await QRCode.findById(id);
    if (!qrCode || qrCode.ownerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    // Revoke
    await QRCode.updateOne({ _id: id }, { status: "revoked" });
    
    // Log action
    await logAuditAction("revoke", id, userId);
    
    res.json({ message: "QR code revoked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to revoke QR code" });
  }
}
```

## 🔌 Middleware

### Authentication

```typescript
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per window
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests" });
  }
});
```

### Error Handling

```typescript
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error("Error:", err);
  
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed" });
  }
  
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  res.status(500).json({ error: "Internal server error" });
});
```

## 💾 Database Operations

### Prisma Operations

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create QR Code
async function createQRCode(data: any) {
  return prisma.qRCode.create({
    data: {
      id: data.qrId,
      token: data.token,
      documentId: data.documentId,
      documentType: data.documentType,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      issuedAt: new Date(data.issuedAt),
      expiresAt: new Date(data.expiresAt),
      metadata: data.metadata
    }
  });
}

// Get QR Code
async function getQRCode(token: string) {
  return prisma.qRCode.findUnique({
    where: { token }
  });
}

// Update QR Status
async function updateQRStatus(id: string, status: string) {
  return prisma.qRCode.update({
    where: { id },
    data: { status }
  });
}

// Record Verification
async function recordVerification(qrId: string, verification: any) {
  return prisma.qRVerification.create({
    data: {
      qrId,
      ipAddress: verification.ipAddress,
      userAgent: verification.userAgent,
      country: verification.country,
      verificationResult: verification.result
    }
  });
}
```

### MongoDB Operations

```typescript
import { QRCode, QRVerification } from "@/models";

async function createQRCode(data: any) {
  return QRCode.create({
    token: data.token,
    documentId: data.documentId,
    ownerId: data.ownerId,
    issuedAt: new Date(data.issuedAt),
    expiresAt: new Date(data.expiresAt),
    metadata: data.metadata
  });
}

async function getQRCode(token: string) {
  return QRCode.findOne({ token });
}

async function recordVerification(qrId: string, verification: any) {
  return QRVerification.create({
    qrId,
    verifiedAt: new Date(),
    ipAddress: verification.ipAddress,
    userAgent: verification.userAgent,
    verificationResult: verification.result
  });
}
```

## 📊 Caching with Redis

```typescript
import Redis from "redis";

const redis = Redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379")
});

async function cacheQRCode(token: string, data: any) {
  await redis.setex(`qr:${token}`, 3600, JSON.stringify(data)); // Cache for 1 hour
}

async function getCachedQRCode(token: string) {
  const cached = await redis.get(`qr:${token}`);
  return cached ? JSON.parse(cached) : null;
}

async function invalidateQRCache(token: string) {
  await redis.del(`qr:${token}`);
}
```

## 📈 Monitoring & Logging

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

// Log QR generation
logger.info("QR Code Generated", {
  qrId,
  documentType,
  ownerId,
  expiresAt
});

// Log verification
logger.info("QR Verification", {
  qrId,
  result: "valid",
  ipAddress,
  timestamp
});

// Alert on tampering
logger.error("Tampering Detected", {
  token: hashedToken,
  ipAddress,
  timestamp
});
```

## 🚀 Deployment

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/qr_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
QR_SECRET_KEY=your_qr_secret_key
LOG_LEVEL=info
NODE_ENV=production
```

### Docker Setup

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/qr_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: qr_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## ✅ Testing

```bash
# Test generate endpoint
curl -X POST http://localhost:3000/api/qr/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentId": "doc_123",
    "documentType": "aadhaar",
    "ownerName": "Test User",
    "documentHash": "abc123"
  }'

# Test verify endpoint
curl -X POST http://localhost:3000/api/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN"}'

# Test analytics endpoint
curl -X GET http://localhost:3000/api/qr/:id/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Version**: 1.0.0
**Last Updated**: May 2024
**Status**: Production Ready ✅
