import { createHash, timingSafeEqual } from "node:crypto";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function tokenMatches(raw: string, hash: string): boolean {
  const a = Buffer.from(hashToken(raw));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
