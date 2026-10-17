import { createAuthClient } from "better-auth/react";

/**
 * better-auth client pointed at the Hono server (Cloudflare Worker).
 * Override via VITE_BETTER_AUTH_URL in the Pages deployment.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL ?? "http://localhost:8787",
});
