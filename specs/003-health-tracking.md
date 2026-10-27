# Next feature: Health symptom chat + tracking (`/health`)

## 1. Goal

Give every signed-in user a private `/health` app where they describe how they
feel in natural language, get back a yes/no checklist of symptoms to confirm,
and save that as a daily log they can review over time.

On mobile-width screens the page has two tabs:

- **Chat** — a conversation with a health-tracking assistant. Past conversations
  and messages are persisted and can be browsed later.
- **Tracking** — saved symptom logs, grouped by day, with simple trends.

On desktop the two panels may be shown side by side (chat left, tracking
right), but the tabbed layout is the primary design.

### User journey

1. User opens `/health` (header nav link or direct URL) and lands on **Chat**.
2. User types a long free-text message, e.g.
   *"Woke up with a headache, a bit dizzy after lunch, slept badly, no fever
   but my throat is scratchy."*
3. The server analyzes the text with the DeepSeek flash model and returns:
   - a short text acknowledgement, and
   - a **symptom form**: a list of extracted/suggested symptoms, each with a
     **Yes / No** toggle (pre-set to the model's best guess), plus optional
     severity (1–5) and note per symptom.
4. User reviews, flips toggles, may add a custom symptom, then presses
   **Done**.
5. The form is submitted; a symptom log is saved for today. The form in the
   chat becomes read-only with a "Saved" badge.
6. User switches to **Tracking** and sees today's log at the top, plus earlier
   logs and per-symptom frequency.
7. Later, user reopens `/health` and can pick an earlier conversation from the
   chat history list and see the full transcript, including submitted forms.

### Assumptions / decisions

- This is symptom **logging**, not diagnosis. The assistant must not give
  medical diagnoses; the system prompt instructs it to extract symptoms only
  and to add a fixed disclaimer suggesting a professional for severe/urgent
  symptoms.
- **No Durable Objects and no Agents SDK.** The analysis is a single
  request → response on a plain Worker route. Postgres (Neon) is the only
  source of truth for conversations, messages, and logs.
- LLM provider is **DeepSeek**, using its fast **flash** model
  (`deepseek-v4-flash`, configurable via `HEALTH_AGENT_MODEL`), called through
  the AI SDK (`ai` + `@ai-sdk/deepseek`):
  ```ts
  import { createDeepSeek } from "@ai-sdk/deepseek";
  const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY });
  const model = deepseek(env.HEALTH_AGENT_MODEL ?? "deepseek-v4-flash");
  ```
  The flash model is chosen for low latency/cost; no reasoning model is used
  (reasoning models don't support structured output reliably and are slower).
- The symptom form is produced with **structured output** (`generateObject`
  with a Zod schema) in one call. DeepSeek supports JSON mode. The returned
  object contains both the short acknowledgement text and the symptom items.
  If validation fails, retry once before returning a 502
  `{ error: { code: "LLM_INVALID_RESPONSE" } }`.
- The analysis is **not streamed** in v1: one HTTP request returns
  `{ message, form }` as JSON. Streaming text can be added later if needed.
- Verify the exact flash model id against DeepSeek's model list at
  implementation time; only the env default needs to change.
- Only the submitted form creates a log. Abandoned forms leave no log row.
- Multiple logs per day are allowed; Tracking shows them grouped by date.
- Symptom names are normalized (lowercase, trimmed, ≤ 64 chars) and scoped per
  user, so frequency charts work.
- Web client uses daisyUI semantic tokens (`tabs`, `chat`, `chat-bubble`,
  `toggle`, etc.). No hardcoded colors.
- Mobile Expo app support is out of scope for v1 (follow-up spec), but the API
  must be usable from it (cookie + `expo-origin` header).

---

## 2. Scope

### In scope

- Server: `@ai-sdk/deepseek` + `ai` dependencies, an `/api/health/analyze`
  route plus chat + log REST routes, Drizzle schema + migration, secrets.
- Client: `/health` route with Chat and Tracking tabs, chat history list,
  symptom form component, tracking list.
- Types in `apps/client/src/lib/types.ts`.

### Out of scope

- Diagnosis, medication advice, reminders/notifications.
- Sharing/exporting logs, charts beyond simple counts.
- Mobile (Expo) screens.
- Voice input, image upload.
- Durable Objects / Cloudflare Agents SDK.
- Streaming the assistant reply (single JSON response in v1).

---

## 3. Secrets & configuration

Add to `apps/server/.dev.vars` (never commit) and an
`apps/server/.dev.vars.example` (committed, empty values):

```env
DEEPSEEK_API_KEY=
# optional: override model (default: deepseek-v4-flash)
HEALTH_AGENT_MODEL=deepseek-v4-flash
```

Production:

```bash
wrangler secret put DEEPSEEK_API_KEY
```

No `wrangler.toml` changes are needed (no Durable Object binding or
migration). Update the `Bindings` type in `apps/server/src/types.ts` with
`DEEPSEEK_API_KEY` and `HEALTH_AGENT_MODEL?` only.

---

## 4. Data model (`apps/server/src/schema.ts`)

```ts
health_conversation
  id            text pk
  user_id       text fk -> user.id (cascade)
  title         text not null          // first ~60 chars of first message
  created_at    timestamptz default now
  updated_at    timestamptz default now
  index (user_id, updated_at desc)

health_message
  id              text pk
  conversation_id text fk -> health_conversation.id (cascade)
  user_id         text fk -> user.id (cascade)
  role            text  // 'user' | 'assistant'
  content         text not null
  form            jsonb null      // SymptomForm proposed by the model
  log_id          text null fk -> symptom_log.id (set null) // set when submitted
  created_at      timestamptz default now
  index (conversation_id, created_at)

symptom_log
  id              text pk
  user_id         text fk -> user.id (cascade)
  conversation_id text null fk -> health_conversation.id (set null)
  message_id      text null
  log_date        date not null   // user's local date, sent by client
  raw_input       text not null   // original user sentence
  created_at      timestamptz default now
  index (user_id, log_date desc)

symptom_log_entry
  id          text pk
  log_id      text fk -> symptom_log.id (cascade)
  symptom     text not null        // normalized name
  present     boolean not null
  severity    smallint null        // 1–5, only if present
  note        text null            // ≤ 500 chars
  unique (log_id, symptom)
```

Then `db:generate` → review SQL → `db:push` (drizzle-kit ≥ 0.31.11).

---

## 5. Analyze service design

`apps/server/src/health/analyze.ts` — a pure helper, no framework code:

- `analyzeSymptoms(text: string): Promise<SymptomForm>` calls DeepSeek with
  `generateObject` using a Zod schema and this system prompt:
  - Extract symptoms the user mentioned or strongly implied.
  - Include 2–4 closely related common symptoms the user might want to confirm
    (marked `suggested: true`, default `present: false`).
  - Never diagnose; keep the acknowledgement ≤ 2 sentences.
  - Add an urgent-care disclaimer for red-flag symptoms (chest pain,
    difficulty breathing, etc.).
- Return type is the shared shape below. On validation failure, retry once,
  then throw a typed error the route maps to 502.

Form schema (Zod, shared shape):

```ts
SymptomForm = {
  message: string;   // short acknowledgement, ≤ 300 chars
  items: Array<{
    symptom: string;        // ≤ 64 chars
    present: boolean;       // model's guess
    suggested: boolean;     // true if not explicitly mentioned
    severity?: 1|2|3|4|5;
  }>; // 1–20 items
}
```

---

## 6. API

All routes under `/api/health`, `requireSession`, Zod-validated, errors as
`{ error: { code, message } }`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/analyze` | analyze user text → return `{ message, form }` and persist both messages |
| GET | `/conversations?cursor=` | list user's conversations (history) |
| POST | `/conversations` | create empty conversation |
| GET | `/conversations/:id/messages` | full transcript incl. forms + log ids |
| DELETE | `/conversations/:id` | delete conversation (logs kept, fk set null) |
| POST | `/logs` | submit form → create log + entries, link message |
| GET | `/logs?from=&to=&cursor=` | logs with entries, newest first |
| DELETE | `/logs/:id` | delete a log |
| GET | `/symptoms/stats?days=30` | per-symptom counts of `present=true` |

`POST /analyze` body:

```ts
{ conversationId?: string; message: string }  // message ≤ 4000 chars
```

Response `200`:

```ts
{
  conversationId: string;
  userMessage: HealthMessage;        // persisted
  assistantMessage: HealthMessage;   // persisted, includes .form
}
```

Behavior: create the conversation (with a title from the first message) if
`conversationId` is omitted or unknown; persist the user message; call
`analyzeSymptoms`; persist the assistant message with the form; return both.

`POST /logs` body:

```ts
{
  conversationId: string;
  messageId: string;          // assistant message holding the form
  logDate: string;            // YYYY-MM-DD local
  entries: Array<{ symptom; present; severity?; note? }>; // 1–30
}
```

Rules: message must belong to user and not already have `log_id` (409
`ALREADY_SUBMITTED`); runs in a transaction.

---

## 7. Client (`apps/client`)

- Route `/health` (protected) → `pages/HealthPage.tsx`; add header nav link.
- Layout: daisyUI `tabs tabs-box` at top on `< md`: **Chat** | **Tracking**.
  Active tab stored in `?tab=` query param.
- **Chat tab**
  - Top bar: conversation title + "History" button opening a drawer/list of
    past conversations + "New chat".
  - Message list with `chat-start` / `chat-end` bubbles; a loading state while
    `POST /analyze` is in flight.
  - `SymptomFormCard` rendered under assistant messages with a form: rows of
    symptom + Yes/No `join` buttons, optional severity `rating`, note input,
    "+ Add symptom", and **Done** button. After submit: read-only, "Saved"
    badge, link "View in Tracking".
  - Composer: autosizing textarea, Enter to send, Shift+Enter newline.
- **Tracking tab**
  - Logs grouped by date (Today, Yesterday, date). Each log card shows present
    symptoms as badges with severity; collapsed list of "No" items.
  - Top summary: last 30 days, top symptoms with counts.
  - Empty state pointing to Chat.
- Data fetching with existing API helper (credentials included); no WebSocket
  or agent client.
- Types (`HealthConversation`, `HealthMessage`, `SymptomForm`, `SymptomLog`,
  `SymptomLogEntry`, `SymptomStat`) in `src/lib/types.ts`.

---

## 8. Acceptance criteria

- [ ] `POST /analyze` returns an acknowledgement + yes/no form within ~2 s
      under normal conditions.
- [ ] Sending a symptom sentence persists both messages and shows the form.
- [ ] Toggling and pressing **Done** saves one log; resubmitting is blocked.
- [ ] Tracking tab shows the new log immediately (refetch/optimistic).
- [ ] Reloading `/health` shows conversation history; opening an old
      conversation shows messages and submitted forms as read-only.
- [ ] Another user cannot read/submit any conversation, message, or log (403/404).
- [ ] `DEEPSEEK_API_KEY` only in `.dev.vars` / wrangler secrets; example file
      committed without values.
- [ ] No Durable Object binding or migration in `wrangler.toml`.
- [ ] Mobile-width layout uses two tabs; works with all daisyUI themes.
- [ ] `pnpm typecheck` and `pnpm build` pass.

---

## 9. Implementation order

1. Schema + migration.
2. Secrets, `Bindings` type, `@ai-sdk/deepseek` dependency.
3. `analyzeSymptoms` helper + `/api/health/analyze` route.
4. Remaining `/api/health` REST routes.
5. Client page, tabs, chat UI (plain fetch).
6. Symptom form + submit.
7. Tracking tab + stats.
8. QA against acceptance criteria.
