# Consistency Checker - Backend Integration Guide

## Overview

This guide provides comprehensive instructions for integrating the frontend Consistency Checker module with backend services for production use.

## Architecture

```
Frontend (React)
    ↓
Consistency Checker Component
    ├── API Client Layer
    ├── Local Calculations (frontend)
    └── History Management (localStorage)
    ↓
Backend API Server (Express.js / Any framework)
    ├── Document Verification Endpoint
    ├── Database Layer
    ├── Cache Layer (Redis)
    ├── Audit Logging
    └── Government Registry Integration
    ↓
External Services
    ├── Government Database (Aadhaar, PAN, etc.)
    ├── Document Verification Services
    └── Machine Learning Models
```

## 1. Backend API Endpoints

### Endpoint: `/api/consistency/check`

**POST** - Perform consistency check

```typescript
interface CheckRequest {
  userId: string;
  documents: {
    documentType: string;
    documentId: string;
    extractedData: {
      name: string;
      dob: string;
      address: string;
      idNumber: string;
    };
  }[];
  options?: {
    saveToHistory?: boolean;
    triggerNotification?: boolean;
    autoCorrect?: boolean;
  };
}

interface CheckResponse {
  checkId: string;
  timestamp: string;
  score: number;
  scores: {
    nameScore: number;
    dobScore: number;
    addressScore: number;
  };
  mismatches: MismatchDetail[];
  suggestions: string[];
  status: "APPROVED" | "REVIEW_REQUIRED" | "FAILED";
  metadata: {
    documentCount: number;
    processingTime: number;
    serverVersion: string;
  };
}
```

**Implementation Example (Express.js):**

```typescript
import express from "express";
import {
  checkNameConsistency,
  checkDOBConsistency,
  checkAddressConsistency,
  generateConsistencySuggestions
} from "../lib/consistency-utils";

const router = express.Router();

router.post("/consistency/check", async (req, res) => {
  try {
    const { userId, documents, options } = req.body;

    // Validate input
    if (!userId || !documents || documents.length < 2) {
      return res.status(400).json({
        error: "At least 2 documents required"
      });
    }

    // Extract data by field
    const names: Record<string, string> = {};
    const dobs: Record<string, string> = {};
    const addresses: Record<string, string> = {};

    documents.forEach(doc => {
      const type = doc.documentType;
      if (doc.extractedData) {
        names[type] = doc.extractedData.name;
        dobs[type] = doc.extractedData.dob;
        addresses[type] = doc.extractedData.address;
      }
    });

    // Perform consistency checks
    const startTime = Date.now();

    const nameCheck = checkNameConsistency(names);
    const dobCheck = checkDOBConsistency(dobs);
    const addressCheck = checkAddressConsistency(addresses);

    const overallScore = Math.round(
      (nameCheck.score + dobCheck.score + addressCheck.score) / 3
    );

    // Detect mismatches
    const mismatches = [];
    if (nameCheck.score < 85) {
      mismatches.push({
        field: "name",
        type: nameCheck.score < 50 ? "critical" : "warning",
        description: "Name inconsistency detected",
        values: names
      });
    }

    if (!dobCheck.consistent) {
      mismatches.push({
        field: "dob",
        type: "critical",
        description: "Date of birth mismatch",
        values: dobs
      });
    }

    if (addressCheck.score < 80) {
      mismatches.push({
        field: "address",
        type: addressCheck.score < 50 ? "critical" : "warning",
        description: "Address inconsistency detected",
        values: addresses
      });
    }

    // Generate suggestions
    const suggestions = generateConsistencySuggestions(mismatches, {
      name: nameCheck.score,
      dob: dobCheck.score,
      address: addressCheck.score,
      overall: overallScore
    });

    const processingTime = Date.now() - startTime;
    const checkId = `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save to database if requested
    if (options?.saveToHistory) {
      await saveCheckToDatabase({
        checkId,
        userId,
        timestamp: new Date(),
        score: overallScore,
        documentCount: documents.length,
        mismatchCount: mismatches.length,
        documentTypes: documents.map(d => d.documentType),
        result: {
          scores: {
            nameScore: nameCheck.score,
            dobScore: dobCheck.score,
            addressScore: addressCheck.score
          },
          mismatches,
          suggestions,
          status: overallScore >= 85 ? "APPROVED" : "REVIEW_REQUIRED"
        }
      });
    }

    // Trigger notification if critical issues
    if (mismatches.some(m => m.type === "critical") && options?.triggerNotification) {
      await notifyUser(userId, {
        type: "CONSISTENCY_CHECK_ALERT",
        message: "Critical issues found in your documents",
        checkId
      });
    }

    return res.json({
      checkId,
      timestamp: new Date().toISOString(),
      score: overallScore,
      scores: {
        nameScore: nameCheck.score,
        dobScore: dobCheck.score,
        addressScore: addressCheck.score
      },
      mismatches,
      suggestions,
      status: overallScore >= 85 ? "APPROVED" : "REVIEW_REQUIRED",
      metadata: {
        documentCount: documents.length,
        processingTime,
        serverVersion: "1.0.0"
      }
    });
  } catch (error) {
    console.error("Consistency check error:", error);
    res.status(500).json({
      error: "Failed to perform consistency check"
    });
  }
});

export default router;
```

### Endpoint: `/api/consistency/history`

**GET** - Retrieve check history for user

```typescript
router.get("/consistency/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const history = await getCheckHistoryFromDatabase(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      userId,
      total: history.total,
      count: history.items.length,
      items: history.items,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: history.total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error("History retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve history" });
  }
});
```

### Endpoint: `/api/consistency/verify-government`

**POST** - Verify against government databases

```typescript
router.post("/consistency/verify-government", async (req, res) => {
  try {
    const { aadhaarNumber, panNumber, documentData } = req.body;

    // Call government verification APIs
    const aadhaarVerification = await verifyWithAadhaarAPI(aadhaarNumber, documentData.name);
    const panVerification = await verifyWithPANAPI(panNumber, documentData);

    const governmentScore = Math.round(
      (aadhaarVerification.match + panVerification.match) / 2
    );

    return res.json({
      governmentScore,
      aadhaarMatch: aadhaarVerification.match,
      panMatch: panVerification.match,
      verified: governmentScore >= 95,
      details: {
        aadhaar: aadhaarVerification.details,
        pan: panVerification.details
      }
    });
  } catch (error) {
    console.error("Government verification error:", error);
    res.status(500).json({ error: "Failed to verify with government" });
  }
});
```

## 2. Frontend API Client

```typescript
// src/lib/consistency-api.ts

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export class ConsistencyCheckerAPI {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  async performCheck(documents, options = {}) {
    return this.request("/api/consistency/check", {
      method: "POST",
      body: { documents, options }
    });
  }

  async getHistory(userId: string, limit = 20, offset = 0) {
    return this.request(`/api/consistency/history/${userId}`, {
      method: "GET",
      params: { limit, offset }
    });
  }

  async verifyWithGovernment(aadhaarNumber, panNumber, documentData) {
    return this.request("/api/consistency/verify-government", {
      method: "POST",
      body: { aadhaarNumber, panNumber, documentData }
    });
  }

  async deleteCheck(checkId: string) {
    return this.request(`/api/consistency/${checkId}`, {
      method: "DELETE"
    });
  }

  async exportReport(checkId: string, format = "pdf") {
    return this.request(`/api/consistency/${checkId}/export`, {
      method: "GET",
      params: { format }
    });
  }

  private async request(endpoint: string, options: any) {
    let lastError;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const url = new URL(endpoint, this.baseUrl);

        if (options.params) {
          Object.entries(options.params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
          });
        }

        const response = await fetch(url.toString(), {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getAuthToken()}`
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < this.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  private getAuthToken() {
    // Retrieve from localStorage or session
    return localStorage.getItem("auth_token") || "";
  }
}

// Usage in component
const api = new ConsistencyCheckerAPI({
  baseUrl: "https://api.bharat-id.com",
  timeout: 30000,
  retries: 3
});

// In React component
async function handleCheckConsistency() {
  try {
    const result = await api.performCheck(selectedDocuments, {
      saveToHistory: true,
      triggerNotification: true
    });
    setResults(result);
  } catch (error) {
    console.error("Check failed:", error);
    showError("Failed to check consistency");
  }
}
```

## 3. Database Schema

```typescript
// Prisma Schema (schema.prisma)

model ConsistencyCheck {
  id                String      @id @default(cuid())
  userId            String
  checkDate         DateTime    @default(now())
  score             Int
  nameScore         Int
  dobScore          Int
  addressScore      Int
  documentCount     Int
  mismatchCount     Int
  documentTypes     String[]
  status            String      // "APPROVED" | "REVIEW_REQUIRED" | "FAILED"
  
  // Detailed results
  mismatches        MismatchDetail[]
  suggestions       String[]
  
  // Metadata
  ipAddress         String?
  userAgent         String?
  processingTime    Int
  
  // Relations
  user              User          @relation(fields: [userId], references: [id])
  documents         Document[]
  auditLog          AuditLog[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([userId])
  @@index([checkDate])
}

model Document {
  id                String      @id @default(cuid())
  checkId           String
  documentType      String      // "AADHAAR" | "PAN" | "PASSPORT" | "DRIVING_LICENSE"
  documentId        String
  name              String
  dob               String
  address           String
  idNumber          String
  
  check             ConsistencyCheck @relation(fields: [checkId], references: [id])
  
  createdAt         DateTime    @default(now())
}

model MismatchDetail {
  id                String      @id @default(cuid())
  checkId           String
  field             String      // "name" | "dob" | "address"
  type              String      // "critical" | "warning" | "info"
  description       String
  values            String[]    // JSON stringified values
  
  check             ConsistencyCheck @relation(fields: [checkId], references: [id])
}

model AuditLog {
  id                String      @id @default(cuid())
  checkId           String
  userId            String
  action            String
  details           String
  
  check             ConsistencyCheck @relation(fields: [checkId], references: [id])
  
  createdAt         DateTime    @default(now())
}
```

## 4. Caching Strategy

```typescript
import Redis from "redis";

class CachingLayer {
  private redis: Redis.RedisClient;

  constructor(redisUrl: string) {
    this.redis = Redis.createClient({ url: redisUrl });
  }

  async getCachedResult(cacheKey: string) {
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  async setCachedResult(cacheKey: string, result: any, ttl = 3600) {
    await this.redis.setex(
      cacheKey,
      ttl,
      JSON.stringify(result)
    );
  }

  generateCacheKey(userId: string, documentIds: string[]): string {
    const sortedIds = documentIds.sort().join("_");
    return `consistency:${userId}:${sortedIds}`;
  }

  async invalidateUserCache(userId: string) {
    const pattern = `consistency:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }
}
```

## 5. Government API Integration

```typescript
// Integration with government databases

class GovernmentVerifier {
  private aadhaarAPI: AadhaarAPIClient;
  private panAPI: PANAPIClient;

  constructor() {
    this.aadhaarAPI = new AadhaarAPIClient({
      apiKey: process.env.AADHAAR_API_KEY,
      baseUrl: process.env.AADHAAR_API_URL
    });

    this.panAPI = new PANAPIClient({
      apiKey: process.env.PAN_API_KEY,
      baseUrl: process.env.PAN_API_URL
    });
  }

  async verifyAadhaar(aadhaarNumber: string, name: string) {
    try {
      const response = await this.aadhaarAPI.verify({
        uid: aadhaarNumber,
        name: name
      });

      return {
        match: response.score || 0,
        verified: response.verified,
        details: {
          name: response.name,
          dob: response.dob,
          address: response.address
        }
      };
    } catch (error) {
      console.error("Aadhaar verification failed:", error);
      throw new Error("Failed to verify with Aadhaar database");
    }
  }

  async verifyPAN(panNumber: string, documentData: any) {
    try {
      const response = await this.panAPI.verify({
        pan: panNumber,
        name: documentData.name,
        dob: documentData.dob
      });

      return {
        match: response.score || 0,
        verified: response.verified,
        details: {
          name: response.name,
          dob: response.dob
        }
      };
    } catch (error) {
      console.error("PAN verification failed:", error);
      throw new Error("Failed to verify with PAN database");
    }
  }
}
```

## 6. Error Handling

```typescript
class ConsistencyCheckError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
  }
}

// Usage
if (documents.length < 2) {
  throw new ConsistencyCheckError(
    "INSUFFICIENT_DOCUMENTS",
    "At least 2 documents required for consistency check",
    400,
    { documentsProvided: documents.length }
  );
}

// Error handler middleware
app.use((error, req, res, next) => {
  if (error instanceof ConsistencyCheckError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details
    });
  }

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  });
});
```

## 7. Environment Configuration

```bash
# .env

# API Configuration
CONSISTENCY_API_BASE_URL=http://localhost:3001
CONSISTENCY_API_TIMEOUT=30000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bharat_id
REDIS_URL=redis://localhost:6379

# Government APIs
AADHAAR_API_KEY=your_aadhaar_key
AADHAAR_API_URL=https://api.aadhaar.gov.in
PAN_API_KEY=your_pan_key
PAN_API_URL=https://api.pan.gov.in

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## 8. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Redis cache configured
- [ ] Government API credentials obtained
- [ ] SSL/TLS certificates installed
- [ ] CORS configured for frontend domain
- [ ] Rate limiting configured
- [ ] Monitoring and logging setup
- [ ] Error tracking (Sentry) configured
- [ ] Database backups configured
- [ ] Load balancing configured
- [ ] CDN configured for static assets
- [ ] Security headers added
- [ ] API documentation generated
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Staging environment validation
- [ ] Production deployment plan

## 9. Monitoring & Logging

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

// Log consistency check
logger.info("Consistency check performed", {
  userId,
  checkId,
  score: overallScore,
  duration: processingTime
});

// Log errors
logger.error("Consistency check failed", {
  userId,
  error: error.message,
  stack: error.stack
});
```

## 10. Performance Optimization

```typescript
// Use database indices
CREATE INDEX idx_consistency_user_date ON consistency_checks(user_id, check_date DESC);
CREATE INDEX idx_consistency_score ON consistency_checks(score DESC);

// Implement pagination for history
const pageSize = 20;
const page = Math.max(1, parseInt(req.query.page));
const offset = (page - 1) * pageSize;

// Use caching for frequently accessed data
const cacheKey = `consistency_history:${userId}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

// Cache results for 1 hour
await cache.set(cacheKey, results, 3600);
```

## Testing the Integration

```bash
# Test API endpoint
curl -X POST http://localhost:3001/api/consistency/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "documents": [{
      "documentType": "aadhaar",
      "documentId": "doc1",
      "extractedData": {
        "name": "Rajesh Kumar",
        "dob": "15/06/1990",
        "address": "123 MG Road",
        "idNumber": "123456789012"
      }
    }]
  }'
```

## Support & Resources

- API Documentation: `./API.md`
- Database Schema: `./DATABASE.md`
- Deployment Guide: `./DEPLOYMENT.md`
