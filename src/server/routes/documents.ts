import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
import { extractFromDocumentPlaceholder } from "./ocr";
import { encryptFile, hashFile } from "./encryption";
import { serverDocumentRepository } from "./database";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "temp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Virus scan placeholder (simulated)
async function virusScan(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate virus scan delay (800ms)
    setTimeout(() => {
      // In production, integrate with ClamAV, VirusTotal, or similar service
      resolve(true); // true = safe, false = threat detected
    }, 800);
  });
}

// Convert PDF to image if needed
async function convertPdfToImage(
  pdfPath: string
): Promise<string | null> {
  try {
    // For demo, we'll just return the PDF path
    // In production, use pdf2image or similar library
    return pdfPath;
  } catch (error) {
    console.error("PDF conversion failed:", error);
    return null;
  }
}

// Process image for OCR (resize, optimize)
async function processImageForOCR(imagePath: string): Promise<string> {
  const processedPath = imagePath.replace(".tmp", ".processed.png");

  try {
    // Optimize image for better OCR results
    await sharp(imagePath)
      .resize(1920, 1440, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .sharpen()
      .normalize()
      .png()
      .toFile(processedPath);

    return processedPath;
  } catch (error) {
    console.error("Image processing failed:", error);
    return imagePath; // Fallback to original
  }
}

// POST /api/documents/upload
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.headers["x-user-id"] as string || "demo-user";
    const filePath = req.file.path;

    // Step 1: Virus scan
    const isSafe = await virusScan(filePath);
    if (!isSafe) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "File failed virus scan" });
    }

    // Step 2: Calculate file hash
    const fileHash = hashFile(filePath);

    // Step 3: Check if document already exists
    const existingDocs = serverDocumentRepository.getDocumentsByUser(userId);
    if (existingDocs.some((doc) => doc.fileHash === fileHash)) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ error: "This document has already been uploaded" });
    }

    // Step 4: Process image for OCR
    let processedPath = filePath;
    if (req.file.mimetype.startsWith("image/")) {
      processedPath = await processImageForOCR(filePath);
    } else if (req.file.mimetype === "application/pdf") {
      // Convert PDF to image
      const imagePath = await convertPdfToImage(filePath);
      if (imagePath) {
        processedPath = imagePath;
      }
    }

    // Step 5: Extract data using OCR
    const extractedData = extractFromDocumentPlaceholder(req.file.originalname);

    // Step 6: Encrypt file
    const encryptedDir = path.join(
      process.cwd(),
      "uploads",
      "encrypted",
      userId
    );
    if (!fs.existsSync(encryptedDir)) {
      fs.mkdirSync(encryptedDir, { recursive: true });
    }

    const encryptedFilename = crypto.randomBytes(16).toString("hex") + ".enc";
    const encryptedPath = path.join(encryptedDir, encryptedFilename);
    encryptFile(filePath, encryptedPath);

    // Step 7: Save to database
    const docId = serverDocumentRepository.addDocument({
      userId,
      filename: req.file.originalname,
      fileHash,
      encryptedPath,
      uploadedAt: new Date(),
      extractedData,
      status: "verified",
      virusScanResult: isSafe,
    });

    // Step 8: Cleanup temp files
    fs.unlinkSync(filePath);
    if (processedPath !== filePath && fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
    }

    res.json({
      documentId: docId,
      filename: req.file.originalname,
      extractedData,
      message: "Document uploaded and processed successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : "Upload failed" });
  }
});

// PATCH /api/documents/:id
router.patch("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user";

    const doc = serverDocumentRepository.getDocument(id);
    if (!doc || doc.userId !== userId) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update extracted data fields
    serverDocumentRepository.updateExtractedData(id, req.body);

    const updated = serverDocumentRepository.getDocument(id);
    res.json({
      message: "Document updated successfully",
      document: updated,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// POST /api/documents/:id/save-to-vault
router.post("/:id/save-to-vault", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user";

    const doc = serverDocumentRepository.getDocument(id);
    if (!doc || doc.userId !== userId) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Update status to verified
    serverDocumentRepository.updateDocument(id, { status: "verified" });

    res.json({
      message: "Document saved to vault successfully",
      documentId: id,
      extractedData: doc.extractedData,
    });
  } catch (error) {
    console.error("Vault save error:", error);
    res.status(500).json({ error: "Failed to save document to vault" });
  }
});

// GET /api/documents
router.get("/", (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string || "demo-user";
    const documentType = req.query.type as string;

    let documents = serverDocumentRepository.getDocumentsByUser(userId);

    if (documentType) {
      documents = documents.filter(
        (doc) => doc.extractedData.documentType === documentType
      );
    }

    res.json({
      total: documents.length,
      documents: documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        extractedData: doc.extractedData,
      })),
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// GET /api/documents/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user";

    const doc = serverDocumentRepository.getDocument(id);
    if (!doc || doc.userId !== userId) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      id: doc.id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
      extractedData: doc.extractedData,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"] as string || "demo-user";

    const doc = serverDocumentRepository.getDocument(id);
    if (!doc || doc.userId !== userId) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete encrypted file
    if (fs.existsSync(doc.encryptedPath)) {
      fs.unlinkSync(doc.encryptedPath);
    }

    serverDocumentRepository.deleteDocument(id);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
