import crypto from "crypto";
import { TOKEN_SECRET } from "../config.js";

const algorithm = "aes-256-gcm";
const key = Buffer.from(TOKEN_SECRET, "hex");

export function encodeUrl(url, expiresInMs = 1000 * 60 * 30) {
  const iv = crypto.randomBytes(12);
  const expiresAt = Date.now() + expiresInMs;
  const payload = JSON.stringify({ url, expiresAt });
  console.log("Encoding token payload:", { url, expiresAt });

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(payload, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Must be iv + authTag + encrypted
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decodeUrl(token) {
  const data = Buffer.from(token, "base64url");

  // First 12 bytes are IV
  const iv = data.subarray(0, 12);
  // Next 16 bytes are authTag
  const authTag = data.subarray(12, 28);
  // Rest is ciphertext
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");

  const parsed = JSON.parse(decrypted);
  console.log("Decoded token payload:", parsed);

  const { url, expiresAt } = parsed;

  if (Date.now() > expiresAt) {
    const err = new Error("Token expired");
    err.code = "TOKEN_EXPIRED";
    throw err;
  }

  // Return the entire object so url is present
  return parsed;
}
