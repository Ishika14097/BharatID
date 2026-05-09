// QR Code Token Generation & Validation Service
// Provides secure tokens with expiration and tamper detection

import crypto from "crypto";

export interface QRTokenPayload {
  documentId: string;
  documentType: string;
  ownerName: string;
  ownerEmail?: string;
  documentHash: string;
  issuedAt: number;
  expiresAt: number;
  metadata?: {
    issuerName?: string;
    issueReason?: string;
    verificationUrl?: string;
  };
}

export interface QRVerificationResult {
  valid: boolean;
  expired: boolean;
  tampered: boolean;
  data?: QRTokenPayload;
  error?: string;
}

// Secret key for HMAC (in production, load from environment)
const QR_SECRET_KEY = process.env.QR_SECRET_KEY || "bharat-id-qr-secret-key-2024";

export class QRTokenService {
  /**
   * Generate secure QR token
   * @param payload Token payload
   * @param expirationDays Days until expiration (default: 365)
   * @returns Secure token string
   */
  static generateToken(
    payload: Omit<QRTokenPayload, "issuedAt" | "expiresAt">,
    expirationDays: number = 365
  ): string {
    const now = Date.now();
    const expiresAt = now + expirationDays * 24 * 60 * 60 * 1000;

    const fullPayload: QRTokenPayload = {
      ...payload,
      issuedAt: now,
      expiresAt
    };

    // Create token: payload + signature
    const payloadString = JSON.stringify(fullPayload);
    const signature = this.createSignature(payloadString);

    // Combine payload and signature
    const token = Buffer.from(payloadString).toString("base64") +
      "." +
      signature;

    return token;
  }

  /**
   * Verify and decode token
   * @param token Token string
   * @returns Verification result with data if valid
   */
  static verifyToken(token: string): QRVerificationResult {
    try {
      // Split token
      const [encodedPayload, signature] = token.split(".");

      if (!encodedPayload || !signature) {
        return {
          valid: false,
          expired: false,
          tampered: true,
          error: "Invalid token format"
        };
      }

      // Decode payload
      const payloadString = Buffer.from(encodedPayload, "base64").toString(
        "utf-8"
      );
      const payload: QRTokenPayload = JSON.parse(payloadString);

      // Verify signature
      const expectedSignature = this.createSignature(payloadString);
      if (signature !== expectedSignature) {
        return {
          valid: false,
          expired: false,
          tampered: true,
          error: "Signature mismatch - token has been tampered with"
        };
      }

      // Check expiration
      const now = Date.now();
      if (now > payload.expiresAt) {
        return {
          valid: false,
          expired: true,
          tampered: false,
          data: payload,
          error: "Token has expired"
        };
      }

      // Verify document hash (additional security)
      if (!this.validateDocumentHash(payload)) {
        return {
          valid: false,
          expired: false,
          tampered: true,
          data: payload,
          error: "Document hash validation failed"
        };
      }

      return {
        valid: true,
        expired: false,
        tampered: false,
        data: payload
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        tampered: true,
        error: `Token verification failed: ${error.message}`
      };
    }
  }

  /**
   * Create HMAC signature for token
   * @param payload Payload string
   * @returns Signature string
   */
  private static createSignature(payload: string): string {
    return crypto
      .createHmac("sha256", QR_SECRET_KEY)
      .update(payload)
      .digest("hex");
  }

  /**
   * Generate document hash for integrity checking
   * @param documentData Document content
   * @returns SHA-256 hash
   */
  static generateDocumentHash(documentData: string): string {
    return crypto
      .createHash("sha256")
      .update(documentData)
      .digest("hex");
  }

  /**
   * Validate document hash
   * @param payload Token payload
   * @returns True if hash is valid
   */
  private static validateDocumentHash(payload: QRTokenPayload): boolean {
    // In demo mode, skip actual hash validation
    // In production, validate against stored document hash
    return !!payload.documentHash && payload.documentHash.length === 64;
  }

  /**
   * Generate unique QR ID
   * @returns Unique ID
   */
  static generateQRId(): string {
    return `QR_${Date.now()}_${crypto
      .randomBytes(8)
      .toString("hex")
      .toUpperCase()}`;
  }

  /**
   * Create QR URL
   * @param token Token string
   * @param baseUrl Base verification URL
   * @returns Full QR verification URL
   */
  static createQRUrl(token: string, baseUrl: string = ""): string {
    const url = baseUrl || window.location.origin || "https://bharat-id.com";
    return `${url}/verify-qr/${token}`;
  }

  /**
   * Check if token is about to expire
   * @param token Token string
   * @param warningDays Days before expiration to warn
   * @returns True if token expires within warning period
   */
  static isAboutToExpire(token: string, warningDays: number = 30): boolean {
    try {
      const [encodedPayload] = token.split(".");
      const payloadString = Buffer.from(encodedPayload, "base64").toString(
        "utf-8"
      );
      const payload: QRTokenPayload = JSON.parse(payloadString);

      const now = Date.now();
      const warningTime = now + warningDays * 24 * 60 * 60 * 1000;

      return payload.expiresAt <= warningTime && payload.expiresAt > now;
    } catch {
      return false;
    }
  }

  /**
   * Get expiration status
   * @param token Token string
   * @returns Days remaining, or null if invalid
   */
  static getDaysRemaining(token: string): number | null {
    try {
      const [encodedPayload] = token.split(".");
      const payloadString = Buffer.from(encodedPayload, "base64").toString(
        "utf-8"
      );
      const payload: QRTokenPayload = JSON.parse(payloadString);

      const now = Date.now();
      const daysRemaining = Math.ceil(
        (payload.expiresAt - now) / (24 * 60 * 60 * 1000)
      );

      return Math.max(0, daysRemaining);
    } catch {
      return null;
    }
  }

  /**
   * Batch generate tokens for multiple documents
   * @param payloads Array of payloads
   * @param expirationDays Expiration in days
   * @returns Array of tokens
   */
  static batchGenerateTokens(
    payloads: Array<Omit<QRTokenPayload, "issuedAt" | "expiresAt">>,
    expirationDays: number = 365
  ): string[] {
    return payloads.map(payload => this.generateToken(payload, expirationDays));
  }

  /**
   * Parse token without verification (unsafe - for display only)
   * @param token Token string
   * @returns Payload or null
   */
  static parseTokenUnsafe(token: string): QRTokenPayload | null {
    try {
      const [encodedPayload] = token.split(".");
      const payloadString = Buffer.from(encodedPayload, "base64").toString(
        "utf-8"
      );
      return JSON.parse(payloadString);
    } catch {
      return null;
    }
  }
}

// QR metadata storage (in-memory for demo, use database in production)
interface QRMetadata {
  qrId: string;
  token: string;
  documentId: string;
  ownerName: string;
  createdAt: number;
  verified: boolean;
  verifications: Array<{
    timestamp: number;
    ipAddress?: string;
    userAgent?: string;
  }>;
}

const qrMetadataStore = new Map<string, QRMetadata>();

export class QRMetadataService {
  /**
   * Store QR metadata
   * @param qrId QR ID
   * @param metadata Metadata
   */
  static storeMetadata(qrId: string, metadata: QRMetadata): void {
    qrMetadataStore.set(qrId, metadata);
  }

  /**
   * Get QR metadata
   * @param qrId QR ID
   * @returns Metadata or null
   */
  static getMetadata(qrId: string): QRMetadata | null {
    return qrMetadataStore.get(qrId) || null;
  }

  /**
   * Record verification
   * @param qrId QR ID
   * @param ipAddress IP address
   * @param userAgent User agent
   */
  static recordVerification(
    qrId: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    const metadata = qrMetadataStore.get(qrId);
    if (metadata) {
      metadata.verifications.push({
        timestamp: Date.now(),
        ipAddress,
        userAgent
      });
    }
  }

  /**
   * Get verification count
   * @param qrId QR ID
   * @returns Number of verifications
   */
  static getVerificationCount(qrId: string): number {
    const metadata = qrMetadataStore.get(qrId);
    return metadata?.verifications.length || 0;
  }

  /**
   * Get last verification
   * @param qrId QR ID
   * @returns Last verification timestamp or null
   */
  static getLastVerification(
    qrId: string
  ): number | null {
    const metadata = qrMetadataStore.get(qrId);
    if (metadata && metadata.verifications.length > 0) {
      return metadata.verifications[metadata.verifications.length - 1].timestamp;
    }
    return null;
  }

  /**
   * Get all QR codes for a user
   * @param ownerName Owner name
   * @returns Array of QR metadata
   */
  static getQRCodesForUser(ownerName: string): QRMetadata[] {
    return Array.from(qrMetadataStore.values()).filter(
      m => m.ownerName === ownerName
    );
  }

  /**
   * Delete QR metadata
   * @param qrId QR ID
   */
  static deleteMetadata(qrId: string): void {
    qrMetadataStore.delete(qrId);
  }

  /**
   * Clear all metadata (use with caution)
   */
  static clearAll(): void {
    qrMetadataStore.clear();
  }

  /**
   * Get total QR count
   * @returns Number of QR codes
   */
  static getTotalQRCount(): number {
    return qrMetadataStore.size;
  }
}

// Export utilities for client-side QR generation
export const QRUtils = {
  /**
   * Check if QR code is valid
   * @param token Token string
   * @returns Verification result
   */
  verifyQRToken: (token: string) => QRTokenService.verifyToken(token),

  /**
   * Get QR validity status
   * @param token Token string
   * @returns Status object
   */
  getQRStatus: (token: string) => {
    const result = QRTokenService.verifyToken(token);
    return {
      isValid: result.valid,
      isExpired: result.expired,
      isTampered: result.tampered,
      daysRemaining: QRTokenService.getDaysRemaining(token),
      data: result.data,
      error: result.error
    };
  },

  /**
   * Generate QR URL
   * @param token Token string
   * @returns Full URL for QR code
   */
  generateQRUrl: (token: string) => QRTokenService.createQRUrl(token),

  /**
   * Get token expiration date
   * @param token Token string
   * @returns Date object or null
   */
  getExpirationDate: (token: string) => {
    const payload = QRTokenService.parseTokenUnsafe(token);
    return payload ? new Date(payload.expiresAt) : null;
  }
};
