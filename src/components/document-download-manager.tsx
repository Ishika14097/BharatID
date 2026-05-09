'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DownloadIcon, PrinterIcon, ShareIcon, EyeIcon, CheckIcon, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentViewer, type DocumentViewerDocument } from '@/components/document-viewer';

export interface Document {
  documentId: string;
  fileName: string;
  documentType: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'kyc' | 'other';
  format: 'pdf' | 'jpg' | 'png';
  fileSize: number;
  uploadedAt: Date;
  verified: boolean;
  accessLevel: 'public' | 'private' | 'restricted';
}

export interface DownloadManagerProps {
  userId: string;
  documents: Document[];
  onDownload?: (documentId: string) => void;
  onPrint?: (documentId: string) => void;
  compact?: boolean;
}

/**
 * Download Manager Component
 */
export function DocumentDownloadManager({
  userId,
  documents,
  onDownload,
  onPrint,
  compact = false
}: DownloadManagerProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'zip'>('pdf');

  /**
   * Handle single document download
   */
  const handleDownloadSingle = useCallback(async (documentId: string) => {
    setIsLoading(prev => new Set(prev).add(documentId));

    try {
      const response = await fetch('/api/documents/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentId })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documents.find(d => d.documentId === documentId)?.fileName || 'document';
      a.click();

      toast.success('Document downloaded successfully');
      onDownload?.(documentId);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    } finally {
      setIsLoading(prev => {
        const updated = new Set(prev);
        updated.delete(documentId);
        return updated;
      });
    }
  }, [documents, onDownload]);

  /**
   * Handle bulk download
   */
  const handleBulkDownload = useCallback(async () => {
    if (selectedDocuments.size === 0) {
      toast.error('No documents selected');
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch('/api/documents/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentIds: Array.from(selectedDocuments),
          format: downloadFormat === 'zip' ? 'zip' : 'pdf-combined',
          includeWatermark: watermarkEnabled
        })
      });

      if (!response.ok) {
        throw new Error('Bulk download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents_${Date.now()}.${downloadFormat === 'zip' ? 'zip' : 'pdf'}`;
      a.click();

      toast.success(`${selectedDocuments.size} documents downloaded`);
      setSelectedDocuments(new Set());
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('Failed to bulk download documents');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedDocuments, downloadFormat, watermarkEnabled]);

  /**
   * Handle print
   */
  const handlePrint = useCallback(async (documentId: string) => {
    try {
      const response = await fetch('/api/documents/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId,
          includeWatermark: watermarkEnabled
        })
      });

      if (!response.ok) {
        throw new Error('Print failed');
      }

      const data = await response.json();

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast.success('Print dialog opened');
      onPrint?.(documentId);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to prepare print');
    }
  }, [watermarkEnabled, onPrint]);

  /**
   * Handle share link creation
   */
  const handleShare = useCallback(async (documentId: string) => {
    try {
      const response = await fetch('/api/documents/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId,
          expiryMinutes: 60,
          maxAccess: 5
        })
      });

      if (!response.ok) {
        throw new Error('Share link creation failed');
      }

      const data = await response.json();
      setShareLink(data.link.shareUrl);
      setShowShareDialog(documentId);
      toast.success('Share link created');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to create share link');
    }
  }, []);

  /**
   * Copy share link to clipboard
   */
  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard');
  }, [shareLink]);

  /**
   * Toggle document selection
   */
  const toggleDocumentSelection = (documentId: string) => {
    const updated = new Set(selectedDocuments);
    if (updated.has(documentId)) {
      updated.delete(documentId);
    } else {
      updated.add(documentId);
    }
    setSelectedDocuments(updated);
  };

  const viewerDocument: DocumentViewerDocument | null = viewingDocument
    ? {
        ...viewingDocument,
        uploadedAt: new Date(viewingDocument.uploadedAt)
      }
    : null;

  if (compact && documents.length === 0) {
    return (
      <Card className="p-4 bg-gray-50 text-center">
        <p className="text-gray-600">No documents to download</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Download Format</label>
            <Select value={downloadFormat} onValueChange={(v: any) => setDownloadFormat(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zip">ZIP Archive</SelectItem>
                <SelectItem value="pdf">Combined PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={watermarkEnabled}
                onCheckedChange={(checked) => setWatermarkEnabled(checked as boolean)}
              />
              <span className="text-sm">Add watermark</span>
            </label>
          </div>

          <div className="flex gap-2 items-end">
            <Button
              onClick={handleBulkDownload}
              disabled={selectedDocuments.size === 0 || isDownloading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <DownloadIcon size={18} />
              Download {selectedDocuments.size > 0 ? `(${selectedDocuments.size})` : ''}
            </Button>
          </div>
        </div>
      </Card>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map(doc => (
          <Card key={doc.documentId} className="p-4">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedDocuments.has(doc.documentId)}
                onCheckedChange={() => toggleDocumentSelection(doc.documentId)}
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{doc.fileName}</h3>
                  {doc.verified && (
                    <CheckIcon size={16} className="text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {doc.documentType} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setViewingDocument(doc)}
                  className="flex items-center gap-2"
                >
                  <EyeIcon size={16} /> Preview
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare(doc.documentId)}
                  className="flex items-center gap-2"
                >
                  <ShareIcon size={16} /> Share
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePrint(doc.documentId)}
                  disabled={isLoading.has(doc.documentId)}
                  className="flex items-center gap-2"
                >
                  <PrinterIcon size={16} /> Print
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleDownloadSingle(doc.documentId)}
                  disabled={isLoading.has(doc.documentId)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading.has(doc.documentId) ? (
                    <>
                      <ClockIcon size={16} className="animate-spin" /> Downloading
                    </>
                  ) : (
                    <>
                      <DownloadIcon size={16} /> Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <DocumentViewer
        document={viewerDocument}
        open={!!viewerDocument}
        onOpenChange={(open) => {
          if (!open) {
            setViewingDocument(null);
          }
        }}
        onDownload={(documentId) => {
          handleDownloadSingle(documentId);
          setViewingDocument(null);
        }}
        onPrint={(documentId) => {
          handlePrint(documentId);
          setViewingDocument(null);
        }}
        onShare={(documentId) => {
          handleShare(documentId);
          setViewingDocument(null);
        }}
      />

      {/* Share Link Dialog */}
      <AlertDialog open={!!showShareDialog} onOpenChange={() => setShowShareDialog(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Share Document</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Share this link with others:</p>
              <div className="bg-gray-100 p-3 rounded border break-all text-sm">
                {shareLink}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyShareLink} className="flex-1">
                Copy Link
              </Button>
            </div>
          </AlertDialogDescription>
          <AlertDialogAction onClick={() => setShowShareDialog(null)}>Done</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DocumentDownloadManager;
