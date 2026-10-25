import { Hono } from "hono";
import {
  and,
  desc,
  eq,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { createDb } from "../db";
import { savedItem, savedItemTag, tag } from "../schema";
import {
  decodeCursor,
  encodeCursor,
  escapeLikePattern,
  formatZodError,
  getItemTags,
  getItemWithTags,
  normalizeTagName,
  parseCreateItemBody,
  toItemSummary,
  MAX_CONTENT_BYTES,
} from "../lib/items";
import type { AppEnv } from "../types";

const items = new Hono<AppEnv>();

const limitSchema = z.coerce.number().int().min(1).max(100).default(50);

function noStore(c: { header: (name: string, value: string) => void }) {
  c.header("Cache-Control", "no-store");
}

items.get("/", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);

  const q = c.req.query("q")?.trim().slice(0, 100) ?? "";
  const rawTag = c.req.query("tag")?.trim() ?? "";
  const tagFilter = rawTag ? normalizeTagName(rawTag) : "";
  const limit = limitSchema.parse(c.req.query("limit") ?? "50");
  const cursor = decodeCursor(c.req.query("cursor") ?? "");

  const conditions = [eq(savedItem.userId, userId)];

  if (q) {
    const pattern = `%${escapeLikePattern(q)}%`;
    conditions.push(
      or(
        sql`${savedItem.title} ILIKE ${pattern} ESCAPE '\\'`,
        sql`${savedItem.content} ILIKE ${pattern} ESCAPE '\\'`,
      )!,
    );
  }

  if (tagFilter) {
    conditions.push(
      inArray(
        savedItem.id,
        db
          .select({ id: savedItemTag.savedItemId })
          .from(savedItemTag)
          .innerJoin(tag, eq(savedItemTag.tagId, tag.id))
          .where(and(eq(tag.userId, userId), eq(tag.name, tagFilter))),
      ),
    );
  }

  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);
    conditions.push(
      or(
        lt(savedItem.createdAt, cursorDate),
        and(eq(savedItem.createdAt, cursorDate), lt(savedItem.id, cursor.id)),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(savedItem)
    .where(and(...conditions))
    .orderBy(desc(savedItem.createdAt), desc(savedItem.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const tagsByItem = await getItemTags(
    db,
    page.map((item) => item.id),
  );

  const last = page.at(-1);

  noStore(c);
  return c.json({
    items: page.map((item) =>
      toItemSummary(item, tagsByItem.get(item.id) ?? []),
    ),
    nextCursor:
      hasMore && last
        ? encodeCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null,
  });
});

items.post("/", async (c) => {
  const userId = c.get("user").id;

  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return c.json(
      {
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Content-Type must be application/json",
        },
      },
      415,
    );
  }

  const rawBody = await c.req.text();
  if (new TextEncoder().encode(rawBody).length > MAX_CONTENT_BYTES + 16_384) {
    return c.json(
      {
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Request body is too large",
        },
      },
      413,
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      },
      400,
    );
  }

  let input;
  try {
    input = parseCreateItemBody(parsedBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: formatZodError(error),
          },
        },
        422,
      );
    }
    throw error;
  }

  const db = createDb(c.env.DATABASE_URL);
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(savedItem).values({
    id,
    userId,
    title: input.title,
    content: input.content,
    contentFormat: input.contentFormat,
    createdAt: now,
    updatedAt: now,
  });

  let itemTags: string[] = [];

  if (input.tags.length > 0) {
    await db
      .insert(tag)
      .values(
        input.tags.map((name) => ({
          id: crypto.randomUUID(),
          userId,
          name,
        })),
      )
      .onConflictDoNothing();

    const tagRows = await db
      .select({ id: tag.id, name: tag.name })
      .from(tag)
      .where(and(eq(tag.userId, userId), inArray(tag.name, input.tags)));

    const byName = new Map(tagRows.map((row) => [row.name, row.id]));
    itemTags = input.tags.filter((name) => byName.has(name));

    if (itemTags.length > 0) {
      await db
        .insert(savedItemTag)
        .values(
          itemTags.map((name) => ({
            savedItemId: id,
            tagId: byName.get(name)!,
          })),
        )
        .onConflictDoNothing();
    }
  }

  noStore(c);
  return c.json(
    toItemSummary(
      {
        id,
        userId,
        title: input.title,
        content: input.content,
        contentFormat: input.contentFormat,
        createdAt: now,
        updatedAt: now,
      },
      itemTags,
    ),
    201,
  );
});

items.get("/:id", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);
  const item = await getItemWithTags(db, userId, c.req.param("id"));

  if (!item) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Saved item not found" } },
      404,
    );
  }

  noStore(c);
  return c.json(item);
});

items.delete("/:id", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);

  const deleted = await db
    .delete(savedItem)
    .where(
      and(eq(savedItem.id, c.req.param("id")), eq(savedItem.userId, userId)),
    )
    .returning({ id: savedItem.id });

  if (deleted.length === 0) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Saved item not found" } },
      404,
    );
  }

  c.header("Cache-Control", "no-store");
  return c.body(null, 204);
});

export default items;
