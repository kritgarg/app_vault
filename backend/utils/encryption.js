import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard IV length for GCM (96 bits)
const KEY_LENGTH = 32; // 32 bytes (256 bits) for AES-256

let encryptionKey;

// Initialize the 256-bit encryption key from environment variables.
if (process.env.ENCRYPTION_KEY) {
  // Key should be provided as a 64-character hex string (32 bytes)
  const rawKey = process.env.ENCRYPTION_KEY.trim();
  if (rawKey.length !== 64) {
    throw new Error(`Invalid ENCRYPTION_KEY length: Must be exactly 64 hex characters. Got ${rawKey.length}`);
  }
  encryptionKey = Buffer.from(rawKey, "hex");
} else {
  // If not defined, look for BETTER_AUTH_SECRET as a fallback for development.
  // In production, this fallback should fail.
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY is required in production environments.");
  }
  console.warn("WARNING: ENCRYPTION_KEY not set. Falling back to deriving key from BETTER_AUTH_SECRET.");
  const secret = process.env.BETTER_AUTH_SECRET || "default_auth_secret_fallback";
  encryptionKey = crypto.scryptSync(secret, "salt", KEY_LENGTH);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param {string} text - The plaintext string to encrypt.
 * @returns {string} The encrypted representation formatted as `iv:authTag:ciphertext` in hex.
 */
export function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Return a single combined string to store in the database column
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted ciphertext string back into plaintext using AES-256-GCM.
 * @param {string} encryptedText - The formatted cipher text `iv:authTag:ciphertext`.
 * @returns {string} The decrypted plaintext string.
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected iv:authTag:ciphertext");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const ciphertext = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
