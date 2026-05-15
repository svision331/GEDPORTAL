/**
 * AES-256-GCM encryption for sensitive settings stored in the DB.
 * Requires SETTINGS_ENCRYPTION_KEY env var: a 64-char hex string (32 bytes).
 *
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "SETTINGS_ENCRYPTION_KEY";
const PREFIX = "enc:v1:"; // prefix to identify encrypted values

function getKey(): Buffer {
  const hex = process.env[KEY_ENV];
  if (!hex || hex.length !== 64) {
    throw new Error(
      `${KEY_ENV} must be set to a 64-character hex string. ` +
      `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith(PREFIX)) {
    // Legacy plaintext value — return as-is (handles migration period)
    return ciphertext;
  }
  const key = getKey();
  const parts = ciphertext.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted value format");
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString("utf8") + decipher.final("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
