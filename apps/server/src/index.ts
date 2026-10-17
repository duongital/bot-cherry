import { Hono } from "hono";
import { cors } from "hono/cors";
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

// CORS must be handled explicitly: better-auth's `trustedOrigins` only covers
// CSRF protection, not the Access-Control-* response headers the browser needs
// for cross-origin requests with credentials. The origin is read per-request
// from the env binding (only available inside the handler).
app.use("/api/auth/*", (c, next) =>
  cors({
    origin: c.env.CLIENT_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })(c, next),
);

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
