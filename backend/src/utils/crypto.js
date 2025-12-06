import crypto from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

export const hashValue = (value) => {
  return crypto.createHash("sha256").update(value || "").digest("hex");
};

export const encryptText = (plainText) => {
  if (!env.encryptionKey || env.encryptionKey.length < KEY_LENGTH) {
    throw new Error("Missing or invalid ENCRYPTION_KEY");
  }
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(env.encryptionKey.slice(0, KEY_LENGTH));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptText = (encrypted) => {
  const buffer = Buffer.from(encrypted, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const key = Buffer.from(env.encryptionKey.slice(0, KEY_LENGTH));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
};
