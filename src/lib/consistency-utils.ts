// Consistency checker utilities
// Can be used across different components and backend

export interface DocumentFields {
  name: string;
  dob: string;
  address: string;
  idNumber: string;
}

export interface ConsistencyResult {
  score: number;
  nameScore: number;
  dobScore: number;
  addressScore: number;
  mismatches: MismatchDetail[];
  suggestions: string[];
}

export interface MismatchDetail {
  field: "name" | "dob" | "address";
  type: "critical" | "warning" | "info";
  description: string;
  values: Record<string, string>;
}

export interface ConsistencyHistoryEntry {
  id: string;
  timestamp: number;
  score: number;
  documentCount: number;
  mismatchCount: number;
  documentTypes: string[];
  result: ConsistencyResult;
}

// Normalize strings for comparison
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,\-—–\s]+/g, " ")
    .replace(/\b(and|or|the|a|an|mr|mrs|ms|dr|prof|jr|sr)\b/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

// Levenshtein distance algorithm
export function getEditDistance(s1: string, s2: string): number {
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

// Calculate string similarity (0-100)
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 100;
  if (s1.length === 0 && s2.length === 0) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const editDistance = getEditDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

// Parse DOB to standard format
export function parseDateOfBirth(dob: string): string {
  // Match various date formats
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(dob);
    if (match) {
      let day, month, year;

      if (parseInt(match[1]) > 31) {
        // YYYY format
        year = match[1];
        month = match[2];
        day = match[3];
      } else {
        // DD/MM/YYYY format
        day = match[1];
        month = match[2];
        year = match[3];
      }

      return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
    }
  }

  return dob;
}

// Check if address contains location keywords
export function extractAddressComponents(address: string): {
  street: string;
  city: string;
  state: string;
  pincode: string;
} {
  const parts = {
    street: "",
    city: "",
    state: "",
    pincode: "",
  };

  // Extract pincode (6 digits for India)
  const pincodeMatch = address.match(/\b(\d{6})\b/);
  if (pincodeMatch) {
    parts.pincode = pincodeMatch[1];
  }

  // Extract state (common Indian states)
  const states = [
    "karnataka",
    "maharashtra",
    "delhi",
    "tamil nadu",
    "bengal",
    "punjab",
    "uttar pradesh",
    "rajasthan",
    "telangana",
    "andhra pradesh",
    "gujarat",
    "haryana",
  ];
  const addressLower = address.toLowerCase();
  for (const state of states) {
    if (addressLower.includes(state)) {
      parts.state = state;
      break;
    }
  }

  // Remove pincode and state from address for street extraction
  let streetAddress = address
    .replace(pincodeMatch ? pincodeMatch[0] : "", "")
    .replace(parts.state, "")
    .trim()
    .replace(/[,\.]+$/, "");

  // Split to get city and street
  const addressParts = streetAddress.split(",");
  if (addressParts.length >= 2) {
    parts.city = addressParts[addressParts.length - 2].trim();
    parts.street = addressParts.slice(0, -1).join(",").trim();
  } else {
    parts.street = streetAddress;
  }

  return parts;
}

// Compare addresses intelligently
export function compareAddresses(addr1: string, addr2: string): number {
  // First try direct similarity
  const directSimilarity = calculateStringSimilarity(addr1, addr2);

  if (directSimilarity > 85) {
    return directSimilarity;
  }

  // Extract components
  const comp1 = extractAddressComponents(addr1);
  const comp2 = extractAddressComponents(addr2);

  // Calculate component-wise similarity
  const pincodeSimilarity =
    comp1.pincode && comp2.pincode
      ? comp1.pincode === comp2.pincode
        ? 100
        : 0
      : 50;

  const stateSimilarity =
    comp1.state && comp2.state
      ? comp1.state === comp2.state
        ? 100
        : calculateStringSimilarity(comp1.state, comp2.state)
      : 50;

  const citySimilarity = calculateStringSimilarity(comp1.city, comp2.city);
  const streetSimilarity = calculateStringSimilarity(comp1.street, comp2.street);

  // Weighted average with pincode and state being more critical
  return Math.round(
    (pincodeSimilarity * 0.3 +
      stateSimilarity * 0.25 +
      citySimilarity * 0.2 +
      streetSimilarity * 0.25) /
      1
  );
}

// Check name consistency
export function checkNameConsistency(
  names: Record<string, string>
): { score: number; details: string[] } {
  const details: string[] = [];
  let totalSimilarity = 0;
  let comparisons = 0;

  const entries = Object.entries(names);

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const similarity = calculateStringSimilarity(entries[i][1], entries[j][1]);
      totalSimilarity += similarity;
      comparisons++;

      if (similarity < 85) {
        details.push(
          `${entries[i][0]}: "${entries[i][1]}" vs ${entries[j][0]}: "${entries[j][1]}" (${similarity}%)`
        );
      }
    }
  }

  const averageSimilarity =
    comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 100;

  return {
    score: Math.max(0, Math.min(100, averageSimilarity)),
    details,
  };
}

// Check DOB consistency
export function checkDOBConsistency(
  dobs: Record<string, string>
): { score: number; consistent: boolean; details: string[] } {
  const parsedDobs: Record<string, string> = {};
  const details: string[] = [];

  for (const [key, dob] of Object.entries(dobs)) {
    parsedDobs[key] = parseDateOfBirth(dob);
  }

  const uniqueDobs = new Set(Object.values(parsedDobs));

  if (uniqueDobs.size === 1) {
    return {
      score: 100,
      consistent: true,
      details: [],
    };
  }

  // DOB mismatch is critical
  for (const [key, dob] of Object.entries(parsedDobs)) {
    details.push(`${key}: ${dob}`);
  }

  return {
    score: 0,
    consistent: false,
    details,
  };
}

// Check address consistency
export function checkAddressConsistency(
  addresses: Record<string, string>
): { score: number; details: string[] } {
  const details: string[] = [];
  let totalSimilarity = 0;
  let comparisons = 0;

  const entries = Object.entries(addresses);

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const similarity = compareAddresses(entries[i][1], entries[j][1]);
      totalSimilarity += similarity;
      comparisons++;

      if (similarity < 80) {
        details.push(
          `${entries[i][0]} vs ${entries[j][0]}: ${similarity}% match`
        );
      }
    }
  }

  const averageSimilarity =
    comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 100;

  return {
    score: Math.max(0, Math.min(100, averageSimilarity)),
    details,
  };
}

// Generate AI suggestions
export function generateConsistencySuggestions(
  mismatches: MismatchDetail[],
  scores: {
    name: number;
    dob: number;
    address: number;
    overall: number;
  }
): string[] {
  const suggestions: string[] = [];

  // Overall score suggestions
  if (scores.overall >= 90) {
    suggestions.push(
      "✅ Excellent consistency! Your identity documents are well-aligned and verified."
    );
  } else if (scores.overall >= 70) {
    suggestions.push(
      "⚠️ Good consistency, but minor variations detected. Review below for details."
    );
  } else {
    suggestions.push(
      "🔴 Low consistency score. Critical review and corrections needed."
    );
  }

  // Name-specific suggestions
  const nameMismatch = mismatches.find((m) => m.field === "name");
  if (nameMismatch) {
    if (nameMismatch.type === "critical") {
      suggestions.push(
        "🔴 CRITICAL: Name significantly differs. Verify original documents immediately."
      );
      suggestions.push(
        "📋 Action: File name correction affidavit with issuing authorities if needed."
      );
    } else if (scores.name < 85) {
      suggestions.push(
        "📝 Name variations detected (abbreviations, middle names, etc.). This is common."
      );
      suggestions.push(
        "💡 Recommendation: Use Aadhaar name as primary and standardize across documents."
      );
    }
  }

  // DOB-specific suggestions
  const dobMismatch = mismatches.find((m) => m.field === "dob");
  if (dobMismatch) {
    suggestions.push(
      "🔴 URGENT: Date of birth mismatch detected. This requires immediate attention."
    );
    suggestions.push(
      "📞 Contact issuing authorities to verify and correct the discrepancy."
    );
    suggestions.push(
      "📄 Keep certified copies and original documents for reference."
    );
  }

  // Address-specific suggestions
  const addressMismatch = mismatches.find((m) => m.field === "address");
  if (addressMismatch) {
    if (addressMismatch.type === "critical") {
      suggestions.push(
        "🏠 Address format differs significantly. Verify current address."
      );
    } else if (scores.address < 85) {
      suggestions.push(
        "✏️ Address formatting varies (abbreviated vs full). This is normal and low-risk."
      );
      suggestions.push(
        "🔄 Suggestion: Update older documents to match current Aadhaar address."
      );
    }
  }

  // Empty mismatches
  if (mismatches.length === 0) {
    suggestions.push(
      "✨ Perfect! All selected documents are consistent and verified."
    );
    suggestions.push(
      "🎯 Your identity vault is ready for use in all transactions."
    );
  }

  return suggestions;
}

// Store history to localStorage
export function saveConsistencyCheck(
  check: ConsistencyHistoryEntry
): void {
  const history = getConsistencyHistory();
  history.push(check);
  // Keep last 50 checks
  if (history.length > 50) {
    history.shift();
  }
  localStorage.setItem(
    "bharat_id_consistency_history",
    JSON.stringify(history)
  );
}

// Get history from localStorage
export function getConsistencyHistory(): ConsistencyHistoryEntry[] {
  try {
    const stored = localStorage.getItem("bharat_id_consistency_history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Clear history
export function clearConsistencyHistory(): void {
  localStorage.removeItem("bharat_id_consistency_history");
}

// Export consistency check as PDF/JSON
export function exportConsistencyReport(
  result: ConsistencyResult,
  format: "json" | "csv" = "json"
): string {
  if (format === "json") {
    return JSON.stringify(result, null, 2);
  }

  // CSV format
  const rows = [
    "Field,Score,Status",
    `Name,${result.nameScore},${result.nameScore >= 85 ? "Pass" : "Review"}`,
    `DOB,${result.dobScore},${result.dobScore >= 85 ? "Pass" : "Review"}`,
    `Address,${result.addressScore},${result.addressScore >= 85 ? "Pass" : "Review"}`,
    `Overall,${result.score},${result.score >= 85 ? "Pass" : result.score >= 70 ? "Good" : "Review"}`,
    "",
    "Mismatches",
  ];

  result.mismatches.forEach((m) => {
    rows.push(`"${m.field}","${m.type}","${m.description}"`);
  });

  return rows.join("\n");
}
