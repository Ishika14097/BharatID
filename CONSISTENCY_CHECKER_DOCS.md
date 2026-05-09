# Identity Consistency Checker - Module Documentation

## Overview

The Identity Consistency Checker module is an intelligent system that analyzes and compares government identity documents to detect mismatches and inconsistencies. It provides a comprehensive consistency score, detailed mismatch detection, and AI-powered suggestions for resolving issues.

## Features

### 1. Document Comparison
- Compare up to 4 document types simultaneously:
  - Aadhaar
  - PAN
  - Passport
  - Driving License
- Extract and normalize data from each document
- Compare across name, DOB, and address fields

### 2. Mismatch Detection
- **Name Mismatch Detection**
  - Detects abbreviations, full names, middle names
  - Uses fuzzy string matching (Levenshtein distance)
  - Similarity threshold: 85%
  - Handles different formats and special characters

- **DOB (Date of Birth) Mismatch Detection**
  - Parses various date formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
  - Exact matching after normalization
  - Critical severity if mismatched

- **Address Mismatch Detection**
  - Intelligent component extraction (street, city, state, pincode)
  - Component-wise comparison
  - Handles abbreviations and formatting variations
  - Similarity threshold: 80%

### 3. Consistency Scoring
```
Overall Score = (Name Score + DOB Score + Address Score) / 3

Score Interpretation:
- 85-100% : Excellent (All Clear)
- 70-84%  : Good (Minor Issues)
- Below 70%: Needs Review (Critical Issues)
```

**Field-Specific Scores:**
- **Name Score**: 0-100 based on similarity matching
- **DOB Score**: 0 (mismatched) or 100 (matched)
- **Address Score**: 0-100 based on component matching

### 4. Severity Levels
- **Critical**: Requires immediate action (DOB mismatch, major name variance)
- **Warning**: Should be reviewed and corrected (name/address variations)
- **Info**: Low-risk, informational only

### 5. AI Suggestions Engine
Provides actionable recommendations based on:
- Severity level of mismatches
- Document types involved
- Consistency score
- Field-specific issues

### 6. History Management
- Stores up to 50 consistency checks locally
- Tracks:
  - Timestamp of check
  - Documents checked
  - Consistency score
  - Number of mismatches
  - Full comparison results

## Architecture

### Component Structure

```
src/routes/
├── consistency-checker.tsx    # Main UI component
│   ├── Document Selection Panel
│   ├── Consistency Score Card
│   ├── Mismatch Detection Section
│   ├── AI Suggestions Section
│   ├── Recommended Actions
│   └── History Modal

src/lib/
└── consistency-utils.ts       # Shared utilities
    ├── String normalization
    ├── Similarity calculation
    ├── Date parsing
    ├── Address component extraction
    ├── Mismatch detection
    ├── Suggestion generation
    └── History management
```

### Data Flow

```
User Documents
    ↓
Select Documents to Compare
    ↓
Extract & Normalize Data
    ↓
Calculate Similarities
    ↓
Detect Mismatches
    ↓
Generate Consistency Score
    ↓
Generate AI Suggestions
    ↓
Display Results & History
```

## API & Functions

### Core Comparison Functions

#### `calculateStringSimilarity(str1: string, str2: string): number`
Calculates percentage similarity between two strings.

```typescript
const similarity = calculateStringSimilarity("Rajesh Kumar", "Rajesh K.");
// Returns: 87
```

#### `parseDateOfBirth(dob: string): string`
Normalizes date formats to DD-MM-YYYY.

```typescript
const normalized = parseDateOfBirth("15/06/1990");
// Returns: "15-06-1990"
```

#### `compareAddresses(addr1: string, addr2: string): number`
Intelligent address comparison considering components.

```typescript
const similarity = compareAddresses(
  "123, MG Road, Bangalore, 560001",
  "123 M.G. Road, Bengaluru - 560001"
);
// Returns: 92
```

### Consistency Check Functions

#### `checkNameConsistency(names: Record<string, string>)`
Checks consistency across all names.

```typescript
const result = checkNameConsistency({
  aadhaar: "Rajesh Kumar",
  pan: "Rajesh K.",
  passport: "Rajesh Kumar Singh",
  driving_license: "Rajesh Kumar"
});
// Returns: { score: 75, details: [...] }
```

#### `checkDOBConsistency(dobs: Record<string, string>)`
Checks DOB consistency.

```typescript
const result = checkDOBConsistency({
  aadhaar: "15/06/1990",
  pan: "15/06/1990",
  passport: "15-06-1990",
  driving_license: "15/06/1990"
});
// Returns: { score: 100, consistent: true }
```

#### `checkAddressConsistency(addresses: Record<string, string>)`
Checks address consistency.

```typescript
const result = checkAddressConsistency({
  aadhaar: "123, MG Road, Bangalore, 560001",
  pan: "123 M.G. Road, Bangalore - 560001",
  passport: "123 MG Road, Bengaluru 560001"
});
// Returns: { score: 88, details: [...] }
```

### History Management

#### `saveConsistencyCheck(check: ConsistencyHistoryEntry): void`
Saves a consistency check to localStorage (max 50 entries).

```typescript
const check = {
  id: "check_1234567890",
  timestamp: Date.now(),
  score: 85,
  documentCount: 4,
  mismatchCount: 1,
  documentTypes: ["aadhaar", "pan", "passport", "driving_license"],
  result: {...}
};
saveConsistencyCheck(check);
```

#### `getConsistencyHistory(): ConsistencyHistoryEntry[]`
Retrieves all saved consistency checks.

```typescript
const history = getConsistencyHistory();
// Returns: [check1, check2, ...]
```

#### `clearConsistencyHistory(): void`
Clears all consistency check history.

```typescript
clearConsistencyHistory();
```

### Export Functions

#### `exportConsistencyReport(result: ConsistencyResult, format: "json" | "csv"): string`
Exports consistency check results in JSON or CSV format.

```typescript
const jsonReport = exportConsistencyReport(result, "json");
const csvReport = exportConsistencyReport(result, "csv");
```

## UI Components

### Consistency Score Card
- Displays overall consistency percentage
- Color-coded (green/amber/red)
- Shows individual field scores with progress bars
- Save to history button

### Mismatch Detection Section
- Lists all detected mismatches
- Color-coded by severity (red/amber/blue)
- Shows specific values from each document
- Copy-to-clipboard for each field

### AI Suggestions Section
- Provides 3-5 actionable suggestions
- Icon indicators for severity
- Emoji-prefixed for quick scanning
- Contextual based on mismatch types

### Recommended Actions
- Step-by-step guidance for resolving issues
- Links to contact relevant authorities
- Document action items

### History Modal
- Displays all past consistency checks
- Shows trend of scores over time
- Allows viewing previous results

## String Matching Algorithm

### Levenshtein Distance
Calculates minimum edits needed to transform one string to another.

**Steps:**
1. Normalize both strings (lowercase, remove special chars, extra spaces)
2. Calculate Levenshtein distance
3. Convert to similarity percentage: (length - distance) / length * 100

**Example:**
```
"Rajesh Kumar" vs "Rajesh K."
Normalized: "rajesh kumar" vs "rajesh k"
Distance: 4 edits needed
Similarity: (11 - 4) / 11 * 100 = 64%

But with better extraction and stopword removal: ~87%
```

## Address Component Extraction

Extracts and analyzes address components:

```
Input: "123, MG Road, Bangalore, Karnataka 560001"

Extracted:
{
  street: "123 MG Road",
  city: "Bangalore",
  state: "Karnataka",
  pincode: "560001"
}

Comparison is done component-wise with weighted scoring:
- Pincode: 30% weight
- State: 25% weight
- City: 20% weight
- Street: 25% weight
```

## Mismatch Severity Logic

### Critical (Immediate Action Required)
- DOB mismatch after date normalization
- Name similarity < 50%
- Multiple major inconsistencies

### Warning (Review & Correct)
- Name similarity 50-85%
- Address similarity 50-80%
- Formatting inconsistencies

### Info (Low Risk)
- Name similarity > 85%
- Address similarity > 80%
- Abbreviations and common variations

## Usage Examples

### Basic Usage in React Component

```typescript
import { checkNameConsistency, checkDOBConsistency } from "@/lib/consistency-utils";

function MyComponent() {
  const nameResult = checkNameConsistency({
    aadhaar: "Rajesh Kumar",
    pan: "Rajesh K."
  });

  return (
    <div>
      <p>Name Consistency: {nameResult.score}%</p>
      {nameResult.details.map(detail => (
        <p key={detail}>{detail}</p>
      ))}
    </div>
  );
}
```

### Full Consistency Check

```typescript
import {
  checkNameConsistency,
  checkDOBConsistency,
  checkAddressConsistency,
  generateConsistencySuggestions,
  saveConsistencyCheck
} from "@/lib/consistency-utils";

async function performFullCheck(documents) {
  const documents = {
    names: {
      aadhaar: "Rajesh Kumar",
      pan: "Rajesh K.",
      passport: "Rajesh Kumar Singh"
    },
    dobs: {
      aadhaar: "15/06/1990",
      pan: "15/06/1990",
      passport: "15-06-1990"
    },
    addresses: {
      aadhaar: "123, MG Road, Bangalore",
      pan: "123 MG Road, Bangalore"
    }
  };

  // Check consistency
  const nameCheck = checkNameConsistency(documents.names);
  const dobCheck = checkDOBConsistency(documents.dobs);
  const addressCheck = checkAddressConsistency(documents.addresses);

  // Calculate overall score
  const overall = Math.round(
    (nameCheck.score + dobCheck.score + addressCheck.score) / 3
  );

  // Generate suggestions
  const mismatches = [];
  if (nameCheck.score < 85) {
    mismatches.push({
      field: "name",
      type: "warning",
      description: "Name variations detected"
    });
  }

  const suggestions = generateConsistencySuggestions(mismatches, {
    name: nameCheck.score,
    dob: dobCheck.score,
    address: addressCheck.score,
    overall
  });

  // Save to history
  saveConsistencyCheck({
    id: `check_${Date.now()}`,
    timestamp: Date.now(),
    score: overall,
    documentCount: 3,
    mismatchCount: mismatches.length,
    documentTypes: ["aadhaar", "pan", "passport"],
    result: {
      score: overall,
      nameScore: nameCheck.score,
      dobScore: dobCheck.score,
      addressScore: addressCheck.score,
      mismatches,
      suggestions
    }
  });

  return { overall, mismatches, suggestions };
}
```

## Integration with Other Modules

### Dashboard Integration
- Access consistency checker from dashboard sidebar
- Quick link in Documents section
- Health score influenced by consistency check

### Upload Integration
- Auto-run consistency check after document upload
- Show mismatch alerts during upload
- Suggest corrections before saving to vault

### API Integration
```typescript
// Send consistency check to backend
const response = await fetch("/api/consistency-check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "user123",
    documents: selectedDocuments,
    result: consistencyResult
  })
});
```

## Performance Optimization

### String Comparison Caching
```typescript
const cache = new Map();

function getCachedSimilarity(str1, str2) {
  const key = `${str1}::${str2}`;
  if (!cache.has(key)) {
    cache.set(key, calculateStringSimilarity(str1, str2));
  }
  return cache.get(key);
}
```

### Lazy Loading
- Load history only when modal opens
- Defer AI suggestion generation
- Cache calculation results

## Browser Compatibility

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Uses Web APIs:
  - localStorage (for history)
  - Date parsing
  - String methods
- No external dependencies required for core logic

## Data Privacy

- All consistency checks stored locally (localStorage)
- No data sent to external services in demo mode
- Encryption ready for production
- User controls history deletion

## Future Enhancements

1. **ML-Based Matching**: Use trained models for better accuracy
2. **OCR Integration**: Auto-extract from uploaded documents
3. **Real-time Validation**: Check against government registries
4. **Mobile Support**: Native mobile app version
5. **Multi-language Support**: Support regional languages
6. **Blockchain Integration**: Immutable consistency records
7. **API Webhook**: Trigger actions on mismatch detection
8. **Batch Processing**: Check multiple users simultaneously

## Testing

### Unit Tests
```typescript
import { calculateStringSimilarity, parseDateOfBirth } from "@/lib/consistency-utils";

describe("Consistency Utils", () => {
  test("calculates string similarity correctly", () => {
    expect(calculateStringSimilarity("Rajesh Kumar", "Rajesh Kumar")).toBe(100);
    expect(calculateStringSimilarity("Rajesh Kumar", "Rajesh K.")).toBeGreaterThan(80);
  });

  test("parses dates correctly", () => {
    expect(parseDateOfBirth("15/06/1990")).toBe("15-06-1990");
    expect(parseDateOfBirth("1990-06-15")).toBe("15-06-1990");
  });
});
```

## Troubleshooting

### Issues with Name Matching
- Ensure names are normalized (remove extra spaces, special characters)
- Check for surname/first name order differences
- Verify abbreviation consistency

### DOB Parsing Issues
- Check date format consistency
- Verify leap year handling
- Ensure 4-digit year format

### Address Matching False Negatives
- Check pincode extraction
- Verify state/city name variations
- Consider locality vs. area name differences

## Support & Resources

- [Module Code](./src/routes/consistency-checker.tsx)
- [Utility Functions](./src/lib/consistency-utils.ts)
- [Integration Guide](./INTEGRATION_GUIDE.md)
