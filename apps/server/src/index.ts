import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { getAuth } from "./auth";
import { openApiDocument } from "./openapi";
import { requireSession } from "./lib/session";
import itemsRoutes from "./routes/items";
import tagsRoutes from "./routes/tags";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

/**
 * Browser requests must come from the web client. Native Expo requests have no
 * Origin header, so they identify themselves with the Expo app scheme through
 * the `expo-origin` header used by `@better-auth/expo`.
 */
function isTrustedRequestOrigin(c: Context<AppEnv>): boolean {
  const origin = c.req.header("origin");
  if (origin === c.env.CLIENT_URL) return true;

  const expoOrigin = c.req.header("expo-origin");
  if (!expoOrigin) return false;

  const scheme = c.env.MOBILE_APP_SCHEME ?? "botcherry";
  if (expoOrigin === `${scheme}://`) return true;

  return (
    !c.env.BETTER_AUTH_URL.startsWith("https://") &&
    expoOrigin.startsWith("exp://")
  );
}

// CORS must be handled explicitly: better-auth's `trustedOrigins` only covers
// CSRF protection, not the Access-Control-* response headers the browser needs
// for cross-origin requests with credentials. The origin is read per-request
// from the env binding (only available inside the handler).
app.use("/api/*", (c, next) =>
  cors({
    origin: c.env.CLIENT_URL,
    allowHeaders: ["Content-Type", "Authorization", "expo-origin"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })(c, next),
);

// CORS alone does not stop a cross-site request from executing. Reject
// state-changing item/tag requests from origins other than the client.
app.use("/api/*", async (c, next) => {
  const method = c.req.method.toUpperCase();
  const isItemOrTagApi =
    c.req.path.startsWith("/api/items") || c.req.path.startsWith("/api/tags");

  if (
    isItemOrTagApi &&
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    !isTrustedRequestOrigin(c)
  ) {
    return c.json(
      { error: { code: "FORBIDDEN_ORIGIN", message: "Invalid origin" } },
      403,
    );
  }

  await next();
});

app.use("/api/items", requireSession);
app.use("/api/items/*", requireSession);
app.use("/api/tags", requireSession);
app.use("/api/tags/*", requireSession);

app.all("/api/auth/*", (c) => getAuth(c.env).handler(c.req.raw));

app.route("/api/items", itemsRoutes);
app.route("/api/tags", tagsRoutes);

app.get("/api/health", (c) =>
  c.json({ status: "ok", time: new Date().toISOString() }),
);

// OpenAPI JSON document
app.get("/doc", (c) => c.json(openApiDocument));

// Swagger UI
app.get("/swagger", swaggerUI({ url: "/doc" }));

app.get("/", (c) => c.redirect("/swagger"));

export default app;
