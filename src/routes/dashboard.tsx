import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  Share2,
  Zap,
  Bell,
  LogOut,
  Menu,
  X,
  Calendar,
  Eye,
  Download,
  Plus,
  TrendingUp,
  Shield,
  Home,
  LogIn,
  AlertTriangle,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { QRGenerationModal } from "@/components/qr-generation-modal";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { DocumentViewer, type DocumentViewerDocument } from "@/components/document-viewer";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Bharat ID" },
      {
        name: "description",
        content: "Manage your verified government IDs in one secure vault.",
      },
    ],
  }),
  component: Dashboard,
});

interface Document {
  id: string;
  name: string;
  type: "aadhaar" | "pan" | "passport" | "driving_license" | "voter_id";
  status: "verified" | "expiring_soon" | "missing" | "expired";
  expiryDate?: string;
  verifiedDate?: string;
  number?: string;
  format?: "pdf" | "jpg" | "png";
  fileSize?: number;
  uploadedAt?: string;
  accessLevel?: "public" | "private" | "restricted";
}

interface Notification {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  message: string;
  timestamp: string;
}

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  description: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Aadhaar",
    type: "aadhaar",
    status: "verified",
    number: "XXXX XXXX 1234",
    verifiedDate: "2024-01-15",
  },
  {
    id: "2",
    name: "PAN Card",
    type: "pan",
    status: "verified",
    number: "ABCD12345E",
    verifiedDate: "2024-02-20",
  },
  {
    id: "3",
    name: "Passport",
    type: "passport",
    status: "expiring_soon",
    expiryDate: "2026-08-15",
    number: "P1234567",
  },
  {
    id: "4",
    name: "Driving License",
    type: "driving_license",
    status: "verified",
    expiryDate: "2028-06-30",
    number: "DL-2024-00123",
  },
  {
    id: "5",
    name: "Voter ID",
    type: "voter_id",
    status: "missing",
    number: "Not uploaded",
  },
];

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    title: "Passport Expiring Soon",
    message: "Your passport will expire in 3 months. Consider renewing it.",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    type: "success",
    title: "PAN Verified",
    message: "Your PAN card has been verified and linked successfully.",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    type: "info",
    title: "New Feature",
    message: "Unified address update is now available for all documents.",
    timestamp: "3 days ago",
  },
];

const mockActivity: Activity[] = [
  {
    id: "1",
    action: "Document Shared",
    timestamp: "2 hours ago",
    description: "You shared verified facts with ICICI Bank",
  },
  {
    id: "2",
    action: "Document Verified",
    timestamp: "Yesterday",
    description: "Your PAN Card was verified",
  },
  {
    id: "3",
    action: "Document Uploaded",
    timestamp: "3 days ago",
    description: "Driving License uploaded and verified",
  },
  {
    id: "4",
    action: "Address Updated",
    timestamp: "1 week ago",
    description: "Address synced to Aadhaar and linked documents",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "bg-green-50 border-green-200 text-green-700";
    case "expiring_soon":
      return "bg-amber-50 border-amber-200 text-amber-700";
    case "missing":
      return "bg-red-50 border-red-200 text-red-700";
    default:
      return "bg-gray-50 border-gray-200 text-gray-700";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "expiring_soon":
      return <AlertCircle className="h-5 w-5 text-amber-600" />;
    case "missing":
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "verified":
      return "Verified";
    case "expiring_soon":
      return "Expiring Soon";
    case "missing":
      return "Missing";
    default:
      return "Pending";
  }
}

function calculateHealthScore() {
  const verified = mockDocuments.filter((d) => d.status === "verified").length;
  const total = mockDocuments.length;
  return Math.round((verified / total) * 100);
}

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [qrModalOpen, setQRModalOpen] = useState(false);
  const [selectedDocForQR, setSelectedDocForQR] = useState<Document | null>(null);
  const healthScore = calculateHealthScore();

  const viewerDoc: DocumentViewerDocument | null = viewingDoc ? {
    documentId: viewingDoc.id,
    fileName: viewingDoc.name,
    documentType: viewingDoc.type === "voter_id" ? "kyc" : viewingDoc.type as any,
    format: viewingDoc.format || "pdf",
    fileSize: viewingDoc.fileSize || 1024 * 1024 * 1.5,
    uploadedAt: new Date(viewingDoc.uploadedAt || viewingDoc.verifiedDate || Date.now()),
    verified: viewingDoc.status === "verified",
    accessLevel: viewingDoc.accessLevel || "private",
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">भ</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-semibold text-foreground">Bharat ID</div>
              <div className="text-xs text-muted-foreground">My Dashboard</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <button className="hidden rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent md:block">
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-[60px] left-0 w-64 border-r border-border bg-white transition-transform md:sticky md:inset-y-16 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="space-y-2 p-4">
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-primary"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </a>
            <Link
              to="/upload"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              My Documents
            </Link>
            <Link
              to="/shared-access"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              <Share2 className="h-4 w-4" />
              Shared Access
            </Link>
            <Link
              to="/consistency-checker"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              <AlertTriangle className="h-4 w-4" />
              Consistency Checker
            </Link>
            <Link
              to="/security"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              <Shield className="h-4 w-4" />
              Security Settings
            </Link>
            <a
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              <LogIn className="h-4 w-4" />
              Back to Home
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-4 md:p-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground">
                Welcome, Citizen
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage and verify all your government IDs in one secure place
              </p>
            </div>

            {/* Health Score & Quick Stats */}
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              {/* Identity Health Score */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Identity Health Score
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold text-primary">
                        {healthScore}%
                      </span>
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Good
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-gradient-to-br from-green-100 to-green-50 p-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${healthScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Documents Summary */}
              <div 
                onClick={() => document.getElementById('documents')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-xl border border-border bg-white p-6 shadow-sm cursor-pointer transition hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Documents
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold text-foreground">
                        {mockDocuments.filter((d) => d.status === "verified").length}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {mockDocuments.length}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-blue-100 p-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {mockDocuments.filter((d) => d.status === "verified").length} verified
                </p>
              </div>

              {/* Expiring Soon */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Attention Needed
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-bold text-amber-600">
                        {mockDocuments.filter((d) => d.status !== "verified" && d.status !== "expired").length}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full bg-amber-100 p-4">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {mockDocuments.filter((d) => d.status === "expiring_soon").length} expiring soon, {mockDocuments.filter((d) => d.status === "missing").length} missing
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                Quick Actions
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                <Link
                  to="/upload"
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-3 font-medium text-primary transition hover:bg-primary/10"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Link>
                <button
                  onClick={() => {
                    const aadhaarDoc = mockDocuments.find((d) => d.type === "aadhaar") || mockDocuments[0];
                    setSelectedDocForQR(aadhaarDoc);
                    setQRModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-3 font-medium text-primary transition hover:bg-primary/10"
                >
                  <Share2 className="h-4 w-4" />
                  Share QR Code
                </button>
                <Link
                  to="/autofill"
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-3 font-medium text-primary transition hover:bg-primary/10"
                >
                  <Zap className="h-4 w-4" />
                  Autofill Form
                </Link>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Documents Section */}
              <div id="documents" className="lg:col-span-2 scroll-mt-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Your Documents
                  </h2>
                  <Link
                    to="/upload"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Document
                  </Link>
                </div>
                <div className="grid gap-4">
                  {mockDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between rounded-xl border-2 p-4 transition ${getStatusColor(doc.status)} cursor-pointer hover:shadow-md`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/50">
                          {getStatusIcon(doc.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{doc.name}</h3>
                          <p className="text-xs opacity-75">
                            {doc.number || "Not provided"}
                          </p>
                          {doc.expiryDate && (
                            <p className="mt-1 text-xs opacity-75">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden rounded-full bg-white/50 px-3 py-1 text-xs font-medium sm:inline">
                          {getStatusLabel(doc.status)}
                        </span>
                        {doc.status === "verified" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocForQR(doc);
                              setQRModalOpen(true);
                            }}
                            className="rounded-lg bg-white/50 p-2 transition hover:bg-blue-100 hover:text-blue-600 text-gray-700"
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (doc.status !== "missing") setViewingDoc(doc);
                            else toast.error("Document missing. Please upload it first.");
                          }}
                          className={`rounded-lg p-2 transition ${doc.status === "missing" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white/50 hover:bg-white text-gray-700"}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications Panel */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-display font-bold text-foreground">
                  Notifications
                </h2>
                <div className="space-y-4">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`rounded-lg border-l-4 p-4 ${
                        notif.type === "warning"
                          ? "border-l-amber-500 bg-amber-50"
                          : notif.type === "success"
                            ? "border-l-green-500 bg-green-50"
                            : "border-l-blue-500 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-full p-1 ${
                            notif.type === "warning"
                              ? "bg-amber-100"
                              : notif.type === "success"
                                ? "bg-green-100"
                                : "bg-blue-100"
                          }`}
                        >
                          {notif.type === "warning" && (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                          )}
                          {notif.type === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {notif.type === "info" && (
                            <Bell className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">
                            {notif.title}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {notif.message}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground/60">
                            {notif.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                  View All Notifications
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="mt-8 rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-6 font-display text-xl font-bold text-foreground">
                Recent Activity
              </h2>
              <div className="space-y-6">
                {mockActivity.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-4">
                    {index !== mockActivity.length - 1 && (
                      <div className="absolute left-6 top-12 h-8 w-0.5 bg-border"></div>
                    )}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-white">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-foreground">
                        {activity.action}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* QR Generation Modal */}
      {selectedDocForQR && (
        <QRGenerationModal
          isOpen={qrModalOpen}
          onClose={() => {
            setQRModalOpen(false);
            setSelectedDocForQR(null);
          }}
          documentId={selectedDocForQR.id}
          documentType={selectedDocForQR.type}
          ownerName="Rajesh Kumar"
          documentHash="sha256_placeholder_hash_0123456789abcdef"
        />
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">
                {selectedDoc.name}
              </h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  {getStatusIcon(selectedDoc.status)}
                  <span className="font-medium text-foreground">
                    {getStatusLabel(selectedDoc.status)}
                  </span>
                </div>
              </div>

              {selectedDoc.number && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Document Number
                  </p>
                  <p className="mt-2 font-mono font-medium text-foreground">
                    {selectedDoc.number}
                  </p>
                </div>
              )}

              {selectedDoc.expiryDate && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Expiry Date
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    {new Date(selectedDoc.expiryDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {selectedDoc.verifiedDate && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Verified On
                  </p>
                  <p className="mt-2 font-medium text-foreground">
                    {new Date(selectedDoc.verifiedDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {selectedDoc.status === "missing" ? (
                <Link
                  to="/upload"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Link>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      toast.success(`${selectedDoc.name} download started!`);
                      setSelectedDoc(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border py-2 font-medium text-foreground transition hover:bg-accent"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDocForQR(selectedDoc);
                      setQRModalOpen(true);
                      setSelectedDoc(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewerDoc}
        open={!!viewingDoc}
        onOpenChange={(open) => !open && setViewingDoc(null)}
        onDownload={(id) => {
          toast.success("Document download started!");
          setViewingDoc(null);
        }}
        onPrint={(id) => {
          toast.success("Preparing document for print...");
          setViewingDoc(null);
        }}
        onShare={(id) => {
          setSelectedDocForQR(viewingDoc);
          setQRModalOpen(true);
          setViewingDoc(null);
        }}
      />

      {/* AI Assistant Chatbot */}
      <ChatbotWidget />
    </div>
  );
}
