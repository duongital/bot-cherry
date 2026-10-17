import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load secrets from wrangler's local secrets file so `drizzle-kit push`
// can create the tables against Neon from your machine.
config({ path: ".dev.vars" });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
