# Consistency Checker - Testing Guide

## Test Coverage Overview

This guide covers comprehensive testing of the Identity Consistency Checker module including unit tests, integration tests, and UI tests.

## Unit Tests

### 1. String Similarity Tests

```typescript
import { calculateStringSimilarity, normalizeString } from "@/lib/consistency-utils";

describe("String Similarity", () => {
  test("identical strings return 100%", () => {
    expect(calculateStringSimilarity("Rajesh Kumar", "Rajesh Kumar")).toBe(100);
  });

  test("empty strings return 100%", () => {
    expect(calculateStringSimilarity("", "")).toBe(100);
  });

  test("one empty string returns 0%", () => {
    expect(calculateStringSimilarity("test", "")).toBe(0);
  });

  test("abbreviations are handled correctly", () => {
    const sim = calculateStringSimilarity("Rajesh Kumar", "Rajesh K.");
    expect(sim).toBeGreaterThan(70);
    expect(sim).toBeLessThan(100);
  });

  test("case insensitivity", () => {
    const sim1 = calculateStringSimilarity("RAJESH", "rajesh");
    expect(sim1).toBe(100);
  });

  test("extra spaces are handled", () => {
    const sim = calculateStringSimilarity(
      "Rajesh  Kumar",
      "Rajesh Kumar"
    );
    expect(sim).toBe(100);
  });

  test("special characters are handled", () => {
    const sim = calculateStringSimilarity(
      "Rajesh-Kumar",
      "Rajesh Kumar"
    );
    expect(sim).toBeGreaterThan(90);
  });

  test("name variations", () => {
    const testCases = [
      { s1: "Rajesh Kumar", s2: "Rajesh Kumar Singh", similarity: "high" },
      { s1: "John Smith", s2: "Jon Smith", similarity: "high" },
      { s1: "Mary", s2: "Maria", similarity: "medium" },
    ];

    testCases.forEach(tc => {
      const sim = calculateStringSimilarity(tc.s1, tc.s2);
      if (tc.similarity === "high") expect(sim).toBeGreaterThan(70);
      if (tc.similarity === "medium") expect(sim).toBeGreaterThan(50);
    });
  });
});

describe("String Normalization", () => {
  test("converts to lowercase", () => {
    expect(normalizeString("RAJESH")).toBe("rajesh");
  });

  test("removes special characters", () => {
    expect(normalizeString("Rajesh-Kumar")).toBe("rajesh kumar");
  });

  test("trims whitespace", () => {
    expect(normalizeString("  Rajesh Kumar  ")).toBe("rajesh kumar");
  });

  test("removes stopwords", () => {
    expect(normalizeString("Mr. Rajesh Kumar")).not.toContain("mr");
  });

  test("collapses multiple spaces", () => {
    expect(normalizeString("Rajesh    Kumar")).toBe("rajesh kumar");
  });
});
```

### 2. Date Parsing Tests

```typescript
import { parseDateOfBirth } from "@/lib/consistency-utils";

describe("Date of Birth Parsing", () => {
  test("parses DD/MM/YYYY format", () => {
    expect(parseDateOfBirth("15/06/1990")).toBe("15-06-1990");
  });

  test("parses DD-MM-YYYY format", () => {
    expect(parseDateOfBirth("15-06-1990")).toBe("15-06-1990");
  });

  test("parses YYYY/MM/DD format", () => {
    expect(parseDateOfBirth("1990/06/15")).toBe("15-06-1990");
  });

  test("parses YYYY-MM-DD format", () => {
    expect(parseDateOfBirth("1990-06-15")).toBe("15-06-1990");
  });

  test("pads single digit days and months", () => {
    expect(parseDateOfBirth("5/6/1990")).toBe("05-06-1990");
  });

  test("handles leap year dates", () => {
    expect(parseDateOfBirth("29/02/2000")).toBe("29-02-2000");
  });

  test("various separator combinations", () => {
    const testCases = [
      "15/06/1990",
      "15-06-1990",
      "15.06.1990",
      "1990/06/15",
      "1990-06-15"
    ];

    testCases.forEach(date => {
      const parsed = parseDateOfBirth(date);
      expect(parsed).toMatch(/^\d{2}-\d{2}-\d{4}$/);
    });
  });
});
```

### 3. Address Comparison Tests

```typescript
import { compareAddresses, extractAddressComponents } from "@/lib/consistency-utils";

describe("Address Extraction", () => {
  test("extracts street from address", () => {
    const addr = "123 MG Road, Bangalore, Karnataka 560001";
    const components = extractAddressComponents(addr);
    expect(components.street).toContain("123");
    expect(components.street).toContain("MG Road");
  });

  test("extracts pincode correctly", () => {
    const addr = "123 MG Road, Bangalore, Karnataka 560001";
    const components = extractAddressComponents(addr);
    expect(components.pincode).toBe("560001");
  });

  test("extracts state correctly", () => {
    const addr = "123 MG Road, Bangalore, Karnataka 560001";
    const components = extractAddressComponents(addr);
    expect(components.state.toLowerCase()).toBe("karnataka");
  });

  test("extracts city correctly", () => {
    const addr = "123 MG Road, Bangalore, Karnataka 560001";
    const components = extractAddressComponents(addr);
    expect(components.city.toLowerCase()).toContain("bangalore");
  });

  test("handles missing components", () => {
    const addr = "123 MG Road, Bangalore";
    const components = extractAddressComponents(addr);
    expect(components.street).toBeTruthy();
    expect(components.pincode).toBe("");
  });
});

describe("Address Comparison", () => {
  test("identical addresses return high similarity", () => {
    const addr1 = "123 MG Road, Bangalore, Karnataka 560001";
    const addr2 = "123 MG Road, Bangalore, Karnataka 560001";
    expect(compareAddresses(addr1, addr2)).toBe(100);
  });

  test("abbreviated addresses are recognized", () => {
    const addr1 = "123, MG Road, Bangalore, Karnataka 560001";
    const addr2 = "123 M.G. Road, Bengaluru - 560001";
    const similarity = compareAddresses(addr1, addr2);
    expect(similarity).toBeGreaterThan(75);
  });

  test("different pincodes reduce similarity", () => {
    const addr1 = "123 MG Road, Bangalore, Karnataka 560001";
    const addr2 = "123 MG Road, Bangalore, Karnataka 560002";
    const similarity = compareAddresses(addr1, addr2);
    expect(similarity).toBeLessThan(85);
  });

  test("completely different addresses return low similarity", () => {
    const addr1 = "123 MG Road, Bangalore, Karnataka 560001";
    const addr2 = "456 Brigade Road, Chennai, Tamil Nadu 600001";
    const similarity = compareAddresses(addr1, addr2);
    expect(similarity).toBeLessThan(50);
  });
});
```

### 4. Consistency Check Tests

```typescript
import {
  checkNameConsistency,
  checkDOBConsistency,
  checkAddressConsistency
} from "@/lib/consistency-utils";

describe("Name Consistency Check", () => {
  test("identical names return high score", () => {
    const result = checkNameConsistency({
      aadhaar: "Rajesh Kumar",
      pan: "Rajesh Kumar",
      passport: "Rajesh Kumar"
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  test("similar names return good score", () => {
    const result = checkNameConsistency({
      aadhaar: "Rajesh Kumar",
      pan: "Rajesh Kumar",
      passport: "Rajesh K."
    });
    expect(result.score).toBeGreaterThan(70);
  });

  test("dissimilar names return low score", () => {
    const result = checkNameConsistency({
      aadhaar: "Rajesh Kumar",
      pan: "John Smith",
      passport: "Rajesh Kumar"
    });
    expect(result.score).toBeLessThan(70);
  });

  test("detects mismatches", () => {
    const result = checkNameConsistency({
      aadhaar: "Rajesh Kumar",
      pan: "Rajesh K."
    });
    expect(result.details.length).toBeGreaterThan(0);
  });
});

describe("DOB Consistency Check", () => {
  test("identical dates return 100%", () => {
    const result = checkDOBConsistency({
      aadhaar: "15/06/1990",
      pan: "15-06-1990",
      passport: "15/06/1990"
    });
    expect(result.score).toBe(100);
    expect(result.consistent).toBe(true);
  });

  test("different dates return 0%", () => {
    const result = checkDOBConsistency({
      aadhaar: "15/06/1990",
      pan: "15/06/1991",
      passport: "15/06/1990"
    });
    expect(result.score).toBe(0);
    expect(result.consistent).toBe(false);
  });

  test("detects all date variations", () => {
    const result = checkDOBConsistency({
      aadhaar: "15/06/1990",
      pan: "15-06-1990",
      passport: "1990-06-15",
      driving_license: "15.06.1990"
    });
    expect(result.consistent).toBe(true);
  });
});

describe("Address Consistency Check", () => {
  test("identical addresses return high score", () => {
    const result = checkAddressConsistency({
      aadhaar: "123 MG Road, Bangalore, Karnataka 560001",
      pan: "123 MG Road, Bangalore, Karnataka 560001"
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  test("abbreviated addresses return good score", () => {
    const result = checkAddressConsistency({
      aadhaar: "123, MG Road, Bangalore, Karnataka 560001",
      pan: "123 M.G. Road, Bengaluru - 560001"
    });
    expect(result.score).toBeGreaterThan(75);
  });

  test("completely different addresses return low score", () => {
    const result = checkAddressConsistency({
      aadhaar: "123 MG Road, Bangalore, Karnataka 560001",
      pan: "456 Brigade Road, Chennai, Tamil Nadu 600001"
    });
    expect(result.score).toBeLessThan(50);
  });
});
```

### 5. Suggestion Generation Tests

```typescript
import { generateConsistencySuggestions } from "@/lib/consistency-utils";

describe("Suggestion Generation", () => {
  test("generates suggestions for high scores", () => {
    const suggestions = generateConsistencySuggestions([], {
      name: 95,
      dob: 100,
      address: 90,
      overall: 95
    });
    expect(suggestions).toContainEqual(expect.stringContaining("✅"));
  });

  test("generates suggestions for medium scores", () => {
    const suggestions = generateConsistencySuggestions(
      [
        {
          field: "name",
          type: "warning",
          description: "Name variations"
        }
      ],
      {
        name: 75,
        dob: 100,
        address: 85,
        overall: 87
      }
    );
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test("generates urgent suggestions for DOB mismatch", () => {
    const suggestions = generateConsistencySuggestions(
      [
        {
          field: "dob",
          type: "critical",
          description: "DOB mismatch"
        }
      ],
      {
        name: 90,
        dob: 0,
        address: 85,
        overall: 58
      }
    );
    expect(suggestions).toContainEqual(expect.stringContaining("URGENT"));
  });

  test("generates actionable suggestions", () => {
    const suggestions = generateConsistencySuggestions([], {
      name: 85,
      dob: 100,
      address: 80,
      overall: 88
    });
    suggestions.forEach(s => {
      expect(s.length).toBeGreaterThan(5);
    });
  });
});
```

## Integration Tests

```typescript
import {
  checkNameConsistency,
  checkDOBConsistency,
  checkAddressConsistency,
  generateConsistencySuggestions
} from "@/lib/consistency-utils";

describe("Full Consistency Check Flow", () => {
  test("complete document verification", () => {
    const documents = {
      names: {
        aadhaar: "Rajesh Kumar",
        pan: "Rajesh Kumar",
        passport: "Rajesh K."
      },
      dobs: {
        aadhaar: "15/06/1990",
        pan: "15-06-1990",
        passport: "1990-06-15"
      },
      addresses: {
        aadhaar: "123, MG Road, Bangalore, Karnataka 560001",
        pan: "123 M.G. Road, Bengaluru - 560001"
      }
    };

    const nameCheck = checkNameConsistency(documents.names);
    const dobCheck = checkDOBConsistency(documents.dobs);
    const addressCheck = checkAddressConsistency(documents.addresses);

    const overall = Math.round(
      (nameCheck.score + dobCheck.score + addressCheck.score) / 3
    );

    expect(overall).toBeGreaterThan(75);
    expect(nameCheck.score).toBeGreaterThan(0);
    expect(dobCheck.score).toBe(100);
    expect(addressCheck.score).toBeGreaterThan(75);

    const suggestions = generateConsistencySuggestions([], {
      name: nameCheck.score,
      dob: dobCheck.score,
      address: addressCheck.score,
      overall
    });

    expect(suggestions.length).toBeGreaterThan(0);
  });
});
```

## History Management Tests

```typescript
import {
  saveConsistencyCheck,
  getConsistencyHistory,
  clearConsistencyHistory
} from "@/lib/consistency-utils";

describe("History Management", () => {
  beforeEach(() => {
    clearConsistencyHistory();
  });

  test("saves consistency check to history", () => {
    const check = {
      id: "check_123",
      timestamp: Date.now(),
      score: 85,
      documentCount: 3,
      mismatchCount: 0,
      documentTypes: ["aadhaar", "pan", "passport"],
      result: {
        score: 85,
        nameScore: 90,
        dobScore: 100,
        addressScore: 75,
        mismatches: [],
        suggestions: []
      }
    };

    saveConsistencyCheck(check);
    const history = getConsistencyHistory();

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("check_123");
  });

  test("retrieves multiple checks from history", () => {
    for (let i = 0; i < 5; i++) {
      saveConsistencyCheck({
        id: `check_${i}`,
        timestamp: Date.now() + i,
        score: 80 + i,
        documentCount: 3,
        mismatchCount: 0,
        documentTypes: ["aadhaar", "pan", "passport"],
        result: {
          score: 80 + i,
          nameScore: 85,
          dobScore: 100,
          addressScore: 75,
          mismatches: [],
          suggestions: []
        }
      });
    }

    const history = getConsistencyHistory();
    expect(history).toHaveLength(5);
  });

  test("maintains maximum history size", () => {
    // Add 60 checks
    for (let i = 0; i < 60; i++) {
      saveConsistencyCheck({
        id: `check_${i}`,
        timestamp: Date.now() + i,
        score: 85,
        documentCount: 3,
        mismatchCount: 0,
        documentTypes: ["aadhaar", "pan", "passport"],
        result: {
          score: 85,
          nameScore: 90,
          dobScore: 100,
          addressScore: 75,
          mismatches: [],
          suggestions: []
        }
      });
    }

    const history = getConsistencyHistory();
    expect(history).toHaveLength(50); // Max 50
  });

  test("clears history", () => {
    saveConsistencyCheck({
      id: "check_123",
      timestamp: Date.now(),
      score: 85,
      documentCount: 3,
      mismatchCount: 0,
      documentTypes: ["aadhaar", "pan", "passport"],
      result: {
        score: 85,
        nameScore: 90,
        dobScore: 100,
        addressScore: 75,
        mismatches: [],
        suggestions: []
      }
    });

    clearConsistencyHistory();
    const history = getConsistencyHistory();
    expect(history).toHaveLength(0);
  });
});
```

## Export Tests

```typescript
import { exportConsistencyReport } from "@/lib/consistency-utils";

describe("Report Export", () => {
  const testResult = {
    score: 85,
    nameScore: 90,
    dobScore: 100,
    addressScore: 75,
    mismatches: [
      {
        field: "address",
        type: "warning",
        description: "Minor formatting differences",
        values: {}
      }
    ],
    suggestions: ["✅ Overall good match"]
  };

  test("exports as JSON", () => {
    const json = exportConsistencyReport(testResult, "json");
    const parsed = JSON.parse(json);
    expect(parsed.score).toBe(85);
  });

  test("exports as CSV", () => {
    const csv = exportConsistencyReport(testResult, "csv");
    expect(csv).toContain("Field");
    expect(csv).toContain("Score");
    expect(csv).toContain("Status");
    expect(csv).toContain("85");
  });

  test("exported data preserves information", () => {
    const json = exportConsistencyReport(testResult, "json");
    const parsed = JSON.parse(json);
    expect(parsed.mismatches).toHaveLength(1);
    expect(parsed.suggestions).toHaveLength(1);
  });
});
```

## React Component Tests

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import ConsistencyChecker from "@/routes/consistency-checker";

describe("Consistency Checker Component", () => {
  test("renders component", () => {
    render(<ConsistencyChecker />);
    expect(screen.getByText("Identity Consistency Checker")).toBeInTheDocument();
  });

  test("displays available documents", () => {
    render(<ConsistencyChecker />);
    expect(screen.getByText("Aadhaar")).toBeInTheDocument();
    expect(screen.getByText("PAN")).toBeInTheDocument();
  });

  test("enables check button when documents selected", () => {
    render(<ConsistencyChecker />);
    const aadhaarCheckbox = screen.getByLabelText("Aadhaar");
    const panCheckbox = screen.getByLabelText("PAN");

    fireEvent.click(aadhaarCheckbox);
    fireEvent.click(panCheckbox);

    const checkButton = screen.getByText("Check Consistency");
    expect(checkButton).not.toBeDisabled();
  });

  test("displays consistency score after check", () => {
    render(<ConsistencyChecker />);
    const aadhaarCheckbox = screen.getByLabelText("Aadhaar");
    fireEvent.click(aadhaarCheckbox);

    const checkButton = screen.getByText("Check Consistency");
    fireEvent.click(checkButton);

    expect(screen.getByText(/Consistency Score/)).toBeInTheDocument();
  });

  test("shows suggestions", () => {
    render(<ConsistencyChecker />);
    const aadhaarCheckbox = screen.getByLabelText("Aadhaar");
    fireEvent.click(aadhaarCheckbox);

    const checkButton = screen.getByText("Check Consistency");
    fireEvent.click(checkButton);

    expect(screen.getByText(/Suggestions/)).toBeInTheDocument();
  });

  test("saves to history", () => {
    render(<ConsistencyChecker />);
    const aadhaarCheckbox = screen.getByLabelText("Aadhaar");
    fireEvent.click(aadhaarCheckbox);

    const checkButton = screen.getByText("Check Consistency");
    fireEvent.click(checkButton);

    const saveButton = screen.getByText("Save to History");
    fireEvent.click(saveButton);

    // Verify notification or confirmation
    expect(screen.getByText(/saved|History/i)).toBeInTheDocument();
  });

  test("displays history modal", () => {
    render(<ConsistencyChecker />);
    const historyButton = screen.getByText("Check History");
    fireEvent.click(historyButton);

    expect(screen.getByText(/Previous Checks/)).toBeInTheDocument();
  });
});
```

## Manual Testing Scenarios

### Scenario 1: Perfect Match
```
Documents:
- Aadhaar: Rajesh Kumar | 15/06/1990 | 123 MG Road, Bangalore
- PAN: Rajesh Kumar | 15/06/1990 | 123 MG Road, Bangalore
- Passport: Rajesh Kumar | 15/06/1990 | 123 MG Road, Bangalore

Expected:
- Overall Score: 100%
- Status: ✅ All Clear
- Suggestions: Excellent consistency
```

### Scenario 2: Minor Name Variations
```
Documents:
- Aadhaar: Rajesh Kumar | 15/06/1990 | 123 MG Road, Bangalore
- PAN: Rajesh K. | 15/06/1990 | 123 M.G. Road, Bangalore

Expected:
- Overall Score: 85-95%
- Status: ⚠️ Good
- Suggestions: Minor abbreviations detected
```

### Scenario 3: DOB Mismatch
```
Documents:
- Aadhaar: Rajesh Kumar | 15/06/1990 | ...
- PAN: Rajesh Kumar | 15/06/1991 | ...

Expected:
- Overall Score: <70%
- Status: 🔴 Critical
- Suggestions: URGENT - DOB mismatch detected
```

### Scenario 4: Address Variations
```
Documents:
- Aadhaar: 123, MG Road, Bangalore, Karnataka 560001
- PAN: 123 M.G. Road, Bengaluru - 560001
- Passport: 123 MG Road, Bangalore 560001

Expected:
- Address Score: 85-95%
- Status: Variations detected but acceptable
```

## Performance Testing

```typescript
import { performance } from "perf_hooks";

test("performance: string similarity calculation", () => {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    calculateStringSimilarity("Rajesh Kumar", "Rajesh K.");
  }
  const end = performance.now();
  expect(end - start).toBeLessThan(100); // Should complete in < 100ms
});

test("performance: full consistency check", () => {
  const start = performance.now();
  const documents = {
    names: { aadhaar: "Name", pan: "Name", passport: "Name" },
    dobs: { aadhaar: "15/06/1990", pan: "15/06/1990", passport: "15/06/1990" },
    addresses: { aadhaar: "Addr", pan: "Addr", passport: "Addr" }
  };

  for (let i = 0; i < 100; i++) {
    checkNameConsistency(documents.names);
    checkDOBConsistency(documents.dobs);
    checkAddressConsistency(documents.addresses);
  }
  const end = performance.now();
  expect(end - start).toBeLessThan(500); // Should complete in < 500ms
});
```

## Test Execution

```bash
# Run all tests
npm test

# Run specific test file
npm test -- consistency-utils.test.ts

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- --testNamePattern="String Similarity"

# Run in watch mode
npm test -- --watch
```

## Coverage Goals

- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

## Continuous Integration

Tests should run on:
- Every pull request
- Before deployment
- On schedule (daily)
- Manual trigger

## Debugging Tips

1. **Enable detailed logging**
```typescript
function debugConsistencyCheck(docs) {
  console.log("Documents:", docs);
  const result = performCheck(docs);
  console.log("Result:", result);
  return result;
}
```

2. **Inspect calculation steps**
```typescript
const similarity = calculateStringSimilarity(s1, s2);
console.log(`Comparing "${s1}" and "${s2}": ${similarity}%`);
```

3. **Check browser console**
- localStorage content
- Error messages
- Performance warnings
