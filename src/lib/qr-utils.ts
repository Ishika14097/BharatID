// QR Code Utility Functions
// Handles QR code generation, display, and validation on client-side

import { QRTokenPayload, QRVerificationResult, QRTokenService } from "./qr-generator";

export interface QRGenerationOptions {
  size?: number;
  errorCorrection?: "L" | "M" | "Q" | "H";
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate QR code SVG from URL
 * Uses simple algorithm for demo, can replace with qrcode library
 */
export class QRCodeGenerator {
  /**
   * Generate QR code data URL
   * @param url URL to encode
   * @param options Generation options
   * @returns Data URL for image
   */
  static async generateQRCode(
    url: string,
    options: QRGenerationOptions = {}
  ): Promise<string> {
    const {
      size = 300,
      errorCorrection = "M",
      margin = 10,
      color = { dark: "#000000", light: "#FFFFFF" }
    } = options;

    try {
      // Use QR code library API (qrcode.js or zxing)
      // For production, install: npm install qrcode
      // This is a placeholder implementation

      // In real implementation, use:
      // import QRCode from "qrcode";
      // return QRCode.toDataURL(url, { width: size, errorCorrectionLevel: errorCorrection });

      // For now, return a data URL that can be generated dynamically
      return this.generateSimpleQRPlaceholder(url, size, color);
    } catch (error) {
      console.error("QR code generation failed:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate QR SVG element
   * @param url URL to encode
   * @param options Options
   * @returns SVG element
   */
  static async generateQRSVG(
    url: string,
    options: QRGenerationOptions = {}
  ): Promise<SVGElement> {
    const { size = 300, color = { dark: "#000000", light: "#FFFFFF" } } =
      options;

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size.toString());
    svg.setAttribute("height", size.toString());
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

    // Background
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", size.toString());
    rect.setAttribute("height", size.toString());
    rect.setAttribute("fill", color.light || "#FFFFFF");
    svg.appendChild(rect);

    // In production, render actual QR code pattern
    // For demo, just show a simple pattern
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", (size / 2).toString());
    text.setAttribute("y", (size / 2).toString());
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "12");
    text.setAttribute("fill", color.dark || "#000000");
    text.textContent = "QR Code";
    svg.appendChild(text);

    return svg;
  }

  /**
   * Download QR code as image
   * @param url URL to encode
   * @param filename Filename
   */
  static async downloadQRCode(url: string, filename: string = "qr-code.png") {
    try {
      const dataUrl = await this.generateQRCode(url);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("QR code download failed:", error);
      throw error;
    }
  }

  /**
   * Generate placeholder QR code
   * @param url URL to encode
   * @param size Size
   * @param color Color scheme
   * @returns Data URL
   */
  private static generateSimpleQRPlaceholder(
    url: string,
    size: number,
    color: any
  ): string {
    // Create canvas for QR code
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Background
    ctx.fillStyle = color.light || "#FFFFFF";
    ctx.fillRect(0, 0, size, size);

    // Create simple pattern (in production, use actual QR encoding)
    ctx.fillStyle = color.dark || "#000000";

    // Three position markers
    const markerSize = size / 7;
    this.drawPositionMarker(ctx, 0, 0, markerSize);
    this.drawPositionMarker(ctx, size - markerSize, 0, markerSize);
    this.drawPositionMarker(ctx, 0, size - markerSize, markerSize);

    // Data pattern (hash-based for consistency)
    const hash = this.simpleHash(url);
    const patternSize = Math.max(1, size / 20);

    for (let i = 0; i < size; i += patternSize * 2) {
      for (let j = 0; j < size; j += patternSize * 2) {
        if (Math.random() > 0.5) {
          ctx.fillRect(
            i + markerSize,
            j + markerSize,
            patternSize,
            patternSize
          );
        }
      }
    }

    return canvas.toDataURL("image/png");
  }

  /**
   * Draw QR position marker
   */
  private static drawPositionMarker(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    // Outer square
    ctx.fillRect(x, y, size, size);

    // Inner white square
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + size / 7, y + size / 7, (size * 5) / 7, (size * 5) / 7);

    // Inner black square
    ctx.fillStyle = "#000000";
    ctx.fillRect(x + (size * 2) / 7, y + (size * 2) / 7, (size * 3) / 7, (size * 3) / 7);
  }

  /**
   * Simple hash function for demo
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

/**
 * QR Code Scanner (for verification page)
 */
export class QRCodeScanner {
  /**
   * Scan QR code from camera
   * @param videoElement Video element
   * @returns Scanned data or null
   */
  static async scanFromCamera(videoElement: HTMLVideoElement): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      videoElement.srcObject = stream;
      await videoElement.play();

      return null; // In production, use barcode detection API
    } catch (error) {
      console.error("Camera access denied:", error);
      return null;
    }
  }

  /**
   * Stop camera stream
   */
  static stopCamera(videoElement: HTMLVideoElement): void {
    if (videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
  }
}

/**
 * QR Verification utilities
 */
export class QRVerifier {
  /**
   * Verify QR token from URL
   * @param token Token from URL
   * @returns Verification result
   */
  static verifyToken(token: string): QRVerificationResult {
    return QRTokenService.verifyToken(token);
  }

  /**
   * Get formatted verification status
   * @param result Verification result
   * @returns Formatted status
   */
  static formatStatus(result: QRVerificationResult): {
    status: "verified" | "expired" | "tampered" | "invalid";
    message: string;
    color: "green" | "yellow" | "red";
  } {
    if (result.tampered) {
      return {
        status: "tampered",
        message: "⚠️ Document has been tampered with. Do not accept.",
        color: "red"
      };
    }

    if (result.expired) {
      return {
        status: "expired",
        message: "⏰ Verification code has expired.",
        color: "yellow"
      };
    }

    if (result.valid) {
      return {
        status: "verified",
        message: "✅ Document verified successfully.",
        color: "green"
      };
    }

    return {
      status: "invalid",
      message: "❌ Invalid verification code.",
      color: "red"
    };
  }

  /**
   * Get document info from token
   * @param token Token
   * @returns Document info or null
   */
  static getDocumentInfo(token: string): {
    ownerName: string;
    documentType: string;
    issuedAt: string;
    expiresAt: string;
    daysRemaining: number;
  } | null {
    const payload = QRTokenService.parseTokenUnsafe(token);

    if (!payload) return null;

    const daysRemaining = QRTokenService.getDaysRemaining(token) || 0;

    return {
      ownerName: payload.ownerName,
      documentType: payload.documentType,
      issuedAt: new Date(payload.issuedAt).toLocaleDateString(),
      expiresAt: new Date(payload.expiresAt).toLocaleDateString(),
      daysRemaining
    };
  }

  /**
   * Check if token is valid for presentation
   * @param token Token
   * @returns True if valid and not expired
   */
  static isValidForPresentation(token: string): boolean {
    const result = QRTokenService.verifyToken(token);
    return result.valid && !result.tampered && !result.expired;
  }
}

/**
 * QR Code Display utilities
 */
export class QRDisplay {
  /**
   * Get QR code URL for embedding
   * @param token Token
   * @param baseUrl Base URL
   * @returns Full QR verification URL
   */
  static getQRUrl(token: string, baseUrl: string = ""): string {
    return QRTokenService.createQRUrl(token, baseUrl);
  }

  /**
   * Format token for display
   * @param token Token
   * @returns Shortened token for display
   */
  static formatTokenForDisplay(token: string): string {
    const [first, second] = token.split(".");
    const shortFirst = first.substring(0, 12) + "...";
    const shortSecond = second.substring(0, 8) + "...";
    return `${shortFirst}.${shortSecond}`;
  }

  /**
   * Copy token to clipboard
   * @param token Token
   */
  static copyToClipboard(token: string): Promise<void> {
    return navigator.clipboard.writeText(token);
  }

  /**
   * Share QR code
   * @param token Token
   * @param title Title
   * @param text Description
   */
  static async shareQRCode(
    token: string,
    title: string = "Document Verification",
    text: string = "Verify this document using the QR code"
  ): Promise<void> {
    const url = this.getQRUrl(token);

    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      });
    } else {
      // Fallback: copy to clipboard
      await this.copyToClipboard(url);
    }
  }

  /**
   * Get verification link
   * @param token Token
   * @param baseUrl Base URL
   * @returns Shareable verification link
   */
  static getVerificationLink(token: string, baseUrl: string = ""): string {
    return this.getQRUrl(token, baseUrl);
  }
}

/**
 * QR Code Storage (localStorage for client-side)
 */
export class QRStorage {
  private static storageKey = "bharat_id_qr_codes";

  /**
   * Store QR code locally
   * @param documentId Document ID
   * @param token QR token
   * @param metadata Additional metadata
   */
  static saveQRCode(
    documentId: string,
    token: string,
    metadata?: Record<string, any>
  ): void {
    try {
      const stored = this.getAllQRCodes();
      stored[documentId] = {
        token,
        createdAt: Date.now(),
        metadata
      };
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      console.error("Failed to save QR code:", error);
    }
  }

  /**
   * Get QR code by document ID
   * @param documentId Document ID
   * @returns QR token or null
   */
  static getQRCode(documentId: string): string | null {
    try {
      const stored = this.getAllQRCodes();
      return stored[documentId]?.token || null;
    } catch (error) {
      console.error("Failed to get QR code:", error);
      return null;
    }
  }

  /**
   * Get all stored QR codes
   * @returns Object with document IDs as keys
   */
  static getAllQRCodes(): Record<
    string,
    { token: string; createdAt: number; metadata?: Record<string, any> }
  > {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to retrieve QR codes:", error);
      return {};
    }
  }

  /**
   * Delete QR code
   * @param documentId Document ID
   */
  static deleteQRCode(documentId: string): void {
    try {
      const stored = this.getAllQRCodes();
      delete stored[documentId];
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
    } catch (error) {
      console.error("Failed to delete QR code:", error);
    }
  }

  /**
   * Clear all QR codes
   */
  static clearAllQRCodes(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error("Failed to clear QR codes:", error);
    }
  }

  /**
   * Get QR codes count
   * @returns Number of stored QR codes
   */
  static getQRCodeCount(): number {
    return Object.keys(this.getAllQRCodes()).length;
  }
}

// Utility functions for quick access
export const QRUtils = {
  generateQRCode: (url: string, options?: QRGenerationOptions) =>
    QRCodeGenerator.generateQRCode(url, options),

  downloadQRCode: (url: string, filename?: string) =>
    QRCodeGenerator.downloadQRCode(url, filename),

  verifyToken: (token: string) => QRVerifier.verifyToken(token),

  getDocumentInfo: (token: string) => QRVerifier.getDocumentInfo(token),

  getQRUrl: (token: string, baseUrl?: string) =>
    QRDisplay.getQRUrl(token, baseUrl),

  saveQRCode: (docId: string, token: string, metadata?: Record<string, any>) =>
    QRStorage.saveQRCode(docId, token, metadata),

  getQRCode: (docId: string) => QRStorage.getQRCode(docId),

  getAllQRCodes: () => QRStorage.getAllQRCodes()
};
