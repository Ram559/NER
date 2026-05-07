import crypto from "node:crypto";
import sanitizeHtml from "sanitize-html";

const HUNGARIAN_STOPWORDS = new Set([
  "a",
  "az",
  "egy",
  "es",
  "vagy",
  "hogy",
  "mint",
  "nem",
  "is",
  "meg",
  "be",
  "ki",
  "fel",
  "le",
  "el",
  "ra",
  "re",
  "ban",
  "ben",
  "rol",
  "rol",
  "tol",
  "ig",
  "utan",
  "szerint"
]);

export function cleanText(value: string | undefined | null): string {
  return sanitizeHtml(value ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForMatch(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stableHash(value: string): string {
  return crypto.createHash("sha256").update(normalizeForMatch(value)).digest("hex");
}

export function keywordFingerprint(title: string): string {
  const words = normalizeForMatch(title)
    .split(" ")
    .filter((word) => word.length > 2 && !HUNGARIAN_STOPWORDS.has(word))
    .slice(0, 10);

  return stableHash(words.sort().join(" "));
}

export function compactSentences(value: string, maxSentences = 2): string {
  const parts = cleanText(value)
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, maxSentences).join(" ").slice(0, 650);
}

export function stripSummaryBoilerplate(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = cleanText(value)
    .replace(/^Források szerint az ügy lényege:\s*/i, "")
    .replace(/^Forrasok szerint az ugy lenyege:\s*/i, "")
    .trim();
  return cleaned || null;
}

export function canonicalizeUrl(url: string): string {
  const parsed = new URL(url);
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) =>
    parsed.searchParams.delete(key)
  );
  parsed.hash = "";
  return parsed.toString();
}
