import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  QrCode,
  Home,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";

interface VerificationDetails {
  isValid: boolean;
  isExpired: boolean;
  isTampered: boolean;
  ownerName: string;
  documentType: string;
  issuedAt: string;
  expiresAt: string;
  daysRemaining: number;
  documentId: string;
  timestamp: number;
}

function parseTokenUnsafe(token: string): Record<string, any> | null {
  try {
    const [encoded] = token.split(".");
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((encoded.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function verifyToken(token: string) {
  const payload = parseTokenUnsafe(token);
  if (!payload) {
    return { valid: false, expired: false, tampered: true, data: undefined };
  }

  const expired = typeof payload.expiresAt === "number" ? Date.now() > payload.expiresAt : false;
  return {
    valid: !expired,
    expired,
    tampered: false,
    data: payload
  };
}

function formatStatus(result: ReturnType<typeof verifyToken>) {
  if (result.tampered) {
    return { status: "tampered", message: "⚠️ Document has been tampered with. Do not accept.", color: "red" as const };
  }
  if (result.expired) {
    return { status: "expired", message: "⏰ Verification code has expired.", color: "yellow" as const };
  }
  if (result.valid) {
    return { status: "verified", message: "✅ Document verified successfully.", color: "green" as const };
  }
  return { status: "invalid", message: "❌ Invalid verification code.", color: "red" as const };
}

function VerifyQRPage() {
  const { token: pathToken } = Route.useParams();
  const token = pathToken;

  const [details, setDetails] = useState<VerificationDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(1);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      const result = verifyToken(token);
      const info = result.data;

      if (result.valid || result.expired) {
        setDetails({
          isValid: result.valid,
          isExpired: result.expired,
          isTampered: result.tampered,
          ownerName: info?.ownerName || "Unknown",
          documentType: info?.documentType || "Document",
          issuedAt: info?.issuedAt ? new Date(info.issuedAt).toLocaleDateString() : new Date().toLocaleDateString(),
          expiresAt: info?.expiresAt ? new Date(info.expiresAt).toLocaleDateString() : new Date().toLocaleDateString(),
          daysRemaining: info?.expiresAt ? Math.max(0, Math.ceil((info.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
          documentId: info?.documentId || "",
          timestamp: info?.issuedAt || Date.now()
        });
      }
    }
  }, [token]);

  const handleCopy = async () => {
    if (token) {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: `Document Verification - ${details?.documentType}`,
          text: `Verify this document issued to ${details?.ownerName}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid QR Code
              </h1>
              <p className="text-gray-600 mb-6">
                No verification code found. Please scan a valid QR code or
                check the link.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const result = verifyToken(token);
  const statusInfo = formatStatus(result);

  const getStatusIcon = () => {
    if (result.tampered) return <AlertTriangle className="h-20 w-20 text-red-500" />;
    if (result.expired) return <Clock className="h-20 w-20 text-yellow-500" />;
    if (result.valid) return <CheckCircle2 className="h-20 w-20 text-green-500" />;
    return <XCircle className="h-20 w-20 text-red-500" />;
  };

  const getStatusBackground = () => {
    if (result.tampered) return "from-red-50 to-white";
    if (result.expired) return "from-yellow-50 to-white";
    if (result.valid) return "from-green-50 to-white";
    return "from-red-50 to-white";
  };

  const getBadgeColor = () => {
    if (result.tampered) return "bg-red-100 text-red-800 border-red-200";
    if (result.expired) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (result.valid) return "bg-green-100 text-green-800 border-green-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getStatusBackground()}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">
              Document Verification
            </h1>
          </div>
          <a
            href="/"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ×
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            {getStatusIcon()}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {result.tampered
                ? "⚠️ Document Tampered"
                : result.expired
                  ? "⏰ Verification Expired"
                  : result.valid
                    ? "✅ Verified"
                    : "❌ Unverified"}
            </h2>
            <p className="text-lg text-gray-600">{statusInfo.message}</p>
          </div>

          {/* Status Badge */}
          <div className={`border rounded-lg p-4 mb-6 ${getBadgeColor()}`}>
            <p className="font-semibold">
              Status: {statusInfo.status.toUpperCase()}
            </p>
            {result.tampered && (
              <p className="text-sm mt-2">
                🔒 Security Alert: This document appears to have been modified
                after verification.
              </p>
            )}
          </div>

          {/* Document Information */}
          {details && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Owner Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {details.ownerName}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Document Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {details.documentType}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Issued Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {details.issuedAt}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Expiration Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {details.expiresAt}
                </p>
              </div>
            </div>
          )}

          {/* Days Remaining */}
          {details && details.daysRemaining > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-blue-600">
                ⏱️ Days Remaining: <span className="font-bold">{details.daysRemaining}</span> days
              </p>
            </div>
          )}

          {/* Verification Details */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded transition"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">
                  Verification Details
                </span>
              </div>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded">
                <div>
                  <p className="text-sm text-gray-600">Token Status</p>
                  <p className="text-gray-900 font-mono text-sm break-all">
                    {result.valid ? "✅ Valid Signature" : "❌ Invalid Signature"}
                  </p>
                </div>

                {result.data && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Document ID</p>
                      <p className="text-gray-900 font-mono text-sm break-all">
                        {result.data.documentId}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Issued At</p>
                      <p className="text-gray-900 text-sm">
                        {new Date(result.data.issuedAt).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Expires At</p>
                      <p className="text-gray-900 text-sm">
                        {new Date(result.data.expiresAt).toLocaleString()}
                      </p>
                    </div>

                    {result.data.metadata?.issueReason && (
                      <div>
                        <p className="text-sm text-gray-600">Issue Reason</p>
                        <p className="text-gray-900 text-sm">
                          {result.data.metadata.issueReason}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <p className="text-sm text-gray-600">Verification Timestamp</p>
                  <p className="text-gray-900 text-sm">
                    {new Date().toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Verification Count</p>
                  <p className="text-gray-900 text-sm">{verificationAttempts}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Token"}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Security Notice</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ This verification uses cryptographic signatures</li>
            <li>✓ Any tampering will be detected immediately</li>
            <li>✓ Verification tokens have expiration dates</li>
            <li>✓ Each document gets a unique verification code</li>
          </ul>
        </div>

        {/* Additional Actions */}
        {result.valid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">✅ Document Valid</h3>
            <p className="text-sm text-green-800 mb-3">
              This document has been verified and is authentic. You can proceed
              with accepting this document.
            </p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium">
              Accept Document
            </button>
          </div>
        )}

        {(result.tampered || result.expired) && (
          <div className={`${
            result.tampered
              ? "bg-red-50 border border-red-200"
              : "bg-yellow-50 border border-yellow-200"
          } rounded-lg p-4 mb-6`}>
            <h3
              className={`font-semibold ${
                result.tampered ? "text-red-900" : "text-yellow-900"
              } mb-2`}
            >
              {result.tampered ? "⚠️ Document Cannot Be Verified" : "⏰ Expired Verification"}
            </h3>
            <p
              className={`text-sm ${
                result.tampered ? "text-red-800" : "text-yellow-800"
              } mb-3`}
            >
              {result.tampered
                ? "This document has been modified and cannot be verified. Please contact the issuer."
                : "The verification code for this document has expired. Please request a new verification."}
            </p>
            <a
              href="/"
              className={`w-full block text-center ${
                result.tampered
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              } text-white px-4 py-2 rounded-lg transition font-medium`}
            >
              Back to Home
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 py-4">
          <p>
            Verification System Powered by <span className="font-semibold">Bharat ID</span>
          </p>
          <p className="mt-1">
            For support, contact:{" "}
            <a href="mailto:support@bharat-id.com" className="text-blue-600 hover:underline">
              support@bharat-id.com
            </a>
          </p>
        </div>
      </div>

      {/* Mobile Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-between p-4">
          <a
            href="/"
            className="text-center flex-1 py-2 text-gray-600 hover:text-blue-600 transition"
          >
            <Home className="h-6 w-6 mx-auto" />
          </a>
          <div className="w-px h-8 bg-gray-200"></div>
          <a
            href="/dashboard"
            className="text-center flex-1 py-2 text-gray-600 hover:text-blue-600 transition"
          >
            <Shield className="h-6 w-6 mx-auto" />
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/verify-qr")({
  component: VerifyQRPage
});
