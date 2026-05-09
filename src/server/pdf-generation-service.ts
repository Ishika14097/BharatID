/**
 * PDF Generation & Watermark Service
 * 
 * Handles:
 * - PDF generation from documents
 * - Watermark addition (verified copy with timestamp)
 * - PDF merging for bulk downloads
 * - Document formatting
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PDFOptions {
  includeWatermark: boolean;
  watermarkText?: string;
  watermarkTimestamp?: Date;
  pageSize?: 'A4' | 'Letter';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  quality?: number;
}

export interface WatermarkConfig {
  text: string;
  timestamp: Date;
  opacity: number;
  rotation: number;
  fontSize: number;
}

/**
 * PDF Generation Service
 */
export class PDFGenerationService {
  private tempDir: string;
  private watermarkConfig: WatermarkConfig = {
    text: 'VERIFIED COPY',
    timestamp: new Date(),
    opacity: 0.15,
    rotation: -45,
    fontSize: 48
  };

  constructor(tempDir: string = './temp/pdf') {
    this.tempDir = tempDir;
    this.initializeTempDirectory();
  }

  /**
   * Initialize temp directory
   */
  private initializeTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate PDF from document
   */
  public async generatePDF(
    sourcePath: string,
    documentName: string,
    options: PDFOptions = { includeWatermark: false }
  ): Promise<{
    outputPath: string;
    fileName: string;
    fileSize: number;
  }> {
    try {
      const outputFileName = `${crypto.randomUUID()}.pdf`;
      const outputPath = path.join(this.tempDir, outputFileName);

      // Simulate PDF generation
      // In production, use PDFKit or similar library
      const pdfContent = this.generatePDFContent(
        sourcePath,
        documentName,
        options
      );

      fs.writeFileSync(outputPath, pdfContent);

      const fileSize = fs.statSync(outputPath).size;

      return {
        outputPath,
        fileName: outputFileName,
        fileSize
      };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add watermark to PDF
   */
  public async addWatermark(
    inputPath: string,
    options: Partial<WatermarkConfig> = {}
  ): Promise<{
    outputPath: string;
    fileName: string;
  }> {
    try {
      const config = { ...this.watermarkConfig, ...options };
      const outputFileName = `watermarked_${crypto.randomUUID()}.pdf`;
      const outputPath = path.join(this.tempDir, outputFileName);

      // Simulate watermark addition
      // In production, use PDF library to add actual watermark
      const watermarkedContent = this.applyWatermark(
        inputPath,
        config
      );

      fs.writeFileSync(outputPath, watermarkedContent);

      return {
        outputPath,
        fileName: outputFileName
      };
    } catch (error) {
      throw new Error(`Watermark application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Merge multiple PDFs into one
   */
  public async mergePDFs(
    pdfPaths: string[],
    outputFileName: string,
    options: { includeWatermark: boolean } = { includeWatermark: false }
  ): Promise<{
    outputPath: string;
    fileName: string;
    fileSize: number;
    pageCount: number;
  }> {
    try {
      const outputPath = path.join(this.tempDir, outputFileName);

      // Simulate PDF merging
      // In production, use PDFKit or pdf-lib
      const mergedContent = this.mergePDFContent(pdfPaths, options.includeWatermark);

      fs.writeFileSync(outputPath, mergedContent);

      const fileSize = fs.statSync(outputPath).size;
      const pageCount = pdfPaths.length; // Simplified; actual count would need PDF parsing

      return {
        outputPath,
        fileName: outputFileName,
        fileSize,
        pageCount
      };
    } catch (error) {
      throw new Error(`PDF merging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate printable HTML from document
   */
  public generatePrintableHTML(
    documentName: string,
    documentType: string,
    metadata: Record<string, any>,
    includeWatermark: boolean = false
  ): string {
    const timestamp = new Date().toLocaleString();
    const watermark = includeWatermark
      ? `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          width: 500px;
          opacity: 0.15;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 48px;
          font-weight: bold;
          color: gray;
          z-index: -1;
          text-align: center;
          pointer-events: none;
        ">
          VERIFIED COPY<br/>
          ${timestamp}
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentName} - Print</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
          }

          .document-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }

          .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 10px;
          }

          .meta-info {
            font-size: 12px;
            color: #666;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }

          .meta-item {
            display: flex;
            flex-direction: column;
          }

          .meta-label {
            font-weight: bold;
            color: #444;
            margin-bottom: 5px;
          }

          .content {
            margin: 30px 0;
            page-break-inside: avoid;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }

          .verification-badge {
            display: inline-block;
            padding: 8px 15px;
            background: #10b981;
            color: white;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 15px;
          }

          @media print {
            body {
              padding: 0;
            }

            .document-container {
              box-shadow: none;
              border: none;
              padding: 0;
              max-width: 100%;
            }

            .no-print {
              display: none;
            }
          }

          @page {
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        ${watermark}
        <div class="document-container">
          <div class="header">
            <div class="verification-badge">✓ VERIFIED COPY</div>
            <h1>${documentName}</h1>
            <p>Document Type: ${documentType}</p>
          </div>

          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">Generated On:</span>
              <span>${timestamp}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Document ID:</span>
              <span>${metadata.documentId || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Status:</span>
              <span>${metadata.status || 'Verified'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Page:</span>
              <span>1</span>
            </div>
          </div>

          <div class="content">
            <p><strong>This is a digital representation of the official document.</strong></p>
            <p>For verification purposes, this document includes a digital watermark indicating it is a verified copy generated from the official record.</p>
          </div>

          <div class="footer">
            <p>This document was generated on ${timestamp} and is valid for official purposes.</p>
            <p>For authenticity verification, visit the official government portal.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF content (mock implementation)
   */
  private generatePDFContent(
    sourcePath: string,
    documentName: string,
    options: PDFOptions
  ): Buffer {
    // Mock PDF content
    // In production, use PDFKit or similar
    const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
50 750 Td
(${documentName}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000333 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
432
%%EOF
    `;

    if (options.includeWatermark) {
      return Buffer.from(content + '\n%Watermark: VERIFIED COPY');
    }

    return Buffer.from(content);
  }

  /**
   * Apply watermark to PDF
   */
  private applyWatermark(inputPath: string, config: WatermarkConfig): Buffer {
    // Mock watermark application
    // In production, use PDFKit or pdf-lib
    if (fs.existsSync(inputPath)) {
      const content = fs.readFileSync(inputPath);
      return Buffer.concat([
        content,
        Buffer.from(`\n%Watermark: ${config.text} | ${config.timestamp.toISOString()}`)
      ]);
    }

    return Buffer.from(`%Watermark Applied: ${config.text}`);
  }

  /**
   * Merge PDF content
   */
  private mergePDFContent(pdfPaths: string[], includeWatermark: boolean): Buffer {
    // Mock PDF merging
    // In production, use PDF library
    let merged = Buffer.from('%PDF-1.4\n% Merged PDF\n');

    pdfPaths.forEach((pdfPath, index) => {
      if (fs.existsSync(pdfPath)) {
        const content = fs.readFileSync(pdfPath);
        merged = Buffer.concat([merged, Buffer.from(`\n% Page ${index + 1}\n`), content]);
      }
    });

    if (includeWatermark) {
      merged = Buffer.concat([
        merged,
        Buffer.from(`\n%Watermark: VERIFIED COPY | ${new Date().toISOString()}`)
      ]);
    }

    return merged;
  }

  /**
   * Clean up old PDF files
   */
  public cleanupOldFiles(maxAgeHours: number = 24): number {
    let deletedCount = 0;

    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stat = fs.statSync(filePath);
        const fileAge = now - stat.mtimeMs;

        if (fileAge > maxAgeHours * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    return deletedCount;
  }
}

// Export singleton instance
export const pdfGenerationService = new PDFGenerationService(
  process.env.PDF_TEMP_DIR || './temp/pdf'
);
