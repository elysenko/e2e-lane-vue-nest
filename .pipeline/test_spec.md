# Test Specification

> **⚠️ Warning — `surface.json` is a stale scaffolder placeholder.**
> `.pipeline/surface.json` lists only `GET /api/health` and generic `App`/`Home`
> components that do not match this spec (it is explicitly marked
> `"overwritten by the scaffolder agent"`). The authoritative API/SPA surface below
> is derived from `requirements/spec.md` and `.pipeline/tasks.md` ("Surface contract").
> When `surface.json` is regenerated, reconcile the endpoint list against this file.
>
> **Auth-model note:** `tasks.md` flags an unresolved conflict — the spec body describes an
> `admin_only` baseline (fully public app, no 401/403, only `/admin/login` + seeded admin),
> while `<auth_model>` was resolved as `full_auth` (`/login`, `/signup`, first-signup-as-admin,
> `/admin/settings`). Cases for the `full_auth` surface are marked **[full_auth — pending reconciliation]**.
> The non-negotiable invariant from the spec NFR is: **public bookmark/about routes never return 401/403.**

## Coverage summary
- Total cases: 58
- API endpoints covered: 11 / 11 (spec+tasks surface; `surface.json` lists 1 stale placeholder — see warning)
- User journeys covered: 8

---

## API tests

### `GET /api/bookmarks`
- **Happy path**: On a fresh/empty DB after seeding, request returns `200` with a JSON array of exactly 3 seeded bookmarks (Vue, NestJS, PostgreSQL docs). Each element has shape `{ id: uuid, title: string, url: string, createdAt: ISO-timestamp }`.
- **Happy path (post-create)**: After a successful `POST`, the created bookmark appears in the returned array (count increments).
- **Validation failures**: N/A (no request body/params).
- **Auth failures**: None — route is public; must **never** return 401/403 even with no Authorization header.
- **Idempotency / edge cases**:
  - DB down → returns `503` with body `{ error: 'service_unavailable' }` (mapped by `all-exceptions.filter`), not a crash/500.
  - Empty table (before seed / seed failed) → returns `200` with `[]` (no server error).

### `POST /api/bookmarks`
- **Happy path**: Body `{ title: "Example", url: "https://example.com" }` → `201` with created entity `{ id, title, url, createdAt }`; subsequently visible in `GET /api/bookmarks`.
- **Validation failures** (global `ValidationPipe`, expect `400` with messages array):
  - Empty title: `{ title: "", url: "https://example.com" }` → `400`.
  - Missing title: `{ url: "https://example.com" }` → `400`.
  - Empty url: `{ title: "X", url: "" }` → `400`.
  - Missing url: `{ title: "X" }` → `400`.
  - Malformed url: `{ title: "X", url: "not-a-url" }` → `400`.
  - Non-http(s) scheme: `{ title: "X", url: "javascript:alert(1)" }` → `400` (rejected by `protocols:['http','https']`).
  - Non-http(s) scheme: `{ title: "X", url: "ftp://host/file" }` → `400`.
  - Whitelist strip: extra property `{ title, url, isAdmin: true }` → property stripped (whitelist), request still `201` with only valid fields persisted.
  - Accept case: `{ title: "X", url: "http://example.com" }` → `201` (plain http allowed).
- **Auth failures**: None — route is public; must **never** return 401/403.
- **Idempotency / edge cases**: DB down on insert → `503 { error: 'service_unavailable' }`, app stays up.

### `GET /api/health`
- **Happy path**: Returns `200` liveness response regardless of DB state.
- **Idempotency / edge cases**: With DB **stopped**, still returns `200` (liveness must not depend on DB).
- **Auth failures**: None — public.

### `GET /api/health/deep`
- **Happy path**: With DB reachable, Terminus DB ping succeeds → `200` with healthy status payload.
- **Idempotency / edge cases**: With DB **stopped/unreachable** → `503` (readiness reflects DB down).
- **Auth failures**: None — public.

### `POST /api/admin/login`
- **Happy path**: Body `{ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }` (matching seeded admin) → `200` with a JWT token in the response body.
- **Validation failures**:
  - Missing email or password → `400`.
  - Empty body `{}` → `400`.
- **Auth failures**:
  - Correct email, wrong password → `401`.
  - Unknown email → `401`.
- **Idempotency / edge cases**: DB down (cannot look up admin) → `503 { error: 'service_unavailable' }`, not a crash.

### `GET /api/admin/settings` **[full_auth — pending reconciliation]**
- **Happy path**: With a valid admin JWT (`Authorization: Bearer <token>`) → `200` with a list of service/integration keys for `postgresql` and `minio` plus the `PostgreSQL via TypeORM (pg driver)` integration key, each entry showing a **masked** value and a `configured` boolean status.
- **Validation failures**: N/A (no body).
- **Auth failures**:
  - No Authorization header → `401`.
  - Valid non-admin (USER role) JWT → `403`.
  - Malformed/expired JWT → `401`.
- **Idempotency / edge cases**: Values are always masked (never return raw secrets); DB down → `503`.

### `PATCH /api/admin/settings` **[full_auth — pending reconciliation]**
- **Happy path**: With admin JWT, body of key/value pairs → `200`; upserts `SystemSetting` rows; subsequent `GET` reflects `configured: true` for the updated keys (still masked).
- **Validation failures**: Malformed body (non-object / wrong types) → `400`.
- **Auth failures**: No token → `401`; USER-role token → `403`.
- **Idempotency / edge cases**:
  - Re-sending the same key/value is idempotent (upsert, no duplicate rows).
  - Reading a key still set to `PLACEHOLDER_CONFIGURE_IN_SETTINGS` via `resolveConfig` → treated as unconfigured (`configured: false`).
  - Using an unconfigured integration (`POSTGRESQL_VIA_TYPEORM_PG_DRIVER_API_KEY` null/placeholder) → downstream call raises `ServiceUnconfiguredError` → `503`.

### `POST /api/auth/signup` **[full_auth — pending reconciliation]**
- **Happy path (first user)**: First-ever signup `{ email, password }` → `201`; created user has role `ADMIN`.
- **Happy path (subsequent)**: Any later signup → `201`; created user has role `USER`.
- **Validation failures**: Missing/empty email or password → `400`; duplicate email → `409` (or `400`) conflict.
- **Auth failures**: None — signup is public.
- **Idempotency / edge cases**: DB down → `503`.

### `POST /api/auth/login` **[full_auth — pending reconciliation]**
- **Happy path**: Valid credentials → `200` with JWT (or session); token role claim matches user role.
- **Validation failures**: Missing fields → `400`.
- **Auth failures**: Wrong password / unknown email → `401`.
- **Idempotency / edge cases**: DB down → `503`.

### `POST /api/auth/logout` **[full_auth — pending reconciliation]**
- **Happy path**: With a valid session/token → `200`/`204`; token/session invalidated (subsequent protected call → `401`).
- **Auth failures**: No token → `401` (or `200` no-op, depending on stateless design — assert chosen behavior is consistent).

### SPA serving — explicit route handlers & real 404
Backend serves `index.html` only for the explicit known SPA paths; **all other unmatched paths return a real server 404** (no catch-all fallback).
- **Happy path (serve index.html, `200`)**: `GET /`, `GET /bookmarks`, `GET /bookmarks/new`, `GET /about`, `GET /admin/login` each return `200` with `index.html` content.
- **Static assets**: `GET /e2e-lane-vue-nest/assets/*` (built JS/CSS) return `200` with correct content-type (deep-link asset loading through ingress sub-path).
- **Real 404**: `GET /foo` (and any other unmatched path) returns a **real `404`** from Nest, NOT `index.html` with `200` (guards against SPA catch-all regression).
- **Auth failures**: None — all SPA-serving routes are public; never 401/403.

---

## UI / journey tests

### Journey: View bookmarks list
- **Steps**: Navigate to `/e2e-lane-vue-nest/bookmarks`.
- **Expected outcomes**:
  - Heading "My Bookmarks" is visible.
  - On a fresh DB, exactly 3 seeded rows render, each showing a title and a URL.
  - A prominent "Add Bookmark" button/link is visible and navigates to `/bookmarks/new`.
  - Assets load correctly under the `/e2e-lane-vue-nest/` base (no 404s on JS/CSS).
- **Negative path**: When `GET /api/bookmarks` fails (503/network), the view renders a graceful error state (not a blank/crashed page); app remains interactive.

### Journey: Add a bookmark
- **Steps**: From `/bookmarks`, click "Add Bookmark" → land on `/bookmarks/new`; type Title and URL; click "Create".
- **Expected outcomes**:
  - Valid input (`title` + `https://…`) → `POST /api/bookmarks` `201`, then redirect to `/bookmarks`; new bookmark appears in the list.
- **Negative path**:
  - Client-side validation blocks empty Title/URL before submit (inline error shown).
  - Server validation error (e.g. `javascript:alert(1)` or `not-a-url` that passes client checks) → `400` messages are surfaced and mapped to the relevant form field; no redirect; entered data preserved.
  - Server 503 (DB down) → error message shown, form stays usable, app does not crash.

### Journey: About page
- **Steps**: Navigate to `/e2e-lane-vue-nest/about`.
- **Expected outcomes**: Static page renders with heading "About Bookmarks"; `GET /about` returns `200`; no 401/403.
- **Negative path**: N/A (static content, no data fetch).

### Journey: Admin login
- **Steps**: Navigate to `/admin/login`; enter seeded admin email/password; submit form (`POST /api/admin/login`).
- **Expected outcomes**: Valid credentials → token received/stored; UI reflects logged-in admin state.
- **Negative path**: Wrong credentials → `401` surfaced as a visible error message; no token stored; user remains on login screen.

### Journey: User signup / login **[full_auth — pending reconciliation]**
- **Steps**: Navigate to `/signup`, register a new account; then `/login` with those credentials.
- **Expected outcomes**: First signup becomes ADMIN, subsequent USER; login succeeds and stores session/JWT; admin-only nav (e.g. settings link) shows only for admin-role users.
- **Negative path**: Duplicate email or bad credentials → visible error; no session established.

### Journey: Admin settings **[full_auth — pending reconciliation]**
- **Steps**: As logged-in admin, navigate to `/admin/settings`.
- **Expected outcomes**:
  - Lists each service in `postgresql, minio` with a configured/unconfigured badge and a per-service credential form.
  - Lists the `PostgreSQL via TypeORM (pg driver)` integration with its credential field(s).
  - Displays banner: "The following need credentials to activate: PostgreSQL via TypeORM (`pg` driver)".
  - Submitting credentials → `PATCH /api/admin/settings` `200`; badge flips to configured; values shown masked.
- **Negative path**: Non-admin (or unauthenticated) visitor is denied (`401`/`403` from API); page does not expose raw secret values.

### Journey: Unknown route → NotFound
- **Steps**: (a) Client-side: within the SPA, navigate to a bogus in-app path (e.g. `/e2e-lane-vue-nest/does-not-exist`). (b) Server-side: request `/foo` directly.
- **Expected outcomes**:
  - (a) Router `:pathMatch(.*)*` renders `NotFoundView` (client 404).
  - (b) Direct unmatched server path returns a **real `404`** (not `index.html`).
- **Negative path**: N/A.

### Journey: App stays up when DB is down
- **Steps**: Stop PostgreSQL, then load `/bookmarks` and attempt to create a bookmark.
- **Expected outcomes**:
  - List and create views render an error state (driven by `503 { error: 'service_unavailable' }`) instead of crashing.
  - `GET /api/health` still returns `200`; `GET /api/health/deep` returns `503`.
  - Boot with DB down does not crash the process (seeders wrapped in try/catch; `retryAttempts`).
- **Negative path**: N/A (this journey *is* the failure path).

---

## Data integrity tests
- After first boot on an empty DB, the `bookmarks` table contains **exactly 3** seed rows (Vue, NestJS, PostgreSQL docs).
- Seeding is **idempotent**: restarting the app does not add duplicate seed rows (still exactly 3 if untouched).
- Admin seeding is idempotent: repeated boots with the same `ADMIN_EMAIL`/`ADMIN_PASSWORD` do not create duplicate admin rows; password stored as a bcrypt hash (never plaintext).
- Every persisted `Bookmark` has a valid uuid `id`, non-empty `title`, an http/https `url`, and a `createdAt` timestamp — no row can be persisted that violates the DTO constraints (validation enforced before insert).
- A successful `POST /api/bookmarks` increases the row count by exactly 1; a rejected (`400`) create inserts nothing.
- `SystemSetting` upserts (`PATCH /api/admin/settings`) key on primary key — repeated writes to the same `key` update in place (no duplicate keys); `updatedAt` advances. **[full_auth]**
- **[full_auth]** First user created has role `ADMIN`, all subsequent users `USER`; email uniqueness enforced (duplicate signup rejected, no duplicate email rows).

---

## Out of scope
- **JWT expiry / refresh behavior** — spec is silent (`tasks.md` open question); no assertion on token TTL beyond "issued on valid login".
- **minio object-storage behavior** — provisioned/listed in settings only; spec body declares "No other third-party services" and defines no storage flow. Only its presence in the settings list is tested, not any upload/download behavior.
- **`POSTGRESQL_VIA_TYPEORM_PG_DRIVER_API_KEY` ↔ DB connection-string mapping** — semantics unresolved (`tasks.md` open question); tested only via the generic unconfigured→`503 ServiceUnconfiguredError` path, not a specific credential mapping.
- **Update / delete of bookmarks** — spec surface is list + create only; no `PUT`/`DELETE` endpoints exist to test.
- **Performance targets** (p95 render < 500ms) — noted in spec as manual/observational; not a pass/fail case in this functional spec.
- **Pagination / sorting / filtering of bookmarks** — spec does not define these.
- **The `full_auth` vs `admin_only` reconciliation itself** — cases are marked pending; the binding invariant enforced regardless is "public bookmark/about routes never 401/403".
