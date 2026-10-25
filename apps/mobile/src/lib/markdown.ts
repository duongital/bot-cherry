import type { ContentFormat } from "./types";

export const MAX_CONTENT_BYTES = 262_144;
export const MAX_TITLE_LENGTH = 200;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 32;
export const MAX_TAG_NOTE_LENGTH = 20_000;

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

/**
 * Hermes does not always provide TextEncoder. Count UTF-8 bytes directly so
 * the mobile limit matches the server's TextEncoder-based check.
 */
export function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    bytes +=
      codePoint < 0x80
        ? 1
        : codePoint < 0x800
          ? 2
          : codePoint < 0x10000
            ? 3
            : 4;
  }
  return bytes;
}
