import Dexie, { Table } from "dexie";

export interface StoredDocument {
  id?: string;
  userId: string;
  filename: string;
  fileHash: string;
  encryptedPath: string;
  uploadedAt: Date;
  extractedData: {
    name: string;
    dob: string;
    address: string;
    idNumber: string;
    documentType: string;
  };
  status: "verified" | "pending" | "failed";
  virusScanResult?: boolean;
  notes?: string;
}

export class BharatIDDB extends Dexie {
  documents!: Table<StoredDocument>;

  constructor() {
    super("BharatIDDB");
    this.version(1).stores({
      documents: "++id, userId, documentType, uploadedAt",
    });
  }
}

export const db = new BharatIDDB();

// Database operations
export const documentRepository = {
  async addDocument(doc: Omit<StoredDocument, "id">): Promise<string> {
    const id = await db.documents.add(doc);
    return String(id);
  },

  async getDocument(id: string): Promise<StoredDocument | undefined> {
    return db.documents.get(id);
  },

  async getDocumentsByUser(userId: string): Promise<StoredDocument[]> {
    return db.documents.where("userId").equals(userId).toArray();
  },

  async getDocumentsByType(
    userId: string,
    documentType: string
  ): Promise<StoredDocument[]> {
    return db.documents
      .where("userId")
      .equals(userId)
      .filter((doc) => doc.extractedData.documentType === documentType)
      .toArray();
  },

  async updateDocument(
    id: string,
    updates: Partial<StoredDocument>
  ): Promise<void> {
    await db.documents.update(id, updates);
  },

  async updateExtractedData(
    id: string,
    extractedData: Partial<StoredDocument["extractedData"]>
  ): Promise<void> {
    const doc = await db.documents.get(id);
    if (doc) {
      await db.documents.update(id, {
        extractedData: {
          ...doc.extractedData,
          ...extractedData,
        },
      });
    }
  },

  async deleteDocument(id: string): Promise<void> {
    await db.documents.delete(id);
  },

  async getVerifiedDocuments(userId: string): Promise<StoredDocument[]> {
    return db.documents
      .where("userId")
      .equals(userId)
      .filter((doc) => doc.status === "verified")
      .toArray();
  },

  async getRecentDocuments(userId: string, limit: number = 10) {
    return db.documents
      .where("userId")
      .equals(userId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async searchDocuments(
    userId: string,
    searchTerm: string
  ): Promise<StoredDocument[]> {
    const docs = await db.documents.where("userId").equals(userId).toArray();
    const lowerSearch = searchTerm.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.filename.toLowerCase().includes(lowerSearch) ||
        doc.extractedData.name.toLowerCase().includes(lowerSearch) ||
        doc.extractedData.documentType.toLowerCase().includes(lowerSearch)
    );
  },
};

// Server-side database schema (using a simple JSON storage for demo)
export interface ServerDocument {
  id: string;
  userId: string;
  filename: string;
  fileHash: string;
  encryptedPath: string;
  uploadedAt: Date;
  extractedData: {
    name: string;
    dob: string;
    address: string;
    idNumber: string;
    documentType: string;
  };
  status: "verified" | "pending" | "failed";
  virusScanResult?: boolean;
  notes?: string;
}

// In-memory storage for demo (replace with actual database in production)
export const documentsStore = new Map<string, ServerDocument>();

export const serverDocumentRepository = {
  addDocument(doc: Omit<ServerDocument, "id">): string {
    const id = crypto.randomUUID();
    documentsStore.set(id, { id, ...doc });
    return id;
  },

  getDocument(id: string): ServerDocument | undefined {
    return documentsStore.get(id);
  },

  getDocumentsByUser(userId: string): ServerDocument[] {
    return Array.from(documentsStore.values()).filter(
      (doc) => doc.userId === userId
    );
  },

  updateDocument(
    id: string,
    updates: Partial<ServerDocument>
  ): ServerDocument | undefined {
    const doc = documentsStore.get(id);
    if (doc) {
      const updated = { ...doc, ...updates };
      documentsStore.set(id, updated);
      return updated;
    }
    return undefined;
  },

  updateExtractedData(
    id: string,
    extractedData: Partial<ServerDocument["extractedData"]>
  ): void {
    const doc = documentsStore.get(id);
    if (doc) {
      doc.extractedData = {
        ...doc.extractedData,
        ...extractedData,
      };
    }
  },

  deleteDocument(id: string): boolean {
    return documentsStore.delete(id);
  },

  getVerifiedDocuments(userId: string): ServerDocument[] {
    return Array.from(documentsStore.values()).filter(
      (doc) => doc.userId === userId && doc.status === "verified"
    );
  },
};
