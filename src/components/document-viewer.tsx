import { useMemo } from 'react';
import { DownloadIcon, PrinterIcon, ShareIcon, XIcon, ShieldCheckIcon, FileTextIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface DocumentViewerDocument {
  documentId: string;
  fileName: string;
  documentType: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'kyc' | 'other';
  format: 'pdf' | 'jpg' | 'png';
  fileSize: number;
  uploadedAt: Date;
  verified: boolean;
  accessLevel: 'public' | 'private' | 'restricted';
}

export interface DocumentViewerProps {
  document: DocumentViewerDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (documentId: string) => void;
  onPrint: (documentId: string) => void;
  onShare: (documentId: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, unitIndex);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function getDocumentTypeLabel(documentType: DocumentViewerDocument['documentType']): string {
  const labels: Record<DocumentViewerDocument['documentType'], string> = {
    aadhaar: 'Aadhaar',
    pan: 'PAN Card',
    passport: 'Passport',
    driving_license: 'Driving License',
    kyc: 'KYC Record',
    other: 'Document'
  };

  return labels[documentType];
}

export function DocumentViewer({
  document,
  open,
  onOpenChange,
  onDownload,
  onPrint,
  onShare
}: DocumentViewerProps) {
  const verifiedLabel = useMemo(() => (document?.verified ? 'Verified copy' : 'Unverified copy'), [document]);

  if (!document) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{document.fileName}</DialogTitle>
          <DialogDescription>
            Preview, print, download, or share this document.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="flex flex-col bg-slate-950 text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/60">
                  <ShieldCheckIcon className="h-4 w-4" />
                  {verifiedLabel}
                </div>
                <h2 className="truncate text-xl font-semibold">{document.fileName}</h2>
                <p className="mt-1 text-sm text-white/60">
                  {getDocumentTypeLabel(document.documentType)} · {document.format.toUpperCase()} · {formatFileSize(document.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),rgba(2,6,23,0)_60%)] p-6">
              <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-sm">
                <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
                    <div className="flex items-center gap-3 text-white/80">
                      <FileTextIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Document Preview</span>
                    </div>
                    <div className="mt-8 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-8 text-center">
                      <div>
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/15 text-4xl">
                          📄
                        </div>
                        <p className="mt-5 text-lg font-semibold">Secure preview unavailable</p>
                        <p className="mt-2 text-sm leading-6 text-white/65">
                          This viewer shows document metadata and available actions. The actual file is delivered only through the protected download flow.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-white/50">Status</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${document.verified ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {document.verified ? 'Verified' : 'Pending review'}
                        </span>
                        <span className="text-xs text-white/55">{document.accessLevel} access</span>
                      </div>
                    </div>

                    <Card className="border-white/10 bg-white/95 p-5 text-slate-900 shadow-none">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Document ID</p>
                          <p className="mt-1 break-all text-sm font-medium text-slate-900">{document.documentId}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Uploaded</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{new Date(document.uploadedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Format</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{document.format.toUpperCase()}</p>
                        </div>
                      </div>
                    </Card>

                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" onClick={() => onShare(document.documentId)} className="h-auto flex-col gap-1 py-4">
                        <ShareIcon className="h-4 w-4" />
                        <span className="text-xs">Share</span>
                      </Button>
                      <Button variant="outline" onClick={() => onPrint(document.documentId)} className="h-auto flex-col gap-1 py-4">
                        <PrinterIcon className="h-4 w-4" />
                        <span className="text-xs">Print</span>
                      </Button>
                      <Button onClick={() => onDownload(document.documentId)} className="h-auto flex-col gap-1 bg-blue-600 py-4 hover:bg-blue-700">
                        <DownloadIcon className="h-4 w-4" />
                        <span className="text-xs">Download</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Document details</h3>
                <p className="text-sm text-slate-500">Actions and metadata</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Security</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>• Download is routed through the authenticated API.</li>
                  <li>• Print generates a protected HTML preview.</li>
                  <li>• Share creates a temporary secure link.</li>
                </ul>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{document.fileName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Document Type</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{getDocumentTypeLabel(document.documentType)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access Level</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{document.accessLevel}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 text-slate-100">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tip</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Use the download button for the server-generated file, or print if you need a watermark-enabled verified copy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
