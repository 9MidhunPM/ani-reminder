import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function getEncryptionKey() {
  const encoded = process.env.DATA_ENCRYPTION_KEY;
  if (!encoded) throw new Error("DATA_ENCRYPTION_KEY is required");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes encoded as base64");
  return key;
}

export function isEncryptedSecret(value: string) {
  return value.startsWith(PREFIX);
}

export function encryptSecret(value: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([nonce, tag, ciphertext]).toString("base64url")}`;
}

export function decryptSecret(value: string) {
  if (!isEncryptedSecret(value)) return value;
  const payload = Buffer.from(value.slice(PREFIX.length), "base64url");
  if (payload.length < 29) throw new Error("Encrypted secret is invalid");
  const nonce = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
