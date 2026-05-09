import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { DocumentDownloadManager, type Document } from "@/components/document-download-manager";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
});

const mockDocs: Document[] = [
  {
    documentId: "1",
    fileName: "Aadhaar Card",
    documentType: "aadhaar",
    format: "pdf",
    fileSize: 1024 * 1024 * 2.5,
    uploadedAt: new Date("2024-01-14T10:00:00Z"),
    verified: true,
    accessLevel: "private"
  },
  {
    documentId: "2",
    fileName: "PAN Card",
    documentType: "pan",
    format: "pdf",
    fileSize: 1024 * 1024 * 1.8,
    uploadedAt: new Date("2024-02-18T14:30:00Z"),
    verified: true,
    accessLevel: "private"
  },
  {
    documentId: "3",
    fileName: "Driving License",
    documentType: "driving_license",
    format: "jpg",
    fileSize: 1024 * 500 * 1.2,
    uploadedAt: new Date("2024-03-10T09:15:00Z"),
    verified: true,
    accessLevel: "public"
  }
];

function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-semibold text-foreground">Bharat ID</div>
              <div className="text-xs text-muted-foreground">My Documents</div>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Document Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                View, download, print, and share your verified documents securely.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <DocumentDownloadManager 
              userId="user-123" 
              documents={mockDocs} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
