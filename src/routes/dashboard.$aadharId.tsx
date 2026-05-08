import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  IdCard,
  CreditCard,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  User,
  LogOut,
  MapPin,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/$aadharId")({
  component: Dashboard,
});

// Mock database
const mockUsers: Record<string, any> = {
  "111122223333": {
    name: "Upasana Roy",
    pan: "ABCDE1234F",
    epic: "VTR9876543",
    passport: "Z1234567",
    isFakeAccountDetected: false,
    constituency: "Kolkata South",
    passportExpiry: "12 Oct 2032"
  },
  "999988887777": {
    name: "Rahul Sharma",
    pan: "WXYZA9876B",
    epic: "VTR1234567",
    passport: "P7654321",
    isFakeAccountDetected: true,
    constituency: "New Delhi",
    passportExpiry: "05 Jan 2028"
  }
};

function Dashboard() {
  const { aadharId } = Route.useParams();
  
  // Clean up input
  const cleanAadhar = aadharId.replace(/\s+/g, "");
  
  // Fetch from mock database or create fallback
  const userData = mockUsers[cleanAadhar] || {
    name: "Citizen User",
    pan: "XXXXX0000X",
    epic: "VTR0000000",
    passport: "A0000000",
    isFakeAccountDetected: false,
    constituency: "Unknown",
    passportExpiry: "DD MMM YYYY"
  };

  const isFakeAccountDetected = userData.isFakeAccountDetected;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gold text-gold-foreground font-display text-sm font-bold">
              ē
            </span>
            <span className="font-display font-semibold tracking-tight text-foreground">EkID</span>
          </a>

          <div className="flex flex-1 items-center justify-end gap-6">
            <div className="relative hidden max-w-md flex-1 sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents or requests..."
                className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                2
              </span>
            </button>
            <div className="flex items-center gap-3 border-l border-border pl-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <User className="h-5 w-5" />
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-medium">{userData.name}</span>
                <span className="text-xs text-muted-foreground">ID: {cleanAadhar.replace(/(.{4})/g, '$1 ').trim()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-semibold">Identity Vault</h1>
            <p className="mt-1 text-muted-foreground">Manage and monitor your government identities securely.</p>
          </div>
          <a href="/login" className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted">
            <LogOut className="h-4 w-4" /> Sign Out
          </a>
        </div>

        {/* Identity Health Section */}
        <div className={`mb-10 rounded-2xl border p-6 shadow-sm ${
            isFakeAccountDetected 
            ? "border-destructive/30 bg-destructive/5" 
            : "border-secondary/30 bg-secondary/5"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isFakeAccountDetected ? "bg-destructive/20 text-destructive" : "bg-secondary/20 text-secondary"
            }`}>
              {isFakeAccountDetected ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <h2 className={`font-display text-lg font-semibold ${isFakeAccountDetected ? "text-destructive" : "text-secondary"}`}>
                {isFakeAccountDetected ? "Suspicious Activity Detected" : "Identity Health: Excellent"}
              </h2>
              <p className="mt-1 text-sm text-foreground/80">
                {isFakeAccountDetected 
                  ? "We detected a potential duplicate or fake account trying to link your PAN card. Please review the details immediately."
                  : "All your linked documents are verified and consistent. No duplicate or fake accounts detected."}
              </p>
              {isFakeAccountDetected && (
                <button className="mt-4 rounded-full bg-destructive px-5 py-2 text-sm font-medium text-destructive-foreground transition hover:brightness-110">
                  Review Security Alert
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Linked Documents</h2>
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            4 Verified
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
          
          {/* Aadhaar Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <IdCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Aadhaar Card</h3>
                  <p className="text-xs text-muted-foreground">Unique Identification Authority of India</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">ID Number</span>
                <span className="font-medium font-mono">{cleanAadhar.replace(/(.{4})/g, '$1 ').trim()}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{userData.name}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  Verified & Linked
                </span>
              </div>
            </div>
          </div>

          {/* PAN Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">PAN Card</h3>
                  <p className="text-xs text-muted-foreground">Income Tax Department</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">PAN Number</span>
                <span className="font-medium font-mono">{userData.pan}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{userData.name}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  Verified & Linked
                </span>
              </div>
            </div>
          </div>

          {/* Voter ID */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <IdCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Voter ID (EPIC)</h3>
                  <p className="text-xs text-muted-foreground">Election Commission of India</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">EPIC No.</span>
                <span className="font-medium font-mono">{userData.epic}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">Constituency</span>
                <span className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3"/> {userData.constituency}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  Verified & Linked
                </span>
              </div>
            </div>
          </div>

          {/* Passport */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Plane className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Passport</h3>
                  <p className="text-xs text-muted-foreground">Ministry of External Affairs</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">Passport No.</span>
                <span className="font-medium font-mono">{userData.passport}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2 text-sm">
                <span className="text-muted-foreground">Expiry</span>
                <span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3"/> {userData.passportExpiry}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                  Verified & Linked
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
