import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Clock, XCircle, CheckCircle2, Building, AlertTriangle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/shared-access")({
  component: SharedAccess,
});

interface AccessLog {
  id: string;
  organization: string;
  document: string;
  status: "active" | "expired" | "revoked";
  sharedOn: string;
  expiresOn?: string;
  purpose: string;
}

const mockAccessLogs: AccessLog[] = [
  {
    id: "1",
    organization: "ICICI Bank",
    document: "PAN Card",
    status: "active",
    sharedOn: "2024-05-08",
    expiresOn: "2024-05-15",
    purpose: "KYC for New Account",
  },
  {
    id: "2",
    organization: "HDFC Life Insurance",
    document: "Aadhaar Card",
    status: "active",
    sharedOn: "2024-05-01",
    expiresOn: "2024-06-01",
    purpose: "Policy Verification",
  },
  {
    id: "3",
    organization: "Visa Processing Center",
    document: "Passport",
    status: "expired",
    sharedOn: "2024-01-10",
    expiresOn: "2024-01-17",
    purpose: "Travel Visa Application",
  },
  {
    id: "4",
    organization: "State Transport Dept",
    document: "Driving License",
    status: "revoked",
    sharedOn: "2024-03-15",
    expiresOn: "2024-03-22",
    purpose: "Traffic Violation Check",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 border border-green-200">
          <CheckCircle2 className="h-3 w-3" /> Active
        </span>
      );
    case "expired":
      return (
        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 border border-gray-200">
          <Clock className="h-3 w-3" /> Expired
        </span>
      );
    case "revoked":
      return (
        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">
          <XCircle className="h-3 w-3" /> Revoked
        </span>
      );
    default:
      return null;
  }
}

function SharedAccess() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-semibold text-foreground">Bharat ID</div>
              <div className="text-xs text-muted-foreground">Access Manager</div>
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
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Shared Access & Consent
            </h1>
            <p className="mt-2 text-muted-foreground">
              Monitor and manage which organizations have access to your identity documents. You can revoke access at any time.
            </p>
          </div>

          {/* Active Shares Overview */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <Shield className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Active Consents</p>
                  <p className="font-display text-2xl font-bold text-green-700">2</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-100 p-3">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900">Expiring Soon</p>
                  <p className="font-display text-2xl font-bold text-amber-700">1</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Building className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Organizations</p>
                  <p className="font-display text-2xl font-bold text-blue-700">4</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="border-b border-border bg-gray-50/50 p-4">
              <h2 className="font-semibold text-foreground">Access History</h2>
            </div>
            <div className="divide-y divide-border">
              {mockAccessLogs.map((log) => (
                <div key={log.id} className="p-4 sm:p-6 transition hover:bg-gray-50/50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-primary/10 p-2">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{log.organization}</h3>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Requested <span className="font-medium text-foreground">{log.document}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Purpose: {log.purpose}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Shared on {log.sharedOn}
                          </span>
                          {log.expiresOn && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Expires on {log.expiresOn}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {log.status === "active" && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => alert(`Access for ${log.organization} revoked successfully.`)}
                          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Revoke Access
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
