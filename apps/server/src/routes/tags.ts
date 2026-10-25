import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "../db";
import { tag, tagNote } from "../schema";
import { formatZodError } from "../lib/items";
import type { AppEnv } from "../types";

const tags = new Hono<AppEnv>();

const MAX_TAG_NOTE_LENGTH = 20_000;

const tagNoteSchema = z.object({
  content: z
    .string()
    .max(
      MAX_TAG_NOTE_LENGTH,
      `Note must be at most ${MAX_TAG_NOTE_LENGTH.toLocaleString()} characters`,
    ),
});

type Db = ReturnType<typeof createDb>;

async function findOwnedTag(db: Db, userId: string, tagId: string) {
  const [owned] = await db
    .select({ id: tag.id })
    .from(tag)
    .where(and(eq(tag.id, tagId), eq(tag.userId, userId)))
    .limit(1);
  return owned ?? null;
}

function noStore(c: { header: (name: string, value: string) => void }) {
  c.header("Cache-Control", "no-store");
}

tags.get("/", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);

  const rows = await db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(eq(tag.userId, userId))
    .orderBy(asc(tag.name));

  noStore(c);
  return c.json({ tags: rows });
});

tags.get("/:id/note", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);
  const tagId = c.req.param("id");

  if (!(await findOwnedTag(db, userId, tagId))) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Tag not found" } },
      404,
    );
  }

  const [note] = await db
    .select({
      content: tagNote.content,
      updatedAt: tagNote.updatedAt,
    })
    .from(tagNote)
    .where(eq(tagNote.tagId, tagId))
    .limit(1);

  noStore(c);
  return c.json({
    note: {
      tagId,
      content: note?.content ?? "",
      updatedAt: note?.updatedAt ?? null,
    },
  });
});

tags.put("/:id/note", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);
  const tagId = c.req.param("id");

  if (!(await findOwnedTag(db, userId, tagId))) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Tag not found" } },
      404,
    );
  }

  let input: z.infer<typeof tagNoteSchema>;
  try {
    input = tagNoteSchema.parse(await c.req.json());
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

  const now = new Date();
  const [note] = await db
    .insert(tagNote)
    .values({
      tagId,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tagNote.tagId,
      set: { content: input.content, updatedAt: now },
    })
    .returning({
      content: tagNote.content,
      updatedAt: tagNote.updatedAt,
    });

  noStore(c);
  return c.json({ note: { tagId, ...note } });
});

export default tags;
