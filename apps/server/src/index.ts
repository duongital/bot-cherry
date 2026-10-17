import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { createAuth, type Auth } from "./auth";
import { openApiDocument } from "./openapi";

export interface Bindings {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CLIENT_URL: string;
}

// Cache the auth instance per isolate. Workers reuse the isolate across
// requests, but `env` bindings are only available inside the fetch handler,
// so we create the instance lazily on first use.
let cachedAuth: Auth | null = null;

function getAuth(env: Bindings): Auth {
  if (!cachedAuth) {
    cachedAuth = createAuth(env);
  }
  return cachedAuth;
}

const app = new Hono<{ Bindings: Bindings }>();

// better-auth handles all auth routes and their CORS preflight itself
// (see `trustedOrigins` in auth.ts).
app.all("/api/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

app.get("/api/health", (c) =>
  c.json({ status: "ok", time: new Date().toISOString() }),
);

// OpenAPI JSON document
app.get("/doc", (c) => c.json(openApiDocument));

// Swagger UI
app.get("/swagger", swaggerUI({ url: "/doc" }));

app.get("/", (c) => c.redirect("/swagger"));

export default app;
