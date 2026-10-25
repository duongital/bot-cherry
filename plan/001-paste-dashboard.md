# Next feature: Paste-to-save dashboard

## 1. Goal

Give every logged-in user a private dashboard where they can save AI answers or
notes copied from anywhere (Markdown or plain text), then browse them later.

The layout mirrors the reference screenshot:

- **Left sidebar:** `Sessions Saved` count, Paste button, search, tag filter,
  and a list of saved items.
- **Main panel:** the selected item rendered as Markdown or preserved plain
  text.
- **Create flow:** Paste button -> read clipboard -> modal asking for a title
  and optional tags -> save -> the new item appears in the sidebar and is
  selected.

### User journey

1. User is signed in and opens `/dashboard`.
2. User copies an AI answer, Markdown document, or plain text in another app.
3. User clicks **Paste** in the sidebar.
4. The app reads the clipboard, detects Markdown vs plain text, and opens a
   modal.
5. The modal asks for:
   - **Title** (required, pre-filled from the first heading/line, editable)
   - **Tags** (optional, multiple, chip input, existing tags suggested)
   - Format confirmation (`Markdown` / `Plain text`, auto-detected)
6. User submits. The item is persisted to the database.
7. The modal closes, the item appears at the top of the sidebar, and its detail
   view opens.
8. Refreshing the page keeps the item; other users never see it.

### Assumptions / decisions

- One pasted document is one saved item. Folders are out of scope.
- Only save after the modal is submitted. Cancelling leaves no orphan row.
  (Add drafts later if needed.)
- The clipboard gives us text only; we cannot reliably know the source app or
  file path. The sidebar metadata will therefore show tags + saved time, not
  `Github/bot-cherry · pi`. A source field can be added later.
- The client now uses Tailwind CSS 4 + daisyUI 5 with an app-wide theme
  selector. The dashboard must use the active daisyUI theme rather than a
  separate hardcoded light/dark palette.
- Use Tailwind utilities and daisyUI semantic tokens (`base-100`, `base-200`,
  `base-300`, `base-content`, `primary`, etc.). Avoid raw hex colors so every
  page follows the selected theme.
- Do not name custom classes after daisyUI components (`.hero`, `.card`,
  `.btn`, etc.); use distinct names or DaisyUI classes to avoid style
  collisions.
- Tags are normalized to lowercase and scoped per user.
- Content is rendered with `react-markdown` + `remark-gfm`; raw HTML is **not**
  enabled.

---

## 2. Scope

### In scope

- New database tables for saved items, tags, and item/tag links.
- Authenticated CRUD API for saved items and tags.
- Dashboard route with sidebar + reader layout.
- Clipboard paste + manual-paste fallback.
- Save modal with title, tags, and format.
- Markdown rendering including tables, lists, code blocks, and quotes.
- Plain-text rendering with whitespace preserved.
- Search, tag filtering, delete, and copy-raw-content actions.
- Responsive mobile layout.
- OpenAPI documentation and README updates.

### Out of scope (future)

- Editing item content after save (title/tag edit can be a follow-up).
- Folders, favorites, sharing, public links.
- Browser extension / desktop app source capture.
- AI summarization, embeddings, semantic search.
- File/image attachments.
- Draft state and auto-restore.
- Full-text ranking; use `ILIKE` for v1.

---

## 3. Data model

Add to `apps/server/src/schema.ts`. Keep the existing better-auth table names
and conventions (`text` IDs, snake_case columns).

```ts
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const savedItem = pgTable(
  "saved_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    // "markdown" | "plain"; validated in the API.
    contentFormat: text("content_format").notNull().default("plain"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("saved_item_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const tag = pgTable(
  "tag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Canonical lowercase name.
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tag_user_name_unique").on(t.userId, t.name),
    index("tag_user_idx").on(t.userId),
  ],
);

export const savedItemTag = pgTable(
  "saved_item_tag",
  {
    savedItemId: text("saved_item_id")
      .notNull()
      .references(() => savedItem.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.savedItemId, t.tagId] }),
    index("saved_item_tag_tag_idx").on(t.tagId),
  ],
);
```

Update the `schema` export:

```ts
export const schema = {
  user,
  session,
  account,
  verification,
  savedItem,
  tag,
  savedItemTag,
};
```

### Why a tag table instead of `text[]`

- Tag autocomplete and filters need a per-user list.
- Many-to-many linking keeps tags reusable across items.
- A unique `(user_id, name)` index prevents duplicates.
- Deleting an item removes its links but leaves the tag available for reuse.
- Orphan tags are harmless for v1; add a cleanup job later if desired.

### Migration

```bash
pnpm --filter @bot-cherry/server db:generate
pnpm db:push
```

Commit the generated migration folder (`apps/server/drizzle/`) if
`db:generate` is used. For this prototype, `db:push` against Neon is also
acceptable.

---

## 4. Server API

### Authentication and middleware

Add `apps/server/src/lib/session.ts`:

```ts
export async function requireSession(c, next) {
  const session = await getAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
}
```

Route handlers must derive `userId` from the session, never from the request
body or params.

### CORS and CSRF

Update `apps/server/src/index.ts`:

- Apply CORS to `/api/*`, not only `/api/auth/*`.
- Allow `GET, POST, PATCH, DELETE, OPTIONS` and `Content-Type`.
- Keep `credentials: true`.
- For non-GET item routes, reject requests whose `Origin` is not
  `CLIENT_URL`. CORS alone does not prevent a request from executing.
- Require `Content-Type: application/json` for JSON bodies.
- Add `Cache-Control: no-store` to private item responses.

Mount:

```ts
app.use("/api/*", corsMiddleware);
app.use("/api/items", requireSession);
app.use("/api/items/*", requireSession);
app.use("/api/tags", requireSession);
app.use("/api/tags/*", requireSession);
app.route("/api/items", itemsRoutes);
app.route("/api/tags", tagsRoutes);
```

### Endpoints

| Method | Path              | Purpose                              |
| ------ | ----------------- | ------------------------------------ |
| GET    | `/api/items`      | List current user's item summaries   |
| POST   | `/api/items`      | Create an item after modal submit    |
| GET    | `/api/items/:id`  | Get one item with full content       |
| DELETE | `/api/items/:id`  | Delete one item                      |
| GET    | `/api/tags`       | List current user's tags             |

Optional follow-up: `PATCH /api/items/:id` for title/tags/content edits.

#### `GET /api/items`

Query parameters:

- `q` — optional search in title/content, max 100 chars
- `tag` — optional exact tag filter
- `limit` — default 50, max 100
- `cursor` — opaque cursor for the next page

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "user table vs account table",
      "contentFormat": "markdown",
      "tags": ["auth", "database"],
      "createdAt": "2026-10-23T23:01:08.000Z",
      "updatedAt": "2026-10-23T23:01:08.000Z"
    }
  ],
  "nextCursor": null
}
```

Do **not** return `content` in the list response; load it through the detail
endpoint so the sidebar stays fast.

#### `POST /api/items`

Request:

```json
{
  "title": "user table vs account table",
  "content": "Good question — ...",
  "contentFormat": "markdown",
  "tags": ["auth", "database"]
}
```

Validation:

- `title`: trimmed, 1–200 chars
- `content`: 1–262,144 bytes (256 KiB), measured with `TextEncoder`
- `contentFormat`: `"markdown"` or `"plain"`
- `tags`: max 10; each trimmed, collapsed whitespace, lowercased, 1–32 chars;
  duplicates removed
- Reject empty/whitespace-only content and titles
- Limit request body size before parsing where practical

Response: `201` with the created item summary (same shape as list items).

Persistence steps:

1. Generate item ID with `crypto.randomUUID()`.
2. Insert the saved item.
3. Upsert each tag for `(userId, name)`.
4. Insert `saved_item_tag` links.
5. Return the item with its tags.

Neon HTTP does not support interactive transactions the same way a TCP
driver does. Use `db.batch` for tag/link inserts, or accept a very small
partial-failure window and return an error. The item itself is never created
outside the authenticated user.

#### `GET /api/items/:id`

- Verify `savedItem.userId === session.user.id`.
- Return `404` for both "not found" and "belongs to another user" to avoid
  leaking existence.
- Include full `content` and tags.

#### `DELETE /api/items/:id`

- Ownership check first.
- Delete the item; `saved_item_tag` rows cascade.
- Return `204`.
- Do not delete tags automatically.

#### `GET /api/tags`

Return the current user's tags ordered by name or usage count:

```json
{ "tags": [{ "id": "uuid", "name": "auth" }] }
```

### Validation helpers

Create `apps/server/src/lib/items.ts` for shared normalization and validation:

- `normalizeTagName()`
- `parseCreateItemBody()`
- `getItemWithTags()`
- `toItemSummary()`
- `encodeCursor()` / `decodeCursor()`

Use `zod` (already a dependency) for request validation.

### OpenAPI

Update `apps/server/src/openapi.ts` with the new paths, request schemas, and
response schemas. Include the `401`, `404`, and `422` responses.

---

## 5. Frontend

### Dependencies

Add:

```bash
pnpm --filter @bot-cherry/client add react-markdown remark-gfm
```

Styling dependencies are already installed (`tailwindcss`,
`@tailwindcss/vite`, and `daisyui`). No separate CSS framework or theme
provider is needed. Use the existing theme tokens and daisyUI components.

No raw HTML plugin is needed. `react-markdown` escapes HTML by default.

### Routes

In `apps/client/src/App.tsx`:

```tsx
<Route
  path="/dashboard"
  element={
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  }
/>
<Route
  path="/dashboard/:itemId"
  element={
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  }
/>
```

- `RequireAuth` shows a loading state while the session resolves and redirects
  to `/login` when signed out.
- Keep the existing `/`, `/login`, and `/signup` routes.
- Add a **Dashboard** link to the currently empty `navbar-center` in
  `Header.tsx` for signed-in users, and a Dashboard link in `Home.tsx`.
- Keep the `Hi, {user name}` greeting and theme picker on the right. Ensure
  sign-out remains reachable from the header when the dashboard is added.
- When redirecting to login, preserve the intended path so the user lands on
  `/dashboard` after signing in.

### Component tree

```
apps/client/src/
├── pages/
│   └── DashboardPage.tsx          # data loading, selection, paste flow
├── components/
│   ├── auth/RequireAuth.tsx
│   └── dashboard/
│       ├── DashboardSidebar.tsx   # header, count, paste, search, list
│       ├── SavedItemListItem.tsx  # title, tags, saved timestamp
│       ├── SavedItemDetail.tsx    # header, actions, content renderer
│       ├── MarkdownContent.tsx    # markdown/plain renderer
│       ├── PasteButton.tsx        # clipboard read + fallback
│       ├── SaveItemModal.tsx      # title, tags, format, submit
│       ├── TagInput.tsx           # chip input + suggestions
│       ├── ConfirmDialog.tsx      # delete confirmation
│       ├── Toast.tsx              # success/error messages
│       └── EmptyState.tsx
├── hooks/
│   ├── useSavedItems.ts           # list/search/filter state
│   └── useSavedItem.ts            # detail fetch by id
└── lib/
    ├── api.ts                     # typed fetch wrapper
    ├── markdown.ts                # detect format + title suggestion
    └── types.ts                   # SavedItem, Tag, etc.
```

### Typed API client

Create `apps/client/src/lib/api.ts`:

```ts
const API_BASE = import.meta.env.VITE_API_URL
  ?? import.meta.env.VITE_BETTER_AUTH_URL
  ?? "http://localhost:8787";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  // Parse JSON errors and throw a typed error with status/code/message.
}
```

Reuse `VITE_BETTER_AUTH_URL` as the API base for now so no deployment variable
changes are required. Add `VITE_API_URL` only if the API is split from auth
later.

### Dashboard state

`DashboardPage` owns:

- `items`, `tags`, loading/error state
- `search`, `activeTag`
- selected item from `useParams()`
- modal state (`closed | readingClipboard | editing`)
- pasted content + detected format + suggested title
- toast message

On create success:

1. Close the modal.
2. Prepend the returned summary to `items` and increment the count.
3. Navigate to `/dashboard/:id`.
4. Show a success toast.

Selecting an item navigates to `/dashboard/:id`; the detail component fetches
full content. On mobile, selection shows the reader and a back button returns
to the list.

### Clipboard paste flow

`PasteButton` on click:

1. Guard `navigator.clipboard?.readText`.
2. Call `readText()` directly inside the click handler.
3. If unsupported or permission denied, open `SaveItemModal` in manual mode
   with an empty textarea and instructions to press Cmd/Ctrl+V.
4. If the clipboard is empty, show an error toast and do not open the modal.
5. If content exceeds 256 KiB, show an error toast and do not open the modal.
6. Detect format and suggest a title, then open the modal.

Important details:

- Clipboard read requires HTTPS or localhost.
- Safari/Firefox may reject reads outside a user gesture; the manual fallback
  must always work.
- The modal's textarea accepts a normal paste event, so users can still save
  when the API is blocked.
- Do not create a DB row before the user submits.

### Save modal

Fields:

- Content preview (read-only, collapsed or scrollable)
- Title input (required, auto-focused, max 200)
- Tag input (optional, max 10)
- Format toggle: `Markdown` / `Plain text`
- Cancel and Save buttons
- Saving state and inline error

Behavior:

- Escape closes unless a save is in progress.
- Focus trap and `aria-modal` for accessibility.
- Disable submit when title or content is empty.
- Show detected format as the default but allow the user to override it.
- On validation/server error, keep the modal open and display the message.

### Tag input

- Type a tag, press Enter or comma to add a chip.
- Backspace on an empty input removes the last chip.
- Suggest existing user tags while typing.
- Normalize to lowercase and dedupe.
- Enforce max 10 tags / 32 chars in the UI, and validate again on the server.

### Markdown detection and title suggestion

`apps/client/src/lib/markdown.ts`:

- Detect Markdown signals:
  - headings (`^#{1,6}\s`)
  - fenced code blocks (``` or ~~~)
  - lists (`^[-*+]\s`, `^\d+\.\s`)
  - links (`[text](url)`)
  - blockquotes (`^>\s`)
  - tables (`^\|.*\|`)
  - emphasis
- Treat the content as Markdown when at least two signals are present;
  otherwise default to plain text.
- Suggest a title from the first Markdown heading, else the first non-empty
  line, stripped of common Markdown punctuation and truncated to ~80 chars.
- The user can always override both format and title.

### Content rendering

`MarkdownContent.tsx`:

```tsx
if (format === "markdown") {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}

return <pre className="plain-content">{content}</pre>;
```

- Do not enable `rehype-raw`.
- Style headings, lists, tables, blockquotes, inline code, and fenced code.
- Make wide tables horizontally scrollable.
- Preserve whitespace and line breaks for plain text.
- Add a small label above the content (`PASTED CONTENT`, not `ASSISTANT`) and
  the title at the top.

### Sidebar and detail UI

Sidebar:

- Heading: `Sessions Saved` with a count badge.
- Primary **Paste** button with a clipboard icon.
- Search input (`q`, debounced ~250ms).
- Tag filter chips/dropdown from `GET /api/tags`.
- Item list:
  - Title, truncated to 2 lines.
  - Metadata line: tags, then `saved <relative/absolute date>`.
  - Active item uses a muted background and a 3px green left border, matching
    the reference.
- Empty state: explain how to save the first item and show a Paste button.

Detail:

- Title, metadata (tags, saved date), and actions:
  - Copy raw content
  - Delete (with confirmation)
- Content card with generous padding and readable line length.
- Empty selection state when visiting `/dashboard` without an item.
- Loading skeleton while detail content is fetched.
- `404` state if the item was deleted in another tab.

### Visual design

The dashboard follows the active daisyUI theme selected in the header. Do not
scope a separate hardcoded light palette to `.dashboard`; reuse the app's
semantic tokens so theme changes apply immediately.

If page-specific aliases are useful, derive them from the active theme instead
of hardcoding colors:

```css
.dashboard {
  --dash-bg: var(--color-base-200);
  --dash-sidebar: var(--color-base-100);
  --dash-panel: var(--color-base-100);
  --dash-border: var(--color-base-300);
  --dash-text: var(--color-base-content);
  --dash-muted: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  --dash-accent: var(--color-primary);
  --dash-active: var(--color-base-200);
}
```

Prefer daisyUI/Tailwind classes directly in the dashboard components:
`bg-base-200`, `bg-base-100`, `border-base-300`, `text-base-content`,
`text-base-content/60`, `rounded-box`, and `rounded-field`. Use a `primary`
border or background for the active sidebar item instead of a fixed green.

Avoid class names that collide with daisyUI components (`.hero`, `.card`,
`.btn`, `.input`, `.menu`, `.tabs`, etc.); prefix project-specific classes
(e.g. `.dashboard-shell`). The theme picker already persists the selection in
`localStorage` and applies it through `data-theme`, so the dashboard needs no
separate theme state.

Layout:

- Desktop: `grid-template-columns: 20rem minmax(0, 1fr)`.
- Sidebar full height under the site header, with its own scroll area.
- Main reader scrolls independently.
- Breakpoint around 900px: single column; list view -> detail view with a back
  button.
- Keep the site header or replace it with a compact dashboard top bar; either
  way, keep sign-out and the Dashboard link accessible.

---

## 6. Implementation order

### Phase 1 — Database and server

1. Add `savedItem`, `tag`, and `savedItemTag` to `schema.ts`.
2. Generate/apply the migration.
3. Add the session middleware and shared validation helpers.
4. Extend CORS to `/api/*` and add origin checks for state-changing requests.
5. Implement item routes: list, create, detail, delete.
6. Implement tag listing.
7. Update `openapi.ts`.
8. Verify with `curl` and two different users.

### Phase 2 — Client foundation

9. Add `react-markdown` and `remark-gfm`.
10. Add shared types and the typed API client.
11. Add `RequireAuth`, dashboard routes, and Dashboard links in the header and
    home page.
12. Add Markdown detection and title suggestion utilities.

### Phase 3 — Dashboard UI

13. Build the dashboard shell, sidebar, item list, and detail view using
    daisyUI semantic colors and the active theme.
14. Add list/detail loading, empty, error, and not-found states.
15. Add Markdown/plain renderers and content styles.
16. Add responsive behavior and the mobile back button.

### Phase 4 — Paste and save flow

17. Add `PasteButton` with clipboard read and manual fallback.
18. Add `SaveItemModal`, `TagInput`, and form validation.
19. Wire `POST /api/items`, then prepend and select the new item.
20. Add toast feedback for save, copy, delete, and clipboard errors.

### Phase 5 — Polish and docs

21. Add delete confirmation and copy-raw-content.
22. Add search and tag filtering.
23. Update the README with the dashboard feature and new API endpoints.
24. Run typecheck/build and complete the manual test checklist.

---

## 7. Edge cases

| Case | Expected behavior |
| --- | --- |
| Clipboard permission denied | Open manual-paste modal with instructions |
| Clipboard API unavailable | Open manual-paste modal |
| Clipboard empty/whitespace | Error toast, no modal |
| Content > 256 KiB | Error toast; do not save |
| Very long title | Client max length + server 422 |
| More than 10 tags | Block adding more; server rejects |
| Duplicate tags with different case | Normalized and deduped |
| No tags | Save succeeds with `tags: []` |
| Markdown with raw HTML | HTML is escaped, not rendered |
| Plain text with indentation | Preserved with `white-space: pre-wrap` |
| Huge table in Markdown | Wrapper scrolls horizontally |
| User opens another user's item ID | `404` |
| Item deleted in another tab | Detail shows not-found and returns to list |
| Token/session expired while saving | Keep modal open; prompt re-login |
| Double-click Save | Disable button while saving |
| Sidebar has many items | Paginated/limited list with "Load more" |
| Mobile screen | Single-column list/detail with back navigation |

---

## 8. Security and performance notes

- All item/tag queries must include `userId` from the authenticated session.
- Return `404` for items owned by another user.
- Validate JSON body size and content length before insert.
- Validate `Origin` for `POST`/`DELETE` because production cookies use
  `SameSite=None`.
- Never enable raw Markdown HTML; no `dangerouslySetInnerHTML`.
- Add `Cache-Control: no-store` to every private API response.
- List endpoint excludes `content`; fetch full content only for the selected
  item.
- Index `(user_id, created_at)` for the sidebar and `(user_id, name)` for tags.
- Search uses `ILIKE` in v1. Escape or parameterize user wildcards; move to
  `tsvector`/trigram indexes only if needed.
- Avoid loading all content into the sidebar.
- Consider rate limiting and per-user item quotas in a later phase; Cloudflare
  Workers cannot use filesystem/process APIs, so keep all persistence in Neon.

---

## 9. Acceptance criteria

- [ ] A signed-in user can open `/dashboard` and see the sidebar + reader
      layout from the reference.
- [ ] A signed-out user is redirected to `/login`.
- [ ] Clicking Paste reads clipboard text and opens the save modal.
- [ ] Empty clipboard, denied permission, and unsupported clipboard all show a
      useful state; manual paste still works.
- [ ] The modal asks for a required title and optional tags, and pre-fills a
      suggested title and detected format.
- [ ] Submitting creates exactly one database row scoped to the current user.
- [ ] The new item appears at the top of the sidebar, is selected, and survives
      a page reload.
- [ ] Markdown content renders headings, lists, tables, code blocks, links, and
      blockquotes.
- [ ] Plain text preserves whitespace and line breaks.
- [ ] Search and tag filtering work.
- [ ] Delete removes the item from the sidebar and reader.
- [ ] User A cannot read or delete User B's items.
- [ ] The dashboard works at mobile, tablet, and desktop widths.
- [ ] The dashboard follows the selected daisyUI theme; switching themes while
      it is open updates it without a reload.
- [ ] `pnpm typecheck` and `pnpm build` pass.

---

## 10. Manual test checklist

1. Apply the migration and run `pnpm dev`.
2. Sign up as User A and open `/dashboard`.
3. Paste a Markdown answer containing a table and a code block.
4. Verify the suggested title, change it, add two tags, and save.
5. Confirm the item appears immediately and the detail renders correctly.
6. Reload; confirm the item and tags persist.
7. Paste plain text with indentation; confirm it is stored as plain text and
   whitespace is preserved.
8. Reject/deny clipboard permission; confirm manual paste works.
9. Paste an empty clipboard; confirm the error message.
10. Search and filter by tag; confirm the list narrows.
11. Copy raw content and compare it to the original.
12. Delete the item; confirm the list count updates.
13. Sign up as User B; confirm User A's items are absent and direct API access
    with User A's IDs returns `404`.
14. Test at 375px, 768px, and 1280px widths.
15. Switch between light/dark and at least one colorful daisyUI theme while the
    dashboard is open; confirm the sidebar, reader, buttons, inputs, and empty
    states all update without a reload.
16. Run the typecheck and production build.

---

## 11. Follow-up ideas

- Editable titles/tags/content.
- Draft autosave with a cleanup policy.
- Source metadata from a browser extension or desktop integration.
- Full-text search with PostgreSQL `tsvector` and ranking.
- Tag management (rename/merge/delete).
- Keyboard shortcuts (`Cmd/Ctrl+V` on dashboard, `/` to search).
- Export item as Markdown.
- Pinned/favorite items.
