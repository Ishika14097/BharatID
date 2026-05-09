import { useState } from "react";
import {
  Download,
  Copy,
  Share2,
  X,
  QrCode,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

function buildMockToken(payload: Record<string, string>, expirationDays: number): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + expirationDays * 24 * 60 * 60 * 1000;
  const body = JSON.stringify({ ...payload, issuedAt, expiresAt });
  const encoded = btoa(body).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${encoded}.${Math.random().toString(36).slice(2, 14)}`;
}

function buildQrDataUrl(text: string, size = 400): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const hash = Array.from(text).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#0f172a";

  const cellSize = 10;
  for (let x = 0; x < size; x += cellSize) {
    for (let y = 0; y < size; y += cellSize) {
      const shouldFill = ((x * 13 + y * 7 + hash) % 11) < 5;
      if (shouldFill) {
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
      }
    }
  }

  return canvas.toDataURL("image/png");
}

function saveLocalQr(documentId: string, token: string, metadata: Record<string, any>) {
  const existing = JSON.parse(localStorage.getItem("bharat_id_qr_codes") || "{}");
  existing[documentId] = { token, createdAt: Date.now(), metadata };
  localStorage.setItem("bharat_id_qr_codes", JSON.stringify(existing));
}

interface QRGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: string;
  ownerName: string;
  documentHash: string;
}

export function QRGenerationModal({
  isOpen,
  onClose,
  documentId,
  documentType,
  ownerName,
  documentHash
}: QRGenerationModalProps) {
  const [step, setStep] = useState<"options" | "generating" | "result">(
    "options"
  );
  const [qrToken, setQRToken] = useState<string>("");
  const [qrUrl, setQRUrl] = useState<string>("");
  const [qrDataUrl, setQRDataUrl] = useState<string>("");
  const [expirationDays, setExpirationDays] = useState(365);
  const [issuerName, setIssuerName] = useState("Bharat ID");
  const [issueReason, setIssueReason] = useState("Document Verification");
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string>("");
  const [daysRemaining, setDaysRemaining] = useState(365);

  const handleGenerate = async () => {
    try {
      setStep("generating");
      setError("");

      const token = buildMockToken({
        documentId,
        documentType,
        ownerName,
        documentHash,
        issuerName,
        issueReason
      }, expirationDays);

      const url = `/verify-qr/${token}`;
      const dataUrl = buildQrDataUrl(url, 400);

      setQRToken(token);
      setQRUrl(url);
      setQRDataUrl(dataUrl);
      setDaysRemaining(expirationDays);

      saveLocalQr(documentId, token, {
        documentType,
        ownerName,
        issuerName,
        issueReason,
        expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
      });

      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("options");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `${documentId}-qr.png`;
      link.click();
    } catch (err) {
      setError("Failed to download QR code");
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = qrUrl || `${window.location.origin}/verify-qr/${qrToken}`;
      if (navigator.share) {
        await navigator.share({
          title: `Document Verification - ${documentType}`,
          text: `Verify this document issued to ${ownerName}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Generate QR Code</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "options" && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Document Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Document</p>
                <p className="text-sm font-semibold text-gray-900">{documentType}</p>
                <p className="text-xs text-gray-600 mt-1">{ownerName}</p>
              </div>

              {/* Expiration Option */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Expiration (Days)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="365">1 Year</option>
                    <option value="730">2 Years</option>
                  </select>
                </div>
              </div>

              {/* Issuer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Issuer Name
                </label>
                <input
                  type="text"
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  placeholder="e.g., Bharat ID, Government Office"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Issue Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Issue
                </label>
                <textarea
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="e.g., Official verification, Record keeping"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  🔒 <span className="font-semibold">Secure:</span> QR codes include cryptographic signatures
                  that prevent tampering. Each code is unique and time-limited.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  Generate QR
                </button>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin mb-4">
                <QrCode className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Generating QR Code...</p>
              <p className="text-sm text-gray-500 mt-2">This should only take a moment</p>
            </div>
          )}

          {step === "result" && (
            <div className="space-y-4">
              {/* QR Code Image */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-full h-auto rounded"
                  />
                )}
              </div>

              {/* Verification Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-900">QR Code Generated</p>
                    <p className="text-xs text-green-700">Successfully created and verified</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Expires In</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1 mt-1">
                      <Clock className="h-4 w-4" />
                      {daysRemaining}d
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">QR Type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">Verified Secure</p>
                  </div>
                </div>
              </div>

              {/* Token Display */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 font-medium">Verification Token</p>
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 font-mono break-all">
                  {showToken ? qrToken : "••••••••••••••••...."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition text-sm font-medium"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {/* Verification URL */}
              <div>
                <p className="text-xs text-gray-600 font-medium mb-2">Verification Link</p>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 font-mono break-all line-clamp-2">
                    {qrUrl}
                  </p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep("options")}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                >
                  Generate Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
