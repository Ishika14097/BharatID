// QR Code API Mock
// Handles QR generation, validation, and management in demo mode

import {
  QRTokenService,
  QRMetadataService,
  type QRTokenPayload
} from "./qr-generator";

interface GenerateQRRequest {
  documentId: string;
  documentType: string;
  ownerName: string;
  ownerEmail?: string;
  documentHash: string;
  expirationDays?: number;
  metadata?: {
    issuerName?: string;
    issueReason?: string;
  };
}

interface GenerateQRResponse {
  success: boolean;
  qrId: string;
  token: string;
  verificationUrl: string;
  expiresAt: string;
  daysRemaining: number;
  error?: string;
}

interface VerifyQRRequest {
  token: string;
}

interface VerifyQRResponse {
  valid: boolean;
  expired: boolean;
  tampered: boolean;
  data?: QRTokenPayload;
  error?: string;
}

// In-memory store for demo
const qrCodeStore = new Map<
  string,
  {
    token: string;
    documentId: string;
    ownerName: string;
    createdAt: number;
  }
>();

/**
 * Handle QR code generation
 */
export async function handleGenerateQR(
  request: GenerateQRRequest
): Promise<GenerateQRResponse> {
  try {
    // Validate input
    if (!request.documentId || !request.documentType || !request.ownerName) {
      throw new Error("Missing required fields");
    }

    // Generate secure token
    const token = QRTokenService.generateToken(
      {
        documentId: request.documentId,
        documentType: request.documentType,
        ownerName: request.ownerName,
        ownerEmail: request.ownerEmail,
        documentHash: request.documentHash,
        metadata: {
          issuerName: request.metadata?.issuerName || "Bharat ID",
          issueReason: request.metadata?.issueReason || "Document Verification",
          verificationUrl: `/verify-qr/`
        }
      },
      request.expirationDays || 365
    );

    // Generate QR ID
    const qrId = QRTokenService.generateQRId();

    // Store QR metadata
    QRMetadataService.storeMetadata(qrId, {
      qrId,
      token,
      documentId: request.documentId,
      ownerName: request.ownerName,
      createdAt: Date.now(),
      verified: true,
      verifications: []
    });

    // Store in demo
    qrCodeStore.set(qrId, {
      token,
      documentId: request.documentId,
      ownerName: request.ownerName,
      createdAt: Date.now()
    });

    // Get expiration info
    const daysRemaining = QRTokenService.getDaysRemaining(token) || 365;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysRemaining);

    return {
      success: true,
      qrId,
      token,
      verificationUrl: `/verify-qr/${token}`,
      expiresAt: expirationDate.toISOString(),
      daysRemaining,
      error: undefined
    };
  } catch (error) {
    console.error("QR generation failed:", error);
    return {
      success: false,
      qrId: "",
      token: "",
      verificationUrl: "",
      expiresAt: "",
      daysRemaining: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Handle QR verification
 */
export async function handleVerifyQR(
  request: VerifyQRRequest
): Promise<VerifyQRResponse> {
  try {
    if (!request.token) {
      return {
        valid: false,
        expired: false,
        tampered: true,
        error: "No token provided"
      };
    }

    // Verify token
    const result = QRTokenService.verifyToken(request.token);

    // Record verification
    if (result.data?.documentId) {
      // Find QR ID from token (for demo)
      let qrId = null;
      for (const [id, qrData] of qrCodeStore) {
        if (qrData.token === request.token) {
          qrId = id;
          break;
        }
      }

      if (qrId) {
        QRMetadataService.recordVerification(
          qrId,
          "0.0.0.0", // In production, get from request
          "Mozilla/5.0" // In production, get from request
        );
      }
    }

    return {
      valid: result.valid,
      expired: result.expired,
      tampered: result.tampered,
      data: result.data,
      error: result.error
    };
  } catch (error) {
    console.error("QR verification failed:", error);
    return {
      valid: false,
      expired: false,
      tampered: true,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get QR code details
 */
export async function handleGetQRDetails(token: string) {
  try {
    const result = QRTokenService.verifyToken(token);

    if (!result.valid && !result.expired) {
      throw new Error("Invalid token");
    }

    const payload = result.data || QRTokenService.parseTokenUnsafe(token);
    const daysRemaining = QRTokenService.getDaysRemaining(token);

    return {
      success: true,
      valid: result.valid,
      expired: result.expired,
      tampered: result.tampered,
      documentId: payload?.documentId,
      documentType: payload?.documentType,
      ownerName: payload?.ownerName,
      issuedAt: payload?.issuedAt ? new Date(payload.issuedAt).toISOString() : null,
      expiresAt: payload?.expiresAt ? new Date(payload.expiresAt).toISOString() : null,
      daysRemaining,
      metadata: payload?.metadata
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * List all QR codes for a user
 */
export async function handleListQRCodes(ownerName: string) {
  try {
    const qrCodes = Array.from(qrCodeStore.values())
      .filter(qr => qr.ownerName === ownerName)
      .map(qr => ({
        token: qr.token,
        documentId: qr.documentId,
        ownerName: qr.ownerName,
        createdAt: new Date(qr.createdAt).toISOString(),
        verificationUrl: `/verify-qr/${qr.token}`
      }));

    return {
      success: true,
      count: qrCodes.length,
      qrCodes
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      qrCodes: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Revoke QR code
 */
export async function handleRevokeQR(token: string) {
  try {
    // Find and remove QR code
    let found = false;
    for (const [qrId, qrData] of qrCodeStore) {
      if (qrData.token === token) {
        qrCodeStore.delete(qrId);
        QRMetadataService.deleteMetadata(qrId);
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error("QR code not found");
    }

    return {
      success: true,
      message: "QR code revoked successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get QR statistics
 */
export async function handleGetQRStats() {
  try {
    const allQRs = Array.from(qrCodeStore.values());

    const stats = {
      totalQRCodes: allQRs.length,
      totalVerifications: 0,
      averageVerificationsPerCode: 0,
      expiredCount: 0,
      activeCount: 0
    };

    // Calculate stats
    let totalVerifications = 0;
    const now = Date.now();

    for (const qr of allQRs) {
      const daysRemaining = QRTokenService.getDaysRemaining(qr.token);
      if (daysRemaining === 0) {
        stats.expiredCount++;
      } else {
        stats.activeCount++;
      }

      // Get verification count from metadata
      // (In production, this would be fetched from database)
    }

    stats.totalVerifications = totalVerifications;
    stats.averageVerificationsPerCode =
      allQRs.length > 0 ? totalVerifications / allQRs.length : 0;

    return {
      success: true,
      stats
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Validate document hash (security check)
 */
export async function handleValidateDocumentHash(
  documentId: string,
  documentHash: string
) {
  try {
    // In production, retrieve stored hash from database and compare
    // For demo, accept all valid SHA-256 hashes (64 hex characters)
    const isValidHash = /^[a-f0-9]{64}$/i.test(documentHash);

    return {
      success: true,
      valid: isValidHash,
      message: isValidHash
        ? "Document hash is valid"
        : "Invalid hash format"
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get QR verification analytics
 */
export async function handleGetQRAnalytics(token: string) {
  try {
    // Find QR ID from token
    let qrId = null;
    for (const [id, qrData] of qrCodeStore) {
      if (qrData.token === token) {
        qrId = id;
        break;
      }
    }

    if (!qrId) {
      throw new Error("QR code not found");
    }

    const metadata = QRMetadataService.getMetadata(qrId);
    const verificationCount = QRMetadataService.getVerificationCount(qrId);
    const lastVerification = QRMetadataService.getLastVerification(qrId);

    return {
      success: true,
      qrId,
      totalVerifications: verificationCount,
      lastVerification: lastVerification ? new Date(lastVerification).toISOString() : null,
      verifications: metadata?.verifications || [],
      createdAt: metadata?.createdAt ? new Date(metadata.createdAt).toISOString() : null
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Batch generate QR codes
 */
export async function handleBatchGenerateQR(requests: GenerateQRRequest[]) {
  try {
    const results = await Promise.all(
      requests.map(req => handleGenerateQR(req))
    );

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: true,
      totalRequested: requests.length,
      successful: successful.length,
      failed: failed.length,
      results,
      error: undefined
    };
  } catch (error) {
    return {
      success: false,
      totalRequested: 0,
      successful: 0,
      failed: 0,
      results: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Export all API handlers
export const QRCodeAPI = {
  generateQR: handleGenerateQR,
  verifyQR: handleVerifyQR,
  getQRDetails: handleGetQRDetails,
  listQRCodes: handleListQRCodes,
  revokeQR: handleRevokeQR,
  getStats: handleGetQRStats,
  validateDocumentHash: handleValidateDocumentHash,
  getAnalytics: handleGetQRAnalytics,
  batchGenerate: handleBatchGenerateQR
};
