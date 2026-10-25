import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { createDb } from "./db";
import { schema } from "./schema";

export interface AuthEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CLIENT_URL: string;
  MOBILE_APP_SCHEME?: string;
}

export function createAuth(env: AuthEnv) {
  const db = createDb(env.DATABASE_URL);
  const isProduction = env.BETTER_AUTH_URL.startsWith("https://");
  const mobileScheme = env.MOBILE_APP_SCHEME ?? "botcherry";

  // Native Expo requests do not have a browser Origin header. The Expo plugin
  // forwards the app scheme through `expo-origin`, and better-auth checks it
  // against these trusted origins.
  const trustedOrigins = [env.CLIENT_URL, `${mobileScheme}://`];
  if (!isProduction) {
    trustedOrigins.push("exp://", "http://localhost:8081");
  }

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    // Allow the web app and native mobile app to call the auth API.
    trustedOrigins,
    plugins: [expo()],
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

// Cache the auth instance per isolate. Workers reuse the isolate across
// requests, but `env` bindings are only available inside the fetch handler,
// so we create the instance lazily on first use.
let cachedAuth: Auth | null = null;

export function getAuth(env: AuthEnv): Auth {
  if (!cachedAuth) {
    cachedAuth = createAuth(env);
  }
  return cachedAuth;
}
