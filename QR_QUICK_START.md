# QR-Based Document Verification - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Generate Your First QR Code

```typescript
import { handleGenerateQR } from "@/server/api-qr";

// Generate a QR token
const response = await handleGenerateQR({
  documentId: "aadhaar_123456789012",
  documentType: "aadhaar",
  ownerName: "Rajesh Kumar",
  documentHash: "abc123def456...",
  expirationDays: 365,
  metadata: {
    issuerName: "Bharat ID",
    issueReason: "Official Document Verification"
  }
});

console.log(response);
// {
//   success: true,
//   qrId: "QR_1234567890_ABCDEF123456",
//   token: "eyJ...",
//   verificationUrl: "/verify-qr/eyJ...",
//   expiresAt: "2025-05-09T...",
//   daysRemaining: 365
// }
```

### Step 2: Verify a QR Token

```typescript
import { QRVerifier } from "@/lib/qr-utils";

const result = QRVerifier.verifyToken(token);

if (result.valid) {
  console.log("✅ Document verified!");
  console.log(QRVerifier.getDocumentInfo(token));
  // {
  //   ownerName: "Rajesh Kumar",
  //   documentType: "aadhaar",
  //   issuedAt: "15/05/2024",
  //   expiresAt: "14/05/2025",
  //   daysRemaining: 365
  // }
} else if (result.expired) {
  console.log("⏰ QR code has expired");
} else if (result.tampered) {
  console.log("🔴 QR code has been tampered with!");
}
```

### Step 3: Display QR Code

```typescript
import { QRCodeGenerator } from "@/lib/qr-utils";

// Generate QR image
const dataUrl = await QRCodeGenerator.generateQRCode(
  "https://bharat-id.com/verify-qr/token_here",
  {
    size: 400,
    errorCorrection: "H"
  }
);

// Display in HTML
document.getElementById("qr-container").innerHTML = 
  `<img src="${dataUrl}" alt="QR Code" />`;
```

## 🎯 Common Use Cases

### Use Case 1: Generate QR for Verified Document

**Scenario**: User verified their Aadhaar document and wants to create a verification QR code.

```typescript
// User clicks "Generate QR" button on dashboard
const handleGenerateQR = async (document) => {
  const response = await handleGenerateQR({
    documentId: document.id,
    documentType: document.type,
    ownerName: user.name,
    documentHash: document.hash,
    expirationDays: 365
  });

  // Display modal with QR code
  return response.token; // Use for display
};
```

### Use Case 2: Share QR Code

```typescript
import { QRDisplay } from "@/lib/qr-utils";

const shareQR = async (token) => {
  // User clicks "Share" button
  await QRDisplay.shareQRCode(
    token,
    "Document Verification",
    "Verify my government ID"
  );
};
```

### Use Case 3: Download QR Code

```typescript
import { QRCodeGenerator } from "@/lib/qr-utils";

const downloadQR = async (token) => {
  // User clicks "Download" button
  await QRCodeGenerator.downloadQRCode(
    token,
    "my-document-qr.png"
  );
};
```

### Use Case 4: Verify Received QR Code

**Scenario**: User receives QR code, scans it with phone.

```typescript
// On verification page (verify-qr component)
const token = window.location.pathname.split("/").pop();

// Automatically verify on page load
const result = QRVerifier.verifyToken(token);

// Display status
if (result.valid) {
  return <VerifiedStatus data={result.data} />;
} else if (result.expired) {
  return <ExpiredStatus data={result.data} />;
} else if (result.tampered) {
  return <TamperedAlert />;
}
```

## 🔧 API Quick Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `handleGenerateQR(config)` | Generate QR token | Token, URL, expiration |
| `handleVerifyQR(token)` | Verify token | Validity, expiration, tamper status |
| `QRVerifier.verifyToken(token)` | Check token validity | Validation result |
| `QRVerifier.getDocumentInfo(token)` | Extract document data | Owner, type, dates |
| `QRCodeGenerator.generateQRCode(url)` | Generate QR image | Data URL (PNG) |
| `QRCodeGenerator.downloadQRCode(url)` | Download QR as file | Downloads PNG file |
| `QRDisplay.shareQRCode(token)` | Share QR code | Native share dialog |
| `QRStorage.saveQRCode(docId, token)` | Store locally | Saves to localStorage |

## 📱 React Component Example

```typescript
import { useState } from "react";
import { QRGenerationModal } from "@/components/qr-generation-modal";
import { QrCode } from "lucide-react";

function DocumentCard({ document }) {
  const [showQRModal, setShowQRModal] = useState(false);

  return (
    <>
      <div className="p-4 border rounded-lg">
        <h3>{document.name}</h3>
        <p>{document.type}</p>
        
        {document.status === "verified" && (
          <button
            onClick={() => setShowQRModal(true)}
            className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded"
          >
            <QrCode className="h-4 w-4" />
            Generate QR
          </button>
        )}
      </div>

      <QRGenerationModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        documentId={document.id}
        documentType={document.type}
        ownerName="User Name"
        documentHash="hash_here"
      />
    </>
  );
}
```

## 🔒 Security Notes

### Do's ✅
- ✅ Use HTTPS for all URLs
- ✅ Validate tokens on server side
- ✅ Set reasonable expiration times
- ✅ Keep secret keys secure
- ✅ Log verification attempts
- ✅ Monitor for unusual patterns

### Don'ts ❌
- ❌ Don't expose secret keys in frontend
- ❌ Don't trust client-side validation only
- ❌ Don't log sensitive document data
- ❌ Don't share QR codes in public channels
- ❌ Don't disable signature verification
- ❌ Don't ignore tampering alerts

## 🧪 Quick Tests

### Test Valid Token
```bash
# Copy this token (for demo)
TOKEN="eyJkb2N1bWVudElkIjoiYWFkaGFhXzEyMzQ1Njc4OTAxMiIsImRvY3VtZW50VHlwZSI6ImFhZGhhYXIiLCJvd25lck5hbWUiOiJSYWplc2ggS3VtYXIiLCJkb2N1bWVudEhhc2giOiJzaGEyNTZfaGFzaF8wMTIzNDU2Nzg5YWJjZGVmIiwiaXNzdWVkQXQiOjE3MTUzODI0MDAwMDAsImV4cGlyZXNBdCI6MTc0NzAwODAwMDAwMCwibWV0YWRhdGEiOnsiaXNzdWVyTmFtZSI6IkJoYXJhdCBJRCIsImlzc3VlUmVhc29uIjoiRG9jdW1lbnQgVmVyaWZpY2F0aW9uIn19...."

# Test verification
curl -X POST http://localhost:3000/api/qr/verify \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"
```

### Test Expired Token
```typescript
import { QRTokenService } from "@/server/qr-generator";

// Create a token that expires immediately
const token = QRTokenService.generateToken(
  {
    documentId: "test",
    documentType: "aadhaar",
    ownerName: "Test",
    documentHash: "test",
  },
  expirationDays: 0 // Expires immediately
);

// Verify
const result = QRTokenService.verifyToken(token);
console.log(result.expired); // true
```

### Test Tampered Token
```typescript
const token = "valid_token_here";

// Modify the token (tamper with it)
const tampered = token.slice(0, -10) + "modified!!";

// Verify
const result = QRTokenService.verifyToken(tampered);
console.log(result.tampered); // true
```

## 📊 Real-World Example: Complete Flow

```typescript
// 1. User verifies their Aadhaar
const verifiedDocument = {
  id: "aadhaar_123456789012",
  type: "aadhaar",
  status: "verified",
  hash: "abc123def456..."
};

// 2. User clicks "Generate QR"
const qrResponse = await handleGenerateQR({
  documentId: verifiedDocument.id,
  documentType: verifiedDocument.type,
  ownerName: "Rajesh Kumar",
  documentHash: verifiedDocument.hash,
  expirationDays: 365,
  metadata: {
    issuerName: "Bharat ID Platform",
    issueReason: "Personal Identity Verification"
  }
});

// 3. Display QR code in modal
const qrImage = await QRCodeGenerator.generateQRCode(
  qrResponse.verificationUrl
);

// 4. User shares QR code
// Recipient scans QR or clicks verification link

// 5. Verification page loads
const token = qrResponse.token;
const result = QRVerifier.verifyToken(token);

// 6. Display results
if (result.valid) {
  // Show green checkmark: ✅ Verified
  // Owner: Rajesh Kumar
  // Document: Aadhaar
  // Valid until: 14/05/2025
} else if (result.tampered) {
  // Show red alert: 🔴 Document has been tampered!
  // Do not accept
}
```

## 🚀 Deployment Checklist

- [ ] Secret key configured in environment
- [ ] Database migrations run (if using DB)
- [ ] HTTPS/SSL configured
- [ ] QR verification page deployed
- [ ] API endpoints tested
- [ ] Mobile view tested
- [ ] Error handling verified
- [ ] Analytics logging configured
- [ ] Rate limiting enabled
- [ ] Monitoring alerts set up

## 📖 Learn More

- [Full Documentation](./QR_VERIFICATION_DOCS.md)
- [Security Details](./QR_SECURITY.md)
- [Backend Integration](./QR_BACKEND.md)
- [Testing Guide](./QR_TESTING.md)

## 💡 Pro Tips

1. **Set realistic expiration**: 
   - Personal use: 1-2 years
   - Temporary verification: 30 days
   - Permanent records: 5-10 years

2. **Include metadata**: 
   Add context about why QR was issued

3. **Monitor verifications**: 
   Track unusual verification patterns

4. **Keep tokens safe**: 
   Don't share in public channels

5. **Test thoroughly**: 
   Test with different token states

6. **Mobile first**: 
   Always test on mobile devices

---

**Quick Links:**
- Generate QR: Click QR button on dashboard
- Verify QR: Scan or click verification link
- Support: contact@bharat-id.com
