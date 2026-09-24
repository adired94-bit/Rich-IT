import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from "node:crypto";

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const raw = process.env.VAULT_ENCRYPTION_KEY;
  if (!raw) throw new Error("VAULT_ENCRYPTION_KEY is not set (openssl rand -base64 32).");
  const buf = raw.length === 64 && /^[0-9a-f]+$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("VAULT_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return buf;
}

/** Encrypts arbitrary JSON with AES-256-GCM. Output: iv.tag.ciphertext (base64url). */
export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((b) => b.toString("base64url")).join(".");
}

export function decryptJson<T = unknown>(payload: string): T {
  const [ivB, tagB, dataB] = payload.split(".");
  if (!ivB || !tagB || !dataB) throw new Error("Malformed vault payload");
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB, "base64url")), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}

/** HMAC signature for public approval links: /approve/<id>?t=<token> */
export function signApproval(workOrderId: string, approvalToken: string): string {
  const secret = process.env.APPROVAL_LINK_SECRET ?? process.env.VAULT_ENCRYPTION_KEY ?? "dev-secret";
  return createHmac("sha256", secret).update(`${workOrderId}:${approvalToken}`).digest("base64url").slice(0, 32);
}

export function verifyApproval(workOrderId: string, approvalToken: string, signature: string): boolean {
  const expected = signApproval(workOrderId, approvalToken);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Stable token protecting the public ICS calendar feed (Google Calendar subscription URL). */
export function icsFeedToken(): string {
  const secret = process.env.APPROVAL_LINK_SECRET ?? process.env.VAULT_ENCRYPTION_KEY ?? "dev-secret";
  return createHmac("sha256", secret).update("calendar-ics-feed").digest("base64url").slice(0, 32);
}

export function verifyIcsFeedToken(token: string): boolean {
  const expected = icsFeedToken();
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  return a.length === b.length && timingSafeEqual(a, b);
}
