# Integration Guide - Document Upload API

## Quick Start

This guide helps you integrate the document upload system with your backend.

## Frontend to Backend Integration

### Option 1: Express.js Backend (Recommended)

#### Step 1: Install Dependencies

```bash
npm install express multer sharp tesseract.js dotenv cors
```

#### Step 2: Create API Server

```typescript
// api/server.ts
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import documentRoutes from './routes/documents';

const app = express();

app.use(cors());
app.use(express.json());
app.use(multer({ dest: 'uploads/' }).single('file'));

app.use('/api/documents', documentRoutes);

app.listen(3001, () => console.log('API running on port 3001'));
```

#### Step 3: Update Frontend API Calls

In `src/routes/upload.tsx`, replace the mock implementation:

```typescript
const uploadDocument = async (file: File) => {
  const docId = `doc_${Date.now()}`;
  const newDoc: UploadedDocument = {
    id: docId,
    filename: file.name,
    status: "processing",
    progress: 0,
  };

  addDocument(newDoc);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:3001/api/documents/upload", {
      method: "POST",
      body: formData,
      headers: {
        "x-user-id": getUserId(), // From your auth context
      },
    });

    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: "success",
              progress: 100,
              extractedData: data.extractedData,
            }
          : doc
      )
    );
  } catch (error) {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              status: "error",
              error: error instanceof Error ? error.message : "Upload failed",
            }
          : doc
      )
    );
  }
};
```

### Option 2: Cloudflare Workers

```typescript
// api/documents.ts (Cloudflare Worker)
export default {
  async fetch(request: Request, env: Env) {
    if (request.method === "POST" && request.url.includes("/upload")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const userId = request.headers.get("x-user-id");

      // Store in Cloudflare R2 (Object Storage)
      const bucket = env.DOCUMENTS_BUCKET;
      const key = `${userId}/${Date.now()}-${file.name}`;

      await bucket.put(key, await file.arrayBuffer());

      // Extract with Cloudflare AI
      const extracted = await extractWithAI(file, env);

      return new Response(JSON.stringify(extracted), {
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
```

### Option 3: Supabase Backend

```typescript
// api/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(URL, KEY);

export async function uploadDocument(file: File, userId: string) {
  // Upload to storage
  const { data, error } = await supabase.storage
    .from("documents")
    .upload(`${userId}/${Date.now()}-${file.name}`, file);

  if (error) throw error;

  // Extract with edge function
  const { data: extracted } = await supabase.functions.invoke("extract-ocr", {
    body: { filePath: data.path, userId },
  });

  return extracted;
}
```

## Database Integration

### PostgreSQL with Prisma

```typescript
// api/db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function saveDocument(
  userId: string,
  filename: string,
  extractedData: any
) {
  return prisma.document.create({
    data: {
      userId,
      filename,
      extractedData: {
        create: extractedData,
      },
      status: "verified",
    },
  });
}

export async function getDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    include: { extractedData: true },
    orderBy: { uploadedAt: "desc" },
  });
}
```

### MongoDB with Mongoose

```typescript
// api/db.ts
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  userId: String,
  filename: String,
  extractedData: {
    name: String,
    dob: String,
    address: String,
    idNumber: String,
    documentType: String,
  },
  uploadedAt: { type: Date, default: Date.now },
});

const Document = mongoose.model("Document", documentSchema);

export async function saveDocument(userId: string, data: any) {
  return Document.create({ userId, ...data });
}

export async function getDocuments(userId: string) {
  return Document.find({ userId }).sort({ uploadedAt: -1 });
}
```

## Authentication Integration

### JWT Authentication

```typescript
// middleware/auth.ts
import jwt from "jsonwebtoken";

export function verifyAuth(req: Request): string | null {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return (decoded as any).userId;
  } catch {
    return null;
  }
}

// In API route
router.post("/upload", async (req, res) => {
  const userId = verifyAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  // ... rest of handler
});
```

### OAuth2 (Google, GitHub)

```typescript
// middleware/oauth.ts
import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3001/auth/callback"
);

export async function exchangeCodeForToken(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getUserId(accessToken: string) {
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  return userInfo.data.id;
}
```

## Environment Variables

Create `.env` file:

```env
# API Configuration
API_PORT=3001
API_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bharat_id

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key

# Virus Scanning
VIRUSTOTAL_API_KEY=your-api-key

# OCR
OCR_ENGINE=tesseract

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Error Handling

```typescript
// api/errors.ts
export class UploadError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const errorHandler = (error: any, res: any) => {
  if (error instanceof UploadError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
  }

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
```

## Performance Optimization

```typescript
// middleware/cache.ts
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600 });

export async function getCachedDocuments(userId: string) {
  const cacheKey = `documents_${userId}`;
  const cached = cache.get(cacheKey);

  if (cached) return cached;

  const documents = await getDocuments(userId);
  cache.set(cacheKey, documents);
  return documents;
}

// Clear cache on update
export async function invalidateCache(userId: string) {
  cache.del(`documents_${userId}`);
}
```

## Testing

```typescript
// __tests__/upload.test.ts
import request from "supertest";
import app from "../app";

describe("Document Upload", () => {
  it("should upload and extract document", async () => {
    const response = await request(app)
      .post("/api/documents/upload")
      .set("x-user-id", "test-user")
      .attach("file", "test-files/aadhaar.pdf");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("documentId");
    expect(response.body).toHaveProperty("extractedData");
    expect(response.body.extractedData).toHaveProperty("name");
  });
});
```

## Deployment Checklist

- [ ] Set up database (PostgreSQL/MongoDB)
- [ ] Configure environment variables
- [ ] Set up file storage (local or cloud)
- [ ] Install OCR dependencies (Tesseract)
- [ ] Configure virus scanning (ClamAV or API)
- [ ] Set up encryption keys (AWS KMS or Vault)
- [ ] Configure CORS for frontend
- [ ] Set up authentication (JWT/OAuth2)
- [ ] Add rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure backups
- [ ] Test end-to-end flow
- [ ] Deploy to production

## Monitoring

```typescript
// monitoring/metrics.ts
import prom from "prom-client";

export const uploadCounter = new prom.Counter({
  name: "documents_uploaded_total",
  help: "Total documents uploaded",
  labelNames: ["status", "documentType"],
});

export const extractionDuration = new prom.Histogram({
  name: "ocr_extraction_duration_seconds",
  help: "Time taken for OCR extraction",
  buckets: [0.1, 0.5, 1, 5],
});

// Use in handler
const timer = extractionDuration.startTimer();
const extracted = await extractFromDocument(file);
timer();
```

## Support Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
