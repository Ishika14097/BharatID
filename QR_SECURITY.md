# QR Verification System - Security Documentation

## 🔐 Overview

This document details the security mechanisms, threat models, and best practices for the QR-based document verification system.

## 🛡️ Security Mechanisms

### 1. Cryptographic Signing (HMAC-SHA256)

**Purpose**: Ensures token authenticity and prevents tampering

**Algorithm**: HMAC-SHA256
- Hash Function: SHA-256
- Key: Secret key (minimum 32 bytes)
- Output: 64-character hex string

**Implementation**:
```typescript
const signature = crypto
  .createHmac("sha256", QR_SECRET_KEY)
  .update(payloadString)
  .digest("hex");
```

**Benefits**:
- Fast (SHA-256 is optimized)
- Secure (HMAC is cryptographically secure)
- Non-reversible (cannot recover key from signature)
- Widely supported

### 2. Token Expiration

**Purpose**: Limits window of validity for verification codes

**Mechanism**:
- Each token includes `issuedAt` and `expiresAt` timestamps
- Verification checks if current time > expiresAt
- If expired, token is rejected even with valid signature

**Configuration**:
```typescript
// Customizable per token
const expirationDays = 365; // Default 1 year
const expiresAt = now + expirationDays * 24 * 60 * 60 * 1000;
```

### 3. Payload Encoding (Base64)

**Purpose**: Safe encoding for URL and storage

**Process**:
```
Plaintext JSON → Base64 Encoding → URL-safe string
```

**Not for security**:
- Base64 is reversible
- Anyone can decode the payload
- Signature provides the security, not encoding

### 4. Document Hash Validation

**Purpose**: Optional verification that document hasn't changed

**Implementation**:
```typescript
const documentHash = crypto
  .createHash("sha256")
  .update(documentContent)
  .digest("hex");
```

**Workflow**:
1. On generation: Store document SHA-256 hash
2. On verification: Recalculate hash of document
3. Compare hashes
4. If different: Document has been modified

## ⚠️ Threat Models & Mitigations

### Threat 1: Token Tampering

**Attack**: Modify token payload to change owner name or document type

**Mitigation**:
```
❌ Attacker cannot forge valid signature
❌ Without secret key, cannot recalculate HMAC
❌ Any change to payload invalidates signature
✅ Verification detects immediately
```

**Protection Level**: 🟢 Secure

### Threat 2: Token Forgery

**Attack**: Create entirely new valid-looking token

**Mitigation**:
```
❌ Secret key is required to generate valid signature
❌ Without access to server secret, cannot create valid token
❌ Each generated token has unique signature
✅ Only authorized server can generate tokens
```

**Protection Level**: 🟢 Secure

### Threat 3: Replay Attacks

**Attack**: Use old/expired token to gain access

**Mitigation**:
```
❌ Tokens have expiration timestamps
❌ Expired tokens are rejected
❌ Server tracks verification timestamp
✅ Each verification can be logged and monitored
```

**Protection Level**: 🟢 Secure

### Threat 4: Secret Key Exposure

**Attack**: Attacker gains access to secret key

**Impact**:
```
⚠️ Could forge any token
⚠️ Could verify any QR code
⚠️ Could modify existing tokens
```

**Mitigation**:
```
✅ Secret key stored securely (environment variables)
✅ Not in version control
✅ Not in compiled code
✅ Accessible only to authorized processes
✅ Rotated periodically
✅ Different keys per environment
```

**Recovery**:
1. Generate new secret key
2. Invalidate all old tokens
3. Regenerate new tokens if needed
4. Update monitoring

**Protection Level**: 🟡 Depends on infrastructure

### Threat 5: Man-in-the-Middle (MITM)

**Attack**: Intercept token during transmission

**Mitigation**:
```
✅ HTTPS/TLS encryption (encrypted in transit)
✅ Certificate pinning (optional)
✅ Signature validation (ensures authenticity)
❌ Attacker still sees token in HTTPS (encrypted)
```

**Protection Level**: 🟢 Secure with HTTPS

### Threat 6: Token Reuse

**Attack**: Use same token multiple times

**Mitigation**:
```
✅ Tokens can be used multiple times (by design)
✅ Verifications are logged and tracked
✅ Unusual patterns can be detected
✅ Admin can revoke tokens if needed
```

**Protection Level**: 🟡 Depends on monitoring

### Threat 7: Brute Force Attack

**Attack**: Try to guess valid tokens

**Mitigation**:
```
✅ Token is very long (300+ characters)
✅ Signature is cryptographically random
✅ Guessing would take centuries
✅ Server can rate-limit verification attempts
✅ Failed attempts can trigger alerts
```

**Protection Level**: 🟢 Secure

### Threat 8: QR Code Interception

**Attack**: Intercept QR code before recipient

**Mitigation**:
```
✅ Can be sent via secure channels (WhatsApp, email)
✅ QR code is just encoded token (same protection)
✅ Image can't be modified (only token matters)
❌ If public, anyone can scan it
```

**Protection Level**: 🟡 Depends on distribution

## 🔑 Secret Key Management

### Generation
```bash
# Generate 32-byte random secret (256-bit)
openssl rand -hex 32
# Output: abc123def456...xyz (64 hex characters)
```

### Storage
```bash
# .env (never commit to git)
QR_SECRET_KEY=abc123def456...xyz

# Environment variable
export QR_SECRET_KEY=abc123def456...xyz

# Vault/Secrets Manager (production)
aws secretsmanager create-secret --name qr-secret-key --secret-string abc123...
```

### Rotation Strategy
```
Current Key: KEY_A (active)
        ↓ (rotation begins)
New Key: KEY_B (active)
Old Key: KEY_A (grace period: 30 days)
        ↓ (grace period ends)
Old Key: KEY_A (deactivated)
```

### Rotation Implementation
```typescript
const ACTIVE_KEY = process.env.QR_SECRET_KEY;
const PREVIOUS_KEY = process.env.QR_PREVIOUS_KEY;

function verifyWithRotation(token: string): boolean {
  // Try current key first
  if (verify(token, ACTIVE_KEY)) return true;
  
  // Try previous key (grace period)
  if (PREVIOUS_KEY && verify(token, PREVIOUS_KEY)) return true;
  
  return false;
}
```

## 🛡️ Additional Security Layers

### 1. Input Validation

```typescript
// Validate token format before processing
function validateTokenFormat(token: string): boolean {
  // Must contain exactly one dot separator
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  
  // Both parts must be non-empty
  if (!parts[0] || !parts[1]) return false;
  
  // Length checks
  if (parts[0].length > 500) return false; // Payload too large
  if (parts[1].length !== 64) return false; // Invalid signature length
  
  return true;
}
```

### 2. Rate Limiting

```typescript
// Limit verification attempts
const verificationAttempts = new Map<string, number>();

function checkRateLimit(ipAddress: string): boolean {
  const attempts = verificationAttempts.get(ipAddress) || 0;
  
  if (attempts > 100) { // Max 100 per hour
    logSecurityAlert("Rate limit exceeded", ipAddress);
    return false;
  }
  
  verificationAttempts.set(ipAddress, attempts + 1);
  return true;
}
```

### 3. Logging & Monitoring

```typescript
// Log all verification attempts
function logVerification(token: string, result: any, ipAddress: string) {
  logger.info("QR Verification Attempt", {
    timestamp: new Date().toISOString(),
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    result: result.valid ? "SUCCESS" : result.expired ? "EXPIRED" : "FAILED",
    ipAddress,
    userAgent: req.headers["user-agent"]
  });
}

// Alert on suspicious activity
function detectAnomalies(logs: any[]) {
  // High failure rate from single IP
  if (logs.filter(l => !l.valid).length > 10 in 5 minutes) {
    alert("Suspicious verification failures from: " + ipAddress);
  }
  
  // Unusual verification time
  if (isMiddleOfNight() && verificationCount > threshold) {
    alert("Unusual verification activity detected");
  }
  
  // Geographic anomaly
  if (previousIP_Country !== currentIP_Country) {
    alert("Verification from new country: " + country);
  }
}
```

### 4. SSL/TLS Configuration

```typescript
// Ensure HTTPS only
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === "production") {
    return res.redirect(307, `https://${req.host}${req.originalUrl}`);
  }
  next();
});

// Security headers
app.use(helmet()); // X-Frame-Options, X-XSS-Protection, etc.

// CORS configuration
app.use(cors({
  origin: ["https://bharat-id.com"],
  credentials: true
}));
```

### 5. OWASP Top 10 Protections

| Vulnerability | Mitigation |
|----------------|-----------|
| Injection | Input validation, parameterized queries |
| Broken Auth | Signature validation, token expiration |
| XSS | HTML escaping, CSP headers |
| XXE | Disable XML features, input validation |
| Broken Access | User verification, permission checks |
| Crypto Failure | HMAC-SHA256, TLS/SSL |
| Auth Bypass | Signature verification, server-side validation |
| Data Exposure | HTTPS, no sensitive data in logs |
| SSRF | URL validation, firewall rules |
| Vulnerable Deps | Regular updates, dependency scanning |

## 📋 Security Checklist

### Development
- [ ] Secret key never committed to git
- [ ] .env file in .gitignore
- [ ] Input validation on all endpoints
- [ ] HTTPS used for all communications
- [ ] Error messages don't leak information
- [ ] Logging doesn't record sensitive data
- [ ] Dependencies up to date

### Testing
- [ ] Unit tests for verification logic
- [ ] Test with tampered tokens
- [ ] Test with expired tokens
- [ ] Test with invalid signatures
- [ ] Test rate limiting
- [ ] Test CORS configuration
- [ ] Test with various inputs

### Staging
- [ ] Secret key configured
- [ ] HTTPS working
- [ ] Monitoring active
- [ ] Logging verified
- [ ] Rate limiting tested
- [ ] Error pages don't leak info

### Production
- [ ] Secret key in vault/secrets manager
- [ ] HTTPS certificate valid (auto-renew)
- [ ] WAF configured
- [ ] DDoS protection enabled
- [ ] Monitoring and alerts active
- [ ] Incident response plan ready
- [ ] Backups configured
- [ ] Audit logs retained

## 🚨 Incident Response

### If Secret Key is Compromised

1. **Immediate** (0-5 minutes)
   - Revoke current secret key
   - Generate new secret key
   - Update environment variables
   - Restart services

2. **Short-term** (5-60 minutes)
   - Invalidate all existing tokens
   - Notify users
   - Begin token regeneration
   - Monitor for misuse

3. **Medium-term** (1-24 hours)
   - Regenerate all valid tokens
   - Review verification logs
   - Investigate cause
   - Update security procedures

4. **Long-term** (ongoing)
   - Conduct security audit
   - Review access controls
   - Update documentation
   - Implement improvements

### If Tampering is Detected

1. **Alert**
   - Log incident
   - Notify administrators
   - Block further verifications if critical

2. **Investigate**
   - Review verification logs
   - Check for related incidents
   - Identify source/attacker

3. **Respond**
   - Revoke affected tokens
   - Notify affected users
   - Update documentation

4. **Prevent**
   - Strengthen monitoring
   - Review access logs
   - Update security procedures

## 📞 Support

For security issues or concerns:
1. **Do not** post in public channels
2. **Do** email: security@bharat-id.com
3. **Do** use encrypted communication if possible
4. **Do** provide detailed information about issue

## 📚 References

- OWASP: https://owasp.org/Top10/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- HMAC-SHA256: https://en.wikipedia.org/wiki/HMAC
- Token Security: https://tools.ietf.org/html/rfc6749

---

**Version**: 1.0.0
**Last Updated**: May 2024
**Security Level**: 🟢 High
**Audit Status**: Pending
