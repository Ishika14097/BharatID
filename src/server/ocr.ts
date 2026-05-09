import Tesseract from "tesseract.js";

export interface ExtractedData {
  name: string;
  dob: string;
  address: string;
  idNumber: string;
  documentType: string;
}

// Auto-detect document type based on extracted text
function autoDetectDocumentType(text: string): string {
  const upperText = text.toUpperCase();

  if (upperText.includes("AADHAAR") || upperText.includes("UID")) {
    return "Aadhaar";
  }
  if (upperText.includes("PAN") || upperText.includes("INCOME TAX")) {
    return "PAN";
  }
  if (upperText.includes("PASSPORT")) {
    return "Passport";
  }
  if (
    upperText.includes("DRIVING") ||
    upperText.includes("LICENSE") ||
    upperText.includes("DRIVING LICENSE")
  ) {
    return "Driving License";
  }
  if (upperText.includes("VOTER") || upperText.includes("ELECTORAL")) {
    return "Voter ID";
  }

  return "Unknown";
}

// Extract DOB in DD/MM/YYYY format
function extractDOB(text: string): string {
  // Match various date formats
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g,
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
  ];

  for (const pattern of datePatterns) {
    const match = pattern.exec(text);
    if (match) {
      // Try to determine if it's DD/MM/YYYY or YYYY/MM/DD
      let day, month, year;
      if (parseInt(match[1]) > 31) {
        // Likely YYYY/MM/DD
        year = match[1];
        month = match[2];
        day = match[3];
      } else {
        // Likely DD/MM/YYYY
        day = match[1];
        month = match[2];
        year = match[3];
      }
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
    }
  }

  return "Not found";
}

// Extract ID number (Aadhaar, PAN, etc.)
function extractIDNumber(text: string, documentType: string): string {
  const upperText = text.toUpperCase();

  if (documentType === "Aadhaar") {
    // Aadhaar: 12 digits, usually formatted as XXXX XXXX XXXX
    const aadhaarMatch = text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
    if (aadhaarMatch) {
      return aadhaarMatch[1].replace(/\s/g, " ");
    }
  }

  if (documentType === "PAN") {
    // PAN: 10 characters, format ABCDE1234F
    const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/);
    if (panMatch) {
      return panMatch[1];
    }
  }

  if (documentType === "Passport") {
    // Passport: Usually starts with letter and has numbers
    const passportMatch = text.match(/\b([A-Z]\d{7})\b/);
    if (passportMatch) {
      return passportMatch[1];
    }
  }

  if (documentType === "Driving License") {
    // DL format varies by state
    const dlMatch = text.match(/(?:DL[^A-Z0-9]*)?([A-Z]{2}\d{13}|DL-\d+-\d+)/);
    if (dlMatch) {
      return dlMatch[1];
    }
  }

  if (documentType === "Voter ID") {
    // Voter ID: Usually alphanumeric
    const voterMatch = text.match(/\b([A-Z]{3}\d{7})\b/);
    if (voterMatch) {
      return voterMatch[1];
    }
  }

  // Fallback: return first sequence of alphanumeric characters
  const fallback = text.match(/\b([A-Z0-9]{8,})\b/);
  return fallback ? fallback[1] : "Not found";
}

// Extract name (usually first or second line)
function extractName(text: string): string {
  const lines = text.split("\n").map((line) => line.trim());

  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i];
    // Look for lines that contain words (not just numbers)
    if (
      line &&
      line.length > 3 &&
      line.match(/[a-zA-Z]/i) &&
      !line.match(/^\d+$/)
    ) {
      // Remove special characters and extra spaces
      return line.replace(/[^a-zA-Z\s]/g, "").trim();
    }
  }

  return "Not found";
}

// Extract address
function extractAddress(text: string): string {
  const lines = text.split("\n").map((line) => line.trim());

  // Usually address is in the middle or latter part
  const addressLines: string[] = [];
  let foundName = false;

  for (const line of lines) {
    if (line && line.match(/[a-zA-Z]/)) {
      // Skip first line (usually name) and lines with IDs
      if (!foundName && line.length < 50) {
        foundName = true;
        continue;
      }

      if (foundName && line.length > 10 && !line.match(/\d{12,}/)) {
        addressLines.push(line);
        if (addressLines.length >= 3) break;
      }
    }
  }

  return addressLines.join(", ") || "Not found";
}

export async function extractFromDocument(
  imagePath: string
): Promise<ExtractedData> {
  try {
    // Use Tesseract for OCR
    const result = await Tesseract.recognize(imagePath, "eng");
    const extractedText = result.data.text;

    const documentType = autoDetectDocumentType(extractedText);
    const name = extractName(extractedText);
    const dob = extractDOB(extractedText);
    const idNumber = extractIDNumber(extractedText, documentType);
    const address = extractAddress(extractedText);

    return {
      name,
      dob,
      address,
      idNumber,
      documentType,
    };
  } catch (error) {
    console.error("OCR extraction error:", error);
    // Return placeholder data if OCR fails
    return {
      name: "Not extracted",
      dob: "Not extracted",
      address: "Not extracted",
      idNumber: "Not extracted",
      documentType: "Unknown",
    };
  }
}

// Alternative: Use placeholder extraction for demo (no heavy dependencies)
export function extractFromDocumentPlaceholder(
  filename: string
): ExtractedData {
  // Demo extraction based on filename
  const documentType = autoDetectDocumentType(filename);

  const mockData: Record<string, ExtractedData> = {
    Aadhaar: {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "1234 5678 9012",
      documentType: "Aadhaar",
    },
    PAN: {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "ABCD12345E",
      documentType: "PAN",
    },
    Passport: {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "P1234567",
      documentType: "Passport",
    },
    "Driving License": {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "KA-01-2024-00123",
      documentType: "Driving License",
    },
    "Voter ID": {
      name: "Rajesh Kumar",
      dob: "15/06/1990",
      address: "123, MG Road, Bangalore, Karnataka 560001",
      idNumber: "KAR1234567890",
      documentType: "Voter ID",
    },
  };

  return (
    mockData[documentType] || {
      name: "Not extracted",
      dob: "Not extracted",
      address: "Not extracted",
      idNumber: "Not extracted",
      documentType: "Unknown",
    }
  );
}
