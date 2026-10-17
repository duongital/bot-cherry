/**
 * Hand-written OpenAPI 3.0 document describing the public API.
 * Served at `/doc` and rendered by Swagger UI at `/swagger`.
 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "bot-cherry API",
    version: "1.0.0",
    description:
      "Auth + API server for bot-cherry. Auth endpoints are provided by better-auth under `/api/auth/*`.",
  },
  servers: [{ url: "http://localhost:8787" }],
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        operationId: "health",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    time: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/sign-up/email": {
      post: {
        summary: "Sign up with email and password",
        operationId: "signUpEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User created (session cookie set)" },
          "422": { description: "Validation error (e.g. email already in use)" },
        },
      },
    },
    "/api/auth/sign-in/email": {
      post: {
        summary: "Sign in with email and password",
        operationId: "signInEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Signed in (session cookie set)" },
          "401": { description: "Invalid email or password" },
        },
      },
    },
    "/api/auth/sign-out": {
      post: {
        summary: "Sign out the current session",
        operationId: "signOut",
        responses: {
          "200": { description: "Signed out" },
        },
      },
    },
    "/api/auth/get-session": {
      get: {
        summary: "Get the current session (null if signed out)",
        operationId: "getSession",
        responses: {
          "200": { description: "Current session or null" },
        },
      },
    },
  },
};
