/**
 * Hand-written OpenAPI 3.0 document describing the public API.
 * Served at `/doc` and rendered by Swagger UI at `/swagger`.
 */
const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

const unauthorized = errorResponse("Sign in required");
const notFound = errorResponse("Item not found or not owned by the current user");
const validationError = errorResponse("Validation error");

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "bot-cherry API",
    version: "1.0.0",
    description:
      "Auth + API server for bot-cherry. Auth endpoints are provided by better-auth under `/api/auth/*`.",
  },
  servers: [{ url: "http://localhost:8787" }],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string" },
            },
          },
        },
      },
      Tag: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "auth" },
        },
      },
      SavedItemSummary: {
        type: "object",
        required: [
          "id",
          "title",
          "contentFormat",
          "tags",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string", example: "user table vs account table" },
          contentFormat: {
            type: "string",
            enum: ["markdown", "plain"],
          },
          tags: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SavedItem: {
        allOf: [
          { $ref: "#/components/schemas/SavedItemSummary" },
          {
            type: "object",
            required: ["content"],
            properties: {
              content: { type: "string" },
            },
          },
        ],
      },
      CreateSavedItem: {
        type: "object",
        required: ["title", "content", "contentFormat"],
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 200,
          },
          content: {
            type: "string",
            minLength: 1,
            description: "At most 262,144 bytes (256 KiB) when UTF-8 encoded.",
          },
          contentFormat: {
            type: "string",
            enum: ["markdown", "plain"],
            default: "plain",
          },
          tags: {
            type: "array",
            maxItems: 10,
            items: { type: "string", minLength: 1, maxLength: 32 },
            description:
              "Trimmed, whitespace-collapsed, lowercased, and deduplicated by the server.",
          },
        },
      },
    },
  },
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
    "/api/items": {
      get: {
        summary: "List the current user's saved items",
        operationId: "listSavedItems",
        security: [{ sessionCookie: [] }],
        parameters: [
          {
            name: "q",
            in: "query",
            description: "Search in title and content (max 100 characters)",
            schema: { type: "string", maxLength: 100 },
          },
          {
            name: "tag",
            in: "query",
            description: "Exact tag name filter",
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          },
          {
            name: "cursor",
            in: "query",
            description: "Opaque cursor returned by the previous page",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Saved item summaries without content",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["items", "nextCursor"],
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/SavedItemSummary",
                      },
                    },
                    nextCursor: {
                      type: "string",
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          "401": unauthorized,
        },
      },
      post: {
        summary: "Create a saved item",
        operationId: "createSavedItem",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSavedItem" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created item summary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SavedItemSummary" },
              },
            },
          },
          "401": unauthorized,
          "403": errorResponse("Request Origin is not the configured client"),
          "413": errorResponse("Request body is too large"),
          "415": errorResponse("Content-Type must be application/json"),
          "422": validationError,
        },
      },
    },
    "/api/items/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      get: {
        summary: "Get one saved item with full content",
        operationId: "getSavedItem",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Saved item",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SavedItem" },
              },
            },
          },
          "401": unauthorized,
          "404": notFound,
        },
      },
      delete: {
        summary: "Delete one saved item",
        operationId: "deleteSavedItem",
        security: [{ sessionCookie: [] }],
        responses: {
          "204": { description: "Deleted" },
          "401": unauthorized,
          "403": errorResponse("Request Origin is not the configured client"),
          "404": notFound,
        },
      },
    },
    "/api/tags": {
      get: {
        summary: "List the current user's tags",
        operationId: "listTags",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "Tags ordered by name",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tags"],
                  properties: {
                    tags: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Tag" },
                    },
                  },
                },
              },
            },
          },
          "401": unauthorized,
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
