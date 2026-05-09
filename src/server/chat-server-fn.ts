/**
 * TanStack Start Server Functions for AI Assistant Chat
 *
 * These are real server functions that run on the backend.
 * Uses createServerFn from @tanstack/react-start for full-stack type safety.
 */

import { createServerFn } from "@tanstack/react-start";

// ─── Knowledge Base ─────────────────────────────────────────────────────────

interface KnowledgeEntry {
  keywords: string[];
  response: string;
}

const BHARAT_ID_KNOWLEDGE: KnowledgeEntry[] = [
  {
    keywords: ["aadhaar", "aadhar", "uid", "uidai"],
    response:
      "**Aadhaar Card** is a 12-digit unique identity number issued by UIDAI.\n\n📋 **Key Information:**\n- You can update your Aadhaar details at the nearest enrollment center or online at uidai.gov.in\n- Link your Aadhaar with PAN for tax purposes (mandatory under Section 139AA)\n- Aadhaar can be used as valid ID proof for most government services\n\n🔄 **Common Updates:**\n- Address update — Submit new address proof\n- Mobile number update — Visit enrollment center\n- Name correction — Provide supporting documents\n\nNeed help with a specific Aadhaar-related query?",
  },
  {
    keywords: ["pan", "pan card", "income tax", "tax"],
    response:
      "**PAN Card** (Permanent Account Number) is a 10-character alphanumeric ID issued by the Income Tax Department.\n\n📋 **Key Uses:**\n- Filing income tax returns\n- Opening bank accounts\n- Financial transactions above ₹50,000\n- Buying/selling property\n\n🔗 **PAN-Aadhaar Linking:**\nPAN must be linked with Aadhaar (mandatory). You can link them on incometax.gov.in or by sending SMS to 567678.\n\n🔄 **Corrections:**\nApply for corrections via NSDL or UTIITSL portals.\n\nWould you like help with PAN verification or linking?",
  },
  {
    keywords: ["passport", "travel", "visa"],
    response:
      "**Passport** is an official travel document issued by the Ministry of External Affairs.\n\n📋 **Application Process:**\n1. Register on passportindia.gov.in\n2. Fill the application form online\n3. Pay fees and schedule appointment at PSK\n4. Visit with original documents\n5. Police verification\n6. Passport dispatched via Speed Post\n\n⏱️ **Processing Time:** Normal — 30-45 days | Tatkal — 1-3 days\n\n📄 **Required Documents:**\n- Proof of identity (Aadhaar/PAN/Voter ID)\n- Proof of address\n- Birth certificate (for minors)\n\nDo you need help with renewal or a new passport application?",
  },
  {
    keywords: ["driving", "license", "dl", "rto", "drive"],
    response:
      "**Driving License** is issued by the Regional Transport Office (RTO).\n\n📋 **How to Apply:**\n1. Apply for Learning License on parivahan.gov.in\n2. Pass the written test\n3. After 30 days, apply for permanent DL\n4. Pass the driving test at RTO\n\n🔄 **Renewal:**\n- Can be renewed 1 year before to 1 year after expiry\n- Apply online on parivahan.gov.in\n- No driving test needed for renewal\n\n📱 **Digital DL:**\nYour DL is available on DigiLocker and mParivahan app.\n\nNeed help with DL renewal or address update?",
  },
  {
    keywords: ["voter", "voter id", "election", "epic", "vote"],
    response:
      "**Voter ID (EPIC)** is issued by the Election Commission of India.\n\n📋 **How to Apply:**\n1. Visit voters.eci.gov.in or NVSP portal\n2. Fill Form 6 for new registration\n3. Submit supporting documents\n4. BLO verification at your address\n5. Voter ID card issued\n\n🔄 **Updates:**\n- **Form 6** — New registration\n- **Form 7** — Deletion/objection\n- **Form 8** — Correction of entries\n- **Form 8A** — Transposition within constituency\n\n📱 Available on Voter Helpline App.\n\nWould you like help registering or updating your Voter ID?",
  },
  {
    keywords: ["upload", "document", "scan", "submit"],
    response:
      "📤 **Uploading Documents to Bharat ID**\n\n**Supported Formats:** PDF, JPEG, PNG (max 10MB)\n\n**Steps:**\n1. Go to **Upload Document** from the sidebar\n2. Select your document type\n3. Upload a clear scan or photo\n4. Our OCR system auto-extracts key details\n5. Verify the extracted information\n6. Save to your secure vault\n\n💡 **Tips for best results:**\n- Ensure the document is well-lit and flat\n- All text should be clearly visible\n- Avoid blurry or tilted images\n- Crop out unnecessary background\n\nNeed help uploading a specific document?",
  },
  {
    keywords: ["verify", "verification", "status", "check"],
    response:
      "🔍 **Document Verification on Bharat ID**\n\nVerification happens automatically after upload. Here's how it works:\n\n1. **OCR Extraction** — We read key details from your document\n2. **Format Validation** — Document numbers are checked for proper format\n3. **Cross-Reference** — Details are compared across linked documents\n4. **Status Update** — Your dashboard shows real-time verification status\n\n📊 **Verification Statuses:**\n- ✅ **Verified** — Document is valid and verified\n- ⚠️ **Expiring Soon** — Document expires within 6 months\n- ❌ **Missing** — Document not yet uploaded\n- 🔄 **Pending** — Verification in progress\n\nCheck your **Identity Health Score** on the dashboard for an overview!",
  },
  {
    keywords: ["qr", "share", "sharing", "consent"],
    response:
      "📱 **QR Code & Secure Sharing**\n\nBharat ID lets you share verified documents securely:\n\n**Generate QR Code:**\n1. Open any verified document\n2. Click the QR icon on the document card\n3. Set an expiry time for the QR code\n4. Share the QR with the verifier\n\n**Security Features:**\n- 🔒 Time-limited access (expires after set duration)\n- 🛡️ Consent-based sharing — you control what's shared\n- 📋 Audit trail — see who accessed your documents\n- 🔐 Encrypted data transmission\n\nOnly share QR codes with trusted entities!",
  },
  {
    keywords: ["help", "support", "contact", "issue", "problem"],
    response:
      "🆘 **Need Help?**\n\nHere's how I can assist you:\n\n📋 **Document Help:**\n- Upload and verify government IDs\n- Check verification status\n- Understand document requirements\n\n🔄 **Procedure Guidance:**\n- Step-by-step government processes\n- Required documents for various services\n- Renewal and update procedures\n\n🔒 **Security:**\n- Manage shared access\n- View audit logs\n- Update security settings\n\n💡 **Quick Commands:**\n- \"How to upload Aadhaar?\"\n- \"Check my verification status\"\n- \"Renew my passport\"\n- \"Link PAN with Aadhaar\"\n\nJust type your question and I'll guide you!",
  },
  {
    keywords: ["hello", "hi", "hey", "namaste", "greetings"],
    response:
      "🙏 **Namaste! Welcome to Bharat ID Assistant**\n\nI'm here to help you manage your government IDs. Here's what I can do:\n\n• 📄 Help you upload and verify documents\n• 🔍 Explain government procedures\n• 📱 Guide you through QR sharing\n• 🔒 Answer security questions\n• 📋 Suggest missing documents\n\nWhat would you like help with today?",
  },
  {
    keywords: ["consistency", "mismatch", "discrepancy", "error", "difference"],
    response:
      "🔎 **Consistency Checker**\n\nBharat ID's Consistency Checker scans across all your documents to find mismatches:\n\n**What it checks:**\n- Name spelling across documents\n- Date of birth consistency\n- Address matching\n- Father's/spouse name\n- Gender information\n\n**How to use:**\n1. Go to **Consistency Checker** from the sidebar\n2. Click **Run Check**\n3. Review flagged discrepancies\n4. Follow suggested corrections\n\n⚠️ **Why it matters:**\nInconsistent details can cause rejection in:\n- Bank KYC verification\n- Passport applications\n- Government subsidy claims\n- Property registrations\n\nWould you like me to explain how to fix a specific mismatch?",
  },
  {
    keywords: ["autofill", "form", "fill", "auto"],
    response:
      "⚡ **Smart Autofill**\n\nBharat ID can auto-fill forms using your verified documents:\n\n**How it works:**\n1. Go to **Autofill Form** from Quick Actions\n2. Select the form type (KYC, Passport, Tax, etc.)\n3. Choose which documents to use as data source\n4. Review pre-filled information\n5. Submit the completed form\n\n**Supported Forms:**\n- 🏦 Bank KYC forms\n- ✈️ Passport application\n- 📊 Tax filing forms\n- 🏠 Property registration\n- 🎓 Educational enrollment\n\nAll data is pulled from your verified vault — no manual typing needed!",
  },
  {
    keywords: ["security", "privacy", "safe", "protect", "encrypt"],
    response:
      "🔒 **Security & Privacy on Bharat ID**\n\nYour data security is our top priority:\n\n**Data Protection:**\n- 🔐 AES-256 encryption for all stored documents\n- 🛡️ End-to-end encryption for data sharing\n- 🔑 Consent-based access only\n- 📋 Complete audit trail of all access\n\n**Your Controls:**\n- Manage who can access your documents\n- Set time limits on shared access\n- Revoke access anytime\n- View all access logs\n\n**Compliance:**\n- Follows IT Act 2000 guidelines\n- Aadhaar Act 2016 compliant\n- CERT-In security standards\n\nGo to **Security Settings** in the sidebar to manage your preferences.",
  },
];

// ─── Intent Detection & Response Generation ─────────────────────────────────

function detectIntentAndRespond(message: string): string {
  const lowerMsg = message.toLowerCase().trim();

  // Find best matching knowledge entry
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of BHARAT_ID_KNOWLEDGE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerMsg.includes(keyword)) {
        score += keyword.length; // Longer keyword matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response;
  }

  // Fallback response
  return `I understand you're asking about "${message}". Here are some things I can help with:\n\n• 📄 **Document Management** — Upload, verify, and manage your IDs\n• 🔄 **Government Procedures** — Step-by-step guidance\n• 📱 **QR Sharing** — Securely share verified documents\n• 🔒 **Security** — Privacy and access control\n• 🔎 **Consistency Checker** — Find mismatches across documents\n\nTry asking about a specific document (Aadhaar, PAN, Passport, etc.) or a procedure!`;
}

// ─── Quick Suggestions ──────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  "How do I upload my Aadhaar?",
  "Check my verification status",
  "How to renew passport?",
  "Link PAN with Aadhaar",
  "How does QR sharing work?",
  "What is Consistency Checker?",
];

// ─── Server Functions ───────────────────────────────────────────────────────

/**
 * Send a message to the AI assistant and get a response.
 * Runs on the server — the client only sees the typed return value.
 */
export const chatWithAssistant = createServerFn({ method: "POST" })
  .validator(
    (data: { message: string; conversationHistory?: Array<{ role: string; content: string }> }) => data,
  )
  .handler(async ({ data }) => {
    const { message } = data;

    // Small artificial delay to feel natural
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    const response = detectIntentAndRespond(message);

    return {
      id: crypto.randomUUID(),
      role: "assistant" as const,
      content: response,
      timestamp: new Date().toISOString(),
    };
  });

/**
 * Get quick suggestion prompts for the chat
 */
export const getQuickSuggestions = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      suggestions: QUICK_SUGGESTIONS,
    };
  },
);
