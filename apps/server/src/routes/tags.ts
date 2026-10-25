import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { createDb } from "../db";
import { tag } from "../schema";
import type { AppEnv } from "../types";

const tags = new Hono<AppEnv>();

tags.get("/", async (c) => {
  const userId = c.get("user").id;
  const db = createDb(c.env.DATABASE_URL);

  const rows = await db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(eq(tag.userId, userId))
    .orderBy(asc(tag.name));

  c.header("Cache-Control", "no-store");
  return c.json({ tags: rows });
});

export default tags;
