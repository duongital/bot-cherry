# bot-cherry

pnpm monorepo with two apps:

| App    | Stack                                             | Deploys to            |
| ------ | ------------------------------------------------- | --------------------- |
| client | React 19 + Vite + better-auth React client        | Cloudflare Pages      |
| server | Hono + better-auth + Drizzle ORM + Neon PostgreSQL | Cloudflare Workers    |

**Phase 1 scope:** email + password login only. No email provider / password reset
verification is configured yet.

---

## Structure

```
bot-cherry/
├── package.json            # workspace root scripts
├── pnpm-workspace.yaml
└── apps/
    ├── server/             # @bot-cherry/server (Cloudflare Worker)
    │   ├── src/
    │   │   ├── index.ts    # Hono app, /swagger, /doc, /api/health
    │   │   ├── auth.ts     # better-auth instance
    │   │   ├── db.ts       # drizzle + Neon HTTP driver
    │   │   ├── schema.ts   # better-auth drizzle schema
    │   │   └── openapi.ts  # hand-written OpenAPI doc
    │   ├── drizzle.config.ts
    │   ├── wrangler.toml
    │   └── .dev.vars       # local secrets (gitignored)
    └── client/             # @bot-cherry/client (Cloudflare Pages)
        └── src/
            ├── App.tsx             # sign in / sign up / session view
            ├── lib/auth-client.ts  # better-auth client
            └── ...
```

## Prerequisites

- Node 20+ and [pnpm](https://pnpm.io) 10+
- A Cloudflare account (for `wrangler deploy`)
- The Neon database already created (connection string below)

## Setup

```bash
pnpm install

# 1. Create the auth tables in Neon (reads DATABASE_URL from apps/server/.dev.vars)
pnpm db:push

# 2. Run locally
pnpm dev
```

- Client: http://localhost:5173
- Server: http://localhost:8787
- Swagger UI: http://localhost:8787/swagger (OpenAPI JSON at `/doc`)

## Environment variables

### Server (`apps/server`)

Set locally in `apps/server/.dev.vars` (copy from `.dev.vars.example`) and in
production with `wrangler secret put`:

| Var                 | Description                                        |
| ------------------- | -------------------------------------------------- |
| `DATABASE_URL`      | Neon PostgreSQL connection string (HTTP pooler)     |
| `BETTER_AUTH_SECRET`| Long random string used to sign sessions            |
| `BETTER_AUTH_URL`   | Public URL of the Worker (http://localhost:8787 locally) |
| `CLIENT_URL`        | Origin of the React app (http://localhost:5173 locally) |

`BETTER_AUTH_URL` and `CLIENT_URL` are also declared (non-secret) in
`wrangler.toml`; update them to your real `*.workers.dev` / `*.pages.dev` URLs
after deploying.

### Client (`apps/client`)

| Var                      | Description                        |
| ------------------------ | ---------------------------------- |
| `VITE_BETTER_AUTH_URL`   | URL of the server Worker           |

## Database

The connection string uses the Neon **pooler** endpoint (HTTP driver), which
works on Cloudflare Workers because it needs no raw TCP sockets. Store it in
`apps/server/.dev.vars` (see `.dev.vars.example`), for example:

```
postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Schema is managed with `drizzle-kit`:

```bash
pnpm db:push        # create/update tables directly
pnpm db:generate    # generate SQL migrations to apps/server/drizzle
```

## Deploy

### Server -> Cloudflare Worker (GitHub Actions)

Pushing to `main` with changes under `apps/server/` runs
`.github/workflows/deploy-server.yml`, which typechecks the Worker, syncs its
runtime secrets, and runs `wrangler deploy`. You can also trigger it manually
from the **Actions** tab (`workflow_dispatch`).

Add these repository secrets in GitHub:

> **Settings -> Secrets and variables -> Actions -> New repository secret**

| Secret                  | Where to get it                                                        |
| ----------------------- | ---------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare dashboard -> My Profile -> API Tokens -> *Edit Cloudflare Workers* template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard -> Workers & Pages -> Account ID (right sidebar)   |
| `DATABASE_URL`          | Same Neon pooler connection string used in `apps/server/.dev.vars`      |
| `BETTER_AUTH_SECRET`    | Long random string (e.g. `openssl rand -base64 32`)                     |

The workflow sets `DATABASE_URL` and `BETTER_AUTH_SECRET` on the Worker with
`wrangler secret put` before every deploy, so Cloudflare and GitHub stay in
sync. `BETTER_AUTH_URL` and `CLIENT_URL` are non-secret vars: update them in
`apps/server/wrangler.toml` to your deployed URLs and push.

> Alternatively, set the runtime secrets on Cloudflare once with
> `wrangler secret put` and remove the sync lines from the workflow. The
> `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets are still required by
> CI.

### Client -> Cloudflare Pages (GitHub Actions)

Pushing to `main` with changes under `apps/client/` runs
`.github/workflows/deploy-client.yml`, which builds the React app and uploads
`apps/client/dist` with `wrangler pages deploy`. It can also be run manually
from the **Actions** tab.

Add these repository **variables** (not secrets) in
**Settings -> Secrets and variables -> Actions -> Variables**:

| Variable                        | Value                                                   |
| ------------------------------- | ------------------------------------------------------- |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Your Pages project name, e.g. `bot-cherry-client`        |
| `VITE_BETTER_AUTH_URL`          | Deployed Worker URL, e.g. `https://bot-cherry-server.xxx.workers.dev` |

The `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are the same
ones used by the server workflow. The token also needs the
**Cloudflare Pages: Edit** permission. Create the Pages project once (dashboard or
`pnpm exec wrangler pages project create bot-cherry-client --production-branch=main`)
before the first CI deploy.

Manual alternative:

```bash
cd apps/client
pnpm exec wrangler pages deploy dist
```

> **Cross-site cookies:** in production the Worker (`*.workers.dev`) and Pages
> (`*.pages.dev`) are cross-site, so `auth.ts` sets the session cookie to
> `SameSite=None; Secure`. For a production setup you'll typically put both
> apps behind a single custom domain (e.g. `api.example.com` +
> `app.example.com`) so cookies behave like normal same-site cookies.

## Auth API (better-auth)

| Method | Path                          | Body                                |
| ------ | ----------------------------- | ----------------------------------- |
| POST   | `/api/auth/sign-up/email`     | `{ name, email, password }`         |
| POST   | `/api/auth/sign-in/email`     | `{ email, password }`               |
| POST   | `/api/auth/sign-out`          | `{}`                                |
| GET    | `/api/auth/get-session`       | —                                   |

All endpoints live under `/api/auth/*` and are documented in the Swagger UI.
