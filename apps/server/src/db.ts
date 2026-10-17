import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "./schema";

/**
 * Create a drizzle instance backed by Neon's HTTP driver.
 * The HTTP driver works on Cloudflare Workers (no TCP sockets needed).
 */
export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;
