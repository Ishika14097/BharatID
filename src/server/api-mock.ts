// Mock API implementation for development
// In production, integrate with actual backend (Express, Node.js, etc.)

import { extractFromDocumentPlaceholder } from "./ocr.js";

interface StoredDocument {
  id: string;
  userId: string;
  filename: string;
  extractedData: {
    name: string;
    dob: string;
    address: string;
    idNumber: string;
    documentType: string;
  };
  status: "verified" | "pending" | "failed";
  uploadedAt: Date;
}

// In-memory storage (in production, use a real database)
const documentsStore = new Map<string, StoredDocument>();

export async function handleDocumentUpload(
  file: File,
  userId: string = "demo-user"
): Promise<{ documentId: string; extractedData: any }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Simulate processing delay
      await new Promise((r) => setTimeout(r, 1000));

      // Generate document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Extract data from filename (demo)
      const extractedData = extractFromDocumentPlaceholder(file.name);

      // Store in mock database
      const doc: StoredDocument = {
        id: documentId,
        userId,
        filename: file.name,
        extractedData,
        status: "verified",
        uploadedAt: new Date(),
      };

      documentsStore.set(documentId, doc);

      resolve({
        documentId,
        extractedData,
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function handleDocumentUpdate(
  documentId: string,
  field: string,
  value: string,
  userId: string = "demo-user"
): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const doc = documentsStore.get(documentId);
      if (!doc || doc.userId !== userId) {
        reject(new Error("Document not found"));
        return;
      }

      // Update extracted data
      doc.extractedData = {
        ...doc.extractedData,
        [field]: value,
      };

      documentsStore.set(documentId, doc);
      resolve(doc);
    } catch (error) {
      reject(error);
    }
  });
}

export async function handleSaveToVault(
  documentId: string,
  userId: string = "demo-user"
): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const doc = documentsStore.get(documentId);
      if (!doc || doc.userId !== userId) {
        reject(new Error("Document not found"));
        return;
      }

      doc.status = "verified";
      documentsStore.set(documentId, doc);
      resolve(doc);
    } catch (error) {
      reject(error);
    }
  });
}

export async function handleGetDocuments(
  userId: string = "demo-user"
): Promise<StoredDocument[]> {
  return Array.from(documentsStore.values()).filter(
    (doc) => doc.userId === userId
  );
}

export async function handleDeleteDocument(
  documentId: string,
  userId: string = "demo-user"
): Promise<void> {
  const doc = documentsStore.get(documentId);
  if (doc && doc.userId === userId) {
    documentsStore.delete(documentId);
  }
}
