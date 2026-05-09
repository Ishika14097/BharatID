import crypto from "crypto";
import fs from "fs";
import path from "path";

const ENCRYPTION_ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

export function encryptFile(filePath: string, outputPath: string): void {
  const fileContent = fs.readFileSync(filePath);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(fileContent);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Prepend IV to the encrypted data
  const encryptedWithIv = Buffer.concat([iv, encrypted]);
  fs.writeFileSync(outputPath, encryptedWithIv);
}

export function decryptFile(filePath: string): Buffer {
  const encryptedData = fs.readFileSync(filePath);

  // Extract IV from the beginning
  const iv = encryptedData.slice(0, 16);
  const encrypted = encryptedData.slice(16);

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    ENCRYPTION_KEY,
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

export function hashFile(filePath: string): string {
  const fileContent = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileContent).digest("hex");
}
