import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "./db";
import { schema } from "./schema";

export interface AuthEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CLIENT_URL: string;
}

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DATABASE_URL);
  const isProduction = env.BETTER_AUTH_URL.startsWith("https://");

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    // Allow the React app (deployed to Cloudflare Pages) to call the auth API.
    trustedOrigins: [env.CLIENT_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      // Phase 1: no email provider, so require no verification.
      requireEmailVerification: false,
    },
    advanced: {
      // HTTPS in production (Cloudflare), http on localhost.
      useSecureCookies: isProduction,
      // Pages (*.pages.dev) and the Worker (*.workers.dev) are cross-site,
      // so cookies must be SameSite=None there. localhost ports are same-site
      // and keep Lax.
      defaultCookieAttributes: {
        sameSite: isProduction ? "none" : "lax",
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
