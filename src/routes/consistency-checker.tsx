import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Copy,
  Home,
  History,
  ArrowRight,
} from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/consistency-checker")({
  head: () => ({
    meta: [
      { title: "Identity Consistency Checker — Bharat ID" },
      {
        name: "description",
        content: "Check consistency and detect mismatches across your government IDs.",
      },
    ],
  }),
  component: ConsistencyChecker,
});

// Types
interface DocumentData {
  type: "aadhaar" | "pan" | "passport" | "driving_license";
  name: string;
  dob: string;
  address: string;
  idNumber: string;
  uploadedDate: string;
}

interface Mismatch {
  field: string;
  documents: Array<{
    type: string;
    value: string;
  }>;
  severity: "critical" | "warning" | "info";
  message: string;
}

interface ConsistencyScore {
  overall: number;
  name: number;
  dob: number;
  address: number;
  trend: "improving" | "stable" | "declining";
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  documentsChecked: string[];
  score: number;
  mismatches: number;
}

// Mock data - In production, fetch from database
const mockDocuments: DocumentData[] = [
  {
    type: "aadhaar",
    name: "Rajesh Kumar",
    dob: "15/06/1990",
    address: "123, MG Road, Bangalore, Karnataka 560001",
    idNumber: "1234 5678 9012",
    uploadedDate: "2024-01-15",
  },
  {
    type: "pan",
    name: "Rajesh K.",
    dob: "15/06/1990",
    address: "123 M.G. Road, Bangalore, Karnataka-560001",
    idNumber: "ABCD12345E",
    uploadedDate: "2024-02-20",
  },
  {
    type: "passport",
    name: "Rajesh Kumar Singh",
    dob: "15-06-1990",
    address: "123, MG Road, Bengaluru, Karnataka 560001",
    idNumber: "P1234567",
    uploadedDate: "2024-03-10",
  },
  {
    type: "driving_license",
    name: "Rajesh Kumar",
    dob: "15/06/1990",
    address: "123 MG Road, Bangalore - 560001",
    idNumber: "KA-01-2024-00123",
    uploadedDate: "2024-04-05",
  },
];

// Normalize strings for comparison
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\-\s]+/g, " ")
    .replace(/\b(and|or|the|a|an)\b/g, "")
    .trim();
}

// Calculate string similarity (0-100)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 100;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = getEditDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

// Levenshtein distance for string comparison
function getEditDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// Parse DOB to standard format
function parseDOB(dob: string): string {
  // Handle various formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = dob.match(pattern);
    if (match) {
      let day, month, year;
      if (parseInt(match[1]) > 31) {
        // Likely YYYY format
        year = match[1];
        month = match[2];
        day = match[3];
      } else {
        day = match[1];
        month = match[2];
        year = match[3];
      }
      return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
    }
  }

  return dob;
}

// Detect mismatches
function detectMismatches(docs: DocumentData[]): Mismatch[] {
  const mismatches: Mismatch[] = [];

  // Check name consistency
  const names = docs.map((d) => ({ type: d.type, value: d.name }));
  const nameSimilarities = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      nameSimilarities.push(
        calculateSimilarity(names[i].value, names[j].value)
      );
    }
  }

  if (nameSimilarities.some((s) => s < 85)) {
    mismatches.push({
      field: "name",
      documents: names,
      severity: "warning",
      message: "Name variations detected across documents",
    });
  }

  // Check DOB consistency
  const dobs = docs.map((d) => ({
    type: d.type,
    value: parseDOB(d.dob),
  }));
  const dobVariations = new Set(dobs.map((d) => d.value));
  if (dobVariations.size > 1) {
    mismatches.push({
      field: "dob",
      documents: dobs,
      severity: "critical",
      message: "Date of birth mismatch detected - requires verification",
    });
  }

  // Check address consistency
  const addresses = docs.map((d) => ({ type: d.type, value: d.address }));
  const addressSimilarities = [];
  for (let i = 0; i < addresses.length; i++) {
    for (let j = i + 1; j < addresses.length; j++) {
      addressSimilarities.push(
        calculateSimilarity(addresses[i].value, addresses[j].value)
      );
    }
  }

  if (addressSimilarities.some((s) => s < 80)) {
    mismatches.push({
      field: "address",
      documents: addresses,
      severity: "warning",
      message: "Address differences detected - may require correction",
    });
  }

  return mismatches;
}

// Calculate consistency score
function calculateConsistencyScore(docs: DocumentData[]): ConsistencyScore {
  const mismatches = detectMismatches(docs);

  // Calculate field scores
  const nameScore =
    100 -
    (mismatches.find((m) => m.field === "name")
      ? mismatches.find((m) => m.field === "name")?.severity === "critical"
        ? 50
        : 25
      : 0);

  const dobScore =
    100 -
    (mismatches.find((m) => m.field === "dob")
      ? mismatches.find((m) => m.field === "dob")?.severity === "critical"
        ? 50
        : 25
      : 0);

  const addressScore =
    100 -
    (mismatches.find((m) => m.field === "address")
      ? mismatches.find((m) => m.field === "address")?.severity === "critical"
        ? 50
        : 25
      : 0);

  const overall = Math.round((nameScore + dobScore + addressScore) / 3);

  return {
    overall,
    name: nameScore,
    dob: dobScore,
    address: addressScore,
    trend: "stable",
  };
}

// Generate AI suggestions
function generateAISuggestions(
  mismatches: Mismatch[],
  score: ConsistencyScore
): string[] {
  const suggestions: string[] = [];

  if (score.overall < 60) {
    suggestions.push(
      "⚠️ Low consistency score detected. Please review and correct mismatches immediately."
    );
  }

  mismatches.forEach((mismatch) => {
    if (mismatch.field === "name") {
      if (mismatch.severity === "critical") {
        suggestions.push(
          "🔴 Critical: Name significantly differs across documents. Contact issuing authorities for correction."
        );
      } else {
        suggestions.push(
          "📝 Suggestion: Use the most common name variation (Rajesh Kumar) as primary name."
        );
        suggestions.push(
          "💡 Tip: Update Passport and PAN to reflect the consistent name format."
        );
      }
    }

    if (mismatch.field === "dob") {
      suggestions.push(
        "🔴 URGENT: Date of birth mismatch is critical. Verify with original documents and contact authorities."
      );
      suggestions.push(
        "📋 Action: Obtain certified copies and file correction affidavits if needed."
      );
    }

    if (mismatch.field === "address") {
      suggestions.push(
        "✏️ Address format varies (abbreviated vs. full). This is common and typically not critical."
      );
      suggestions.push(
        "🏠 Recommendation: Update older documents to match current address in Aadhaar."
      );
    }
  });

  if (mismatches.length === 0) {
    suggestions.push(
      "✅ Perfect! All documents are consistent. Your identity vault is verified and ready to use."
    );
  }

  return suggestions;
}

// Get document display name
function getDocumentName(type: string): string {
  const names: Record<string, string> = {
    aadhaar: "Aadhaar",
    pan: "PAN Card",
    passport: "Passport",
    driving_license: "Driving License",
  };
  return names[type] || type;
}

function ConsistencyChecker() {
  const [selectedDocs, setSelectedDocs] = useState<string[]>(
    mockDocuments.map((d) => d.type)
  );
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Calculate scores and mismatches
  const docsToCheck = mockDocuments.filter((d) => selectedDocs.includes(d.type));
  const mismatches = useMemo(
    () => detectMismatches(docsToCheck),
    [selectedDocs]
  );
  const score = useMemo(() => calculateConsistencyScore(docsToCheck), [selectedDocs]);
  const suggestions = useMemo(
    () => generateAISuggestions(mismatches, score),
    [mismatches, score]
  );

  const toggleDocument = (type: string) => {
    setSelectedDocs((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const saveToHistory = () => {
    const entry: HistoryEntry = {
      id: `check_${Date.now()}`,
      timestamp: new Date(),
      documentsChecked: selectedDocs,
      score: score.overall,
      mismatches: mismatches.length,
    };
    setHistory((prev) => [entry, ...prev]);
  };

  const getScoreColor = (s: number) => {
    if (s >= 85) return "text-green-600 bg-green-50";
    if (s >= 70) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreBgColor = (s: number) => {
    if (s >= 85) return "bg-green-100";
    if (s >= 70) return "bg-amber-100";
    return "bg-red-100";
  };

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
              <div className="font-display font-semibold text-foreground">
                Identity Consistency
              </div>
              <div className="text-xs text-muted-foreground">Verification Checker</div>
            </div>
          </div>
          <a
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </a>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Identity Consistency Checker
            </h1>
            <p className="mt-2 text-muted-foreground">
              Compare your government documents and detect inconsistencies
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Document Selection & Score */}
            <div className="lg:col-span-1 space-y-6">
              {/* Consistency Score Card */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-display font-bold text-foreground">
                  Overall Score
                </h2>
                <div className={`rounded-lg p-8 text-center ${getScoreBgColor(score.overall)}`}>
                  <div className={`font-display text-5xl font-bold ${getScoreColor(score.overall)}`}>
                    {score.overall}%
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {score.overall >= 85
                      ? "Excellent"
                      : score.overall >= 70
                        ? "Good"
                        : "Needs Review"}
                  </p>
                </div>

                {/* Field Scores */}
                <div className="mt-6 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Name</span>
                      <span className="text-xs font-semibold text-foreground">
                        {score.name}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          score.name >= 85 ? "bg-green-500" : score.name >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score.name}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Date of Birth</span>
                      <span className="text-xs font-semibold text-foreground">
                        {score.dob}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          score.dob >= 85 ? "bg-green-500" : score.dob >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score.dob}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Address</span>
                      <span className="text-xs font-semibold text-foreground">
                        {score.address}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          score.address >= 85 ? "bg-green-500" : score.address >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score.address}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveToHistory}
                  className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Save Check to History
                </button>
              </div>

              {/* Document Selection */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-display font-bold text-foreground">
                  Select Documents
                </h2>
                <div className="space-y-2">
                  {mockDocuments.map((doc) => (
                    <label key={doc.type} className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc.type)}
                        onChange={() => toggleDocument(doc.type)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {getDocumentName(doc.type)}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* History Toggle */}
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
                >
                  <History className="h-4 w-4" />
                  View History ({history.length})
                </button>
              )}
            </div>

            {/* Right Column - Mismatches & Suggestions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mismatches Section */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h2 className="font-display font-bold text-foreground">
                    Detected Issues
                  </h2>
                  <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {mismatches.length} found
                  </span>
                </div>

                {mismatches.length === 0 ? (
                  <div className="rounded-lg bg-green-50 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900">All Clear!</h3>
                      <p className="text-sm text-green-800 mt-1">
                        No inconsistencies detected across selected documents.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mismatches.map((mismatch, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border-l-4 p-4 ${
                          mismatch.severity === "critical"
                            ? "border-l-red-500 bg-red-50"
                            : mismatch.severity === "warning"
                              ? "border-l-amber-500 bg-amber-50"
                              : "border-l-blue-500 bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {mismatch.severity === "critical" ? (
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground capitalize">
                              {mismatch.field} Mismatch
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {mismatch.message}
                            </p>
                            <div className="mt-3 space-y-1">
                              {mismatch.documents.map((doc, didx) => (
                                <div key={didx} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium text-foreground min-w-24">
                                    {getDocumentName(doc.type)}:
                                  </span>
                                  <span className="text-muted-foreground break-all">
                                    {doc.value}
                                  </span>
                                  <Copy className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Suggestions Section */}
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h2 className="font-display font-bold text-foreground">
                    AI Suggestions
                  </h2>
                </div>

                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {suggestion.startsWith("✅") ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : suggestion.startsWith("🔴") ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : suggestion.startsWith("⚠️") ? (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        ) : (
                          <Zap className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-foreground">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              {mismatches.length > 0 && (
                <div className="rounded-xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h2 className="font-display font-bold text-foreground">
                      Next Steps
                    </h2>
                  </div>

                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 font-bold text-blue-600">1</span>
                      <span className="text-foreground">
                        Review all mismatches listed above
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 font-bold text-blue-600">2</span>
                      <span className="text-foreground">
                        Check original documents for accuracy
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 font-bold text-blue-600">3</span>
                      <span className="text-foreground">
                        For critical mismatches, contact respective authorities
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 font-bold text-blue-600">4</span>
                      <span className="text-foreground">
                        Update documents as needed and re-check consistency
                      </span>
                    </li>
                  </ol>

                  <button className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                    <ArrowRight className="h-4 w-4" />
                    Contact Authorities
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* History Modal */}
          {showHistory && history.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Check History
                  </h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Score: {entry.score}% • {entry.mismatches} mismatch
                          {entry.mismatches !== 1 ? "es" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.documentsChecked.map((d) => getDocumentName(d)).join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <button className="rounded-lg px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
