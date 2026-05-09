# Consistency Checker - Developer Quick Start

## Installation & Setup

The consistency checker module is part of the Bharat ID platform. No additional installation needed beyond the existing project setup.

## Quick Import

```typescript
// Import what you need
import {
  calculateStringSimilarity,
  parseDateOfBirth,
  compareAddresses,
  checkNameConsistency,
  checkDOBConsistency,
  checkAddressConsistency,
  generateConsistencySuggestions,
  saveConsistencyCheck,
  getConsistencyHistory,
  exportConsistencyReport,
} from "@/lib/consistency-utils";
```

## 5-Minute Usage Examples

### 1. Compare Two Names

```typescript
const similarity = calculateStringSimilarity("Rajesh Kumar", "Rajesh K.");
console.log(`Similarity: ${similarity}%`);
// Output: Similarity: 87%
```

### 2. Check Multiple Names for Consistency

```typescript
const result = checkNameConsistency({
  aadhaar: "Rajesh Kumar",
  pan: "Rajesh Kumar",
  passport: "Rajesh K."
});

console.log(`Score: ${result.score}%`);
console.log("Issues:", result.details);
// Output:
// Score: 85%
// Issues: ["passport: "Rajesh K." vs aadhaar: "Rajesh Kumar" (87%)"]
```

### 3. Validate Date of Birth Across Documents

```typescript
const dobResult = checkDOBConsistency({
  aadhaar: "15/06/1990",
  pan: "15-06-1990",
  passport: "1990-06-15"
});

if (dobResult.consistent) {
  console.log("✅ All dates match!");
} else {
  console.log("❌ Date mismatch detected!");
  console.log(dobResult.details);
}
```

### 4. Compare Addresses

```typescript
const addressResult = compareAddresses(
  "123, MG Road, Bangalore, Karnataka 560001",
  "123 M.G. Road, Bengaluru - 560001"
);
console.log(`Address match: ${addressResult}%`);
// Output: Address match: 92%
```

### 5. Generate Suggestions for Mismatches

```typescript
const mismatches = [
  {
    field: "name",
    type: "warning",
    description: "Name abbreviated in one document",
    values: { aadhaar: "Rajesh Kumar", pan: "Rajesh K." }
  }
];

const suggestions = generateConsistencySuggestions(mismatches, {
  name: 87,
  dob: 100,
  address: 95,
  overall: 94
});

suggestions.forEach(s => console.log(s));
```

### 6. Save and Retrieve Check History

```typescript
// Save a check
saveConsistencyCheck({
  id: `check_${Date.now()}`,
  timestamp: Date.now(),
  score: 85,
  documentCount: 3,
  mismatchCount: 1,
  documentTypes: ["aadhaar", "pan", "passport"],
  result: { /* consistency result */ }
});

// Retrieve history
const history = getConsistencyHistory();
console.log(`Total checks: ${history.length}`);
history.forEach(check => {
  console.log(`Check from ${new Date(check.timestamp).toLocaleDateString()}: ${check.score}%`);
});
```

### 7. Export Report

```typescript
// Export as JSON
const jsonReport = exportConsistencyReport(consistencyResult, "json");
console.log(jsonReport);

// Export as CSV
const csvReport = exportConsistencyReport(consistencyResult, "csv");
// Columns: Field,Score,Status
```

## Common Patterns

### Pattern 1: Full Document Verification

```typescript
function verifyDocumentSet(documents) {
  const nameScore = checkNameConsistency(documents.names).score;
  const dobScore = checkDOBConsistency(documents.dobs).score;
  const addressScore = checkAddressConsistency(documents.addresses).score;

  const overallScore = Math.round((nameScore + dobScore + addressScore) / 3);

  return {
    passed: overallScore >= 85,
    score: overallScore,
    breakdown: { nameScore, dobScore, addressScore }
  };
}
```

### Pattern 2: Auto-fix Address Format

```typescript
function normalizeAddresses(addresses) {
  return Object.entries(addresses).reduce((acc, [key, addr]) => {
    acc[key] = addr
      .toUpperCase()
      .replace(/\s+/g, " ")
      .replace(/,\s*,/g, ",");
    return acc;
  }, {});
}
```

### Pattern 3: Generate Report for Admin

```typescript
function generateAdminReport(userId, documents) {
  const result = performConsistencyCheck(documents);
  
  return {
    userId,
    checkDate: new Date().toISOString(),
    status: result.score >= 85 ? "APPROVED" : "REVIEW_REQUIRED",
    scores: {
      name: result.nameScore,
      dob: result.dobScore,
      address: result.addressScore,
      overall: result.score
    },
    mismatches: result.mismatches,
    actionItems: result.suggestions
  };
}
```

### Pattern 4: Batch Check Multiple Users

```typescript
async function batchCheckConsistency(users) {
  const results = users.map(user => ({
    userId: user.id,
    result: performConsistencyCheck(user.documents),
    status: "PROCESSED"
  }));

  return {
    total: results.length,
    approved: results.filter(r => r.result.score >= 85).length,
    review: results.filter(r => r.result.score < 85).length,
    results
  };
}
```

## API Cheat Sheet

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `calculateStringSimilarity(s1, s2)` | 2 strings | 0-100 | Quick name comparison |
| `parseDateOfBirth(dob)` | Date string | Normalized DD-MM-YYYY | Date normalization |
| `compareAddresses(a1, a2)` | 2 addresses | 0-100 | Address comparison |
| `checkNameConsistency(obj)` | {key: name} | {score, details} | Name verification |
| `checkDOBConsistency(obj)` | {key: date} | {score, consistent} | DOB verification |
| `checkAddressConsistency(obj)` | {key: addr} | {score, details} | Address verification |
| `generateConsistencySuggestions(m, s)` | Mismatches, Scores | String array | Get recommendations |
| `saveConsistencyCheck(obj)` | Check object | void | Save history |
| `getConsistencyHistory()` | none | Array of checks | Retrieve history |
| `exportConsistencyReport(r, fmt)` | Result, format | JSON/CSV string | Export data |

## Real-World Example: React Component

```typescript
import { useState } from "react";
import {
  checkNameConsistency,
  checkDOBConsistency,
  checkAddressConsistency,
  generateConsistencySuggestions,
  saveConsistencyCheck
} from "@/lib/consistency-utils";

export function DocumentVerifier() {
  const [results, setResults] = useState(null);

  const handleVerify = () => {
    const documents = {
      names: {
        aadhaar: "Rajesh Kumar",
        pan: "Rajesh Kumar",
        passport: "Rajesh K."
      },
      dobs: {
        aadhaar: "15/06/1990",
        pan: "15/06/1990",
        passport: "15-06-1990"
      },
      addresses: {
        aadhaar: "123, MG Road, Bangalore",
        pan: "123 M.G. Road, Bangalore"
      }
    };

    const nameResult = checkNameConsistency(documents.names);
    const dobResult = checkDOBConsistency(documents.dobs);
    const addressResult = checkAddressConsistency(documents.addresses);

    const overall = Math.round(
      (nameResult.score + dobResult.score + addressResult.score) / 3
    );

    const mismatches = [];
    if (nameResult.score < 85) {
      mismatches.push({
        field: "name",
        type: "warning",
        description: "Minor name variations"
      });
    }

    const suggestions = generateConsistencySuggestions(mismatches, {
      name: nameResult.score,
      dob: dobResult.score,
      address: addressResult.score,
      overall
    });

    const result = {
      score: overall,
      nameScore: nameResult.score,
      dobScore: dobResult.score,
      addressScore: addressResult.score,
      mismatches,
      suggestions
    };

    // Save to history
    saveConsistencyCheck({
      id: `check_${Date.now()}`,
      timestamp: Date.now(),
      score: overall,
      documentCount: 3,
      mismatchCount: mismatches.length,
      documentTypes: ["aadhaar", "pan", "passport"],
      result
    });

    setResults(result);
  };

  if (!results) {
    return <button onClick={handleVerify}>Verify Documents</button>;
  }

  return (
    <div>
      <h2>Consistency Score: {results.score}%</h2>
      <ul>
        {results.suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Error Handling

```typescript
function safeCheckConsistency(documents) {
  try {
    if (!documents || Object.keys(documents).length < 2) {
      throw new Error("At least 2 documents required");
    }

    const result = checkNameConsistency(documents.names);
    return result;
  } catch (error) {
    console.error("Consistency check failed:", error);
    return { score: 0, details: ["Error during check"] };
  }
}
```

## Performance Tips

1. **Cache Results**: Don't recalculate the same comparison twice
```typescript
const cache = {};
function getCachedSimilarity(s1, s2) {
  const key = `${s1}||${s2}`;
  if (!cache[key]) {
    cache[key] = calculateStringSimilarity(s1, s2);
  }
  return cache[key];
}
```

2. **Batch Operations**: Process multiple checks in parallel
```typescript
const results = await Promise.all(
  users.map(u => performConsistencyCheck(u.documents))
);
```

3. **Lazy Load History**: Only fetch when needed
```typescript
const history = getConsistencyHistory().slice(-10); // Last 10 only
```

## Testing Checklist

- [ ] Test with identical names: Should return 100%
- [ ] Test with abbreviations: Should return 80-90%
- [ ] Test with date formats: Should normalize correctly
- [ ] Test with address variations: Should handle abbreviations
- [ ] Test history storage: Verify localStorage works
- [ ] Test export: Both JSON and CSV formats

## Resources

- Main Component: `src/routes/consistency-checker.tsx`
- Utility Functions: `src/lib/consistency-utils.ts`
- Full Documentation: `CONSISTENCY_CHECKER_DOCS.md`

## Support

For issues or questions:
1. Check the full documentation
2. Review the example component
3. Run unit tests for verification
4. Check browser console for errors
