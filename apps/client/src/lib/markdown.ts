import type { ContentFormat } from "./types";

export const MAX_CONTENT_BYTES = 262_144;

const SIGNALS: RegExp[] = [
  /^#{1,6}\s+/m,
  /^```|^~~~/m,
  /^[-*+]\s+/m,
  /^\d+\.\s+/m,
  /\[[^\]]+\]\([^)]+\)/,
  /^>\s+/m,
  /^\|.*\|/m,
  /(\*\*|__)[^]+?(\*\*|__)/,
  /(^|[^*])\*[^*\n]+\*/m,
  /`[^`\n]+`/,
];

export function detectFormat(content: string): ContentFormat {
  let score = 0;
  for (const signal of SIGNALS) {
    if (signal.test(content)) score += 1;
  }
  return score >= 2 ? "markdown" : "plain";
}

export function suggestTitle(content: string): string {
  const lines = content.split(/\r?\n/);
  const heading = lines
    .map((line) => line.match(/^#{1,6}\s+(.+)$/)?.[1]?.trim())
    .find((value) => Boolean(value));

  const firstLine =
    heading ??
    lines.map((line) => line.trim()).find((line) => line.length > 0) ??
    "";

  const cleaned = firstLine
    .replace(/^[#>*+-]+\s*/, "")
    .replace(/^\d+\.\s*/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Untitled paste";
  return cleaned.length > 80 ? `${cleaned.slice(0, 77).trimEnd()}…` : cleaned;
}

export function contentByteLength(content: string): number {
  return new TextEncoder().encode(content).length;
}
