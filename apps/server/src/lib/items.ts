import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { savedItem, savedItemTag, tag } from "../schema";

export const MAX_CONTENT_BYTES = 262_144;
export const MAX_TITLE_LENGTH = 200;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 32;

export type ContentFormat = "markdown" | "plain";

export interface ItemSummary {
  id: string;
  title: string;
  contentFormat: ContentFormat;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function normalizeTagName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

const titleSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Title is required")
      .max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`),
  );

const contentSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "Content is required")
  .refine(
    (value) => new TextEncoder().encode(value).length <= MAX_CONTENT_BYTES,
    `Content must be at most ${Math.floor(MAX_CONTENT_BYTES / 1024)} KiB`,
  );

const tagsSchema = z
  .array(z.string())
  .default([])
  .transform((values) =>
    Array.from(
      new Set(values.map(normalizeTagName).filter((value) => value.length > 0)),
    ),
  )
  .pipe(
    z
      .array(
        z
          .string()
          .max(
            MAX_TAG_LENGTH,
            `Tags must be at most ${MAX_TAG_LENGTH} characters`,
          ),
      )
      .max(MAX_TAGS, `At most ${MAX_TAGS} tags are allowed`),
  );

export const createItemSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  contentFormat: z.enum(["markdown", "plain"]).default("plain"),
  tags: tagsSchema,
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export function parseCreateItemBody(body: unknown): CreateItemInput {
  return createItemSchema.parse(body);
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

export function toItemSummary(
  item: typeof savedItem.$inferSelect,
  tags: string[],
): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    contentFormat: item.contentFormat as ContentFormat,
    tags,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getItemTags(
  db: Db,
  itemIds: string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (itemIds.length === 0) return result;

  const rows = await db
    .select({
      savedItemId: savedItemTag.savedItemId,
      name: tag.name,
    })
    .from(savedItemTag)
    .innerJoin(tag, eq(savedItemTag.tagId, tag.id))
    .where(inArray(savedItemTag.savedItemId, itemIds))
    .orderBy(asc(tag.name));

  for (const row of rows) {
    const list = result.get(row.savedItemId) ?? [];
    list.push(row.name);
    result.set(row.savedItemId, list);
  }

  return result;
}

export async function getItemWithTags(
  db: Db,
  userId: string,
  itemId: string,
): Promise<(ItemSummary & { content: string }) | null> {
  const [item] = await db
    .select()
    .from(savedItem)
    .where(and(eq(savedItem.id, itemId), eq(savedItem.userId, userId)))
    .limit(1);

  if (!item) return null;

  const tags = (await getItemTags(db, [item.id])).get(item.id) ?? [];
  return { ...toItemSummary(item, tags), content: item.content };
}

export interface Cursor {
  createdAt: string;
  id: string;
}

function toBase64Url(value: string): string {
  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
}

export function encodeCursor(cursor: Cursor): string {
  return toBase64Url(JSON.stringify(cursor));
}

export function decodeCursor(value: string): Cursor | null {
  try {
    const parsed = JSON.parse(fromBase64Url(value)) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Cursor).createdAt === "string" &&
      typeof (parsed as Cursor).id === "string" &&
      !Number.isNaN(Date.parse((parsed as Cursor).createdAt))
    ) {
      return parsed as Cursor;
    }
  } catch {
    // Invalid cursors are treated as the first page.
  }
  return null;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
