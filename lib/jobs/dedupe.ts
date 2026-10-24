import { createHash } from "node:crypto";

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function jobFingerprint(input: { company: string; title: string; city: string | null }) {
  const payload = [
    normalizeToken(input.company),
    normalizeToken(input.title),
    normalizeToken(input.city ?? "unknown"),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export function stableIdFromUrl(url: string) {
  return createHash("sha256").update(url.trim().toLowerCase()).digest("hex").slice(0, 32);
}
