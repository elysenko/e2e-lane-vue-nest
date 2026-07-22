# Pipeline Task Decomposition

## Summary
A greenfield Vue 3 + NestJS + PostgreSQL app packaged as a single container that serves both the REST API and the built SPA on port 80 under the `/e2e-lane-vue-nest/` ingress sub-path. It exposes a fully-public bookmark list/create UI plus an About page, with server-side URL validation (http/https only), idempotent first-load seeding of 3 example bookmarks, graceful DB-error handling (503 JSON instead of crashes), health probes, and an auth baseline with a seeded admin login.

## Surface contract
**API routes (backend_agent):**
- `GET /api/bookmarks` — list bookmarks
- `POST /api/bookmarks` — create bookmark (validated)
- `GET /api/health` — liveness
- `GET /api/health/deep` — DB-ping readiness (`@nestjs/terminus`)
- `POST /api/admin/login` — validate seeded admin (bcrypt) → JWT
- `GET /api/admin/settings` — list service/integration keys (masked value + configured status), admin-only
- `PATCH /api/admin/settings` — upsert key/value pairs, admin-only
- Auth flows (full_auth): `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- Explicit SPA-serving `GET` handlers for `/`, `/bookmarks`, `/bookmarks/new`, `/about`, `/admin/login` → `index.html`; all other unmatched paths → real 404 (no catch-all fallback)

**SPA routes / screens (ui_agent), base `/e2e-lane-vue-nest/`:**
- `/bookmarks` — BookmarksView ("My Bookmarks", rows of title+URL, "Add Bookmark" button)
- `/bookmarks/new` — BookmarkNewView (Title + URL fields, "Create", client + server validation)
- `/about` — AboutView (static, heading "About Bookmarks")
- `/admin/login` — AdminLoginView (posts to `/api/admin/login`)
- `/login`, `/signup` — user auth screens (full_auth)
- `/admin/settings` — admin settings page (service + integration credential config)
- `:pathMatch(.*)*` — NotFoundView (client 404)
- Each route carries a `meta.flow` node for machine-verifiability; no route guards on public bookmark/about routes.

**Entities:**
- `Bookmark` — `id` (uuid), `title` (string, non-empty), `url` (string, http/https URL), `createdAt`
- `User` — with `role` enum field (auth model, see below)
- `SystemSetting` — `key` (id), `value`, `updatedAt`

## db_agent tasks
- [ ] Create `Bookmark` entity (`src/bookmarks/bookmark.entity.ts`): `id` uuid PK, `title` string, `url` string, `createdAt` timestamp.
- [ ] Create `User` entity/model with `enum UserRole { ADMIN, USER }` and `role UserRole @default(USER)` (full_auth): fields for email (unique), password hash (bcrypt), `role`, timestamps.
- [ ] Create `SystemSetting` entity: `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (admin settings store for provisioned services postgresql, minio).
- [ ] Configure TypeORM Postgres connection in `app.module.ts` (`TypeOrmModule`) with `retryAttempts`, `autoLoadEntities`, reading `DATABASE_URL`/`PG*` env — schema/entity registration only (connection wiring shared with backend_agent's module composition).
- [ ] Ensure entities are registered so idempotent seeders (bookmarks, admin, first-user-as-admin) can operate without schema drift.

## backend_agent tasks
- [ ] Scaffold NestJS project config: `backend/package.json`, `tsconfig.json`, `nest-cli.json` with dependencies (`@nestjs/{core,common,platform-express,config,typeorm,jwt,passport,terminus}`, `typeorm`, `pg`, `class-validator`, `class-transformer`, `@nestjs/serve-static`, `passport`, `passport-jwt`, `bcrypt`).
- [ ] Implement `src/main.ts`: bootstrap, global `ValidationPipe` (whitelist), listen on `process.env.PORT || 80`, register global exception filter.
- [ ] Implement `src/app.module.ts`: `ConfigModule`, `TypeOrmModule`, `ServeStaticModule` (serve `frontend/dist` assets, `serveRoot` off, no SPA wildcard fallback), feature modules.
- [ ] Implement `src/bookmarks/dto/create-bookmark.dto.ts`: `@IsNotEmpty` title; url `@IsNotEmpty` + `@IsUrl({require_protocol:true, protocols:['http','https']})` (reject blank, `not-a-url`, `javascript:alert(1)`).
- [ ] Implement `src/bookmarks/bookmarks.service.ts` (CRUD + idempotent seeding helper) and `src/bookmarks/bookmarks.controller.ts` (`GET /api/bookmarks`, `POST /api/bookmarks`) and `bookmarks.module.ts`.
- [ ] Implement `src/bookmarks/bookmarks.seeder.ts` (`OnModuleInit`): if table empty insert 3 examples (Vue, NestJS, PostgreSQL docs); wrap in try/catch so a down DB never crashes boot.
- [ ] Implement `src/frontend/frontend.controller.ts`: explicit `GET` handlers for `/`, `/bookmarks`, `/bookmarks/new`, `/about`, `/admin/login` returning `index.html`; unmatched paths fall through to Nest 404.
- [ ] Implement `src/health/health.controller.ts`: `GET /api/health` (liveness), `GET /api/health/deep` (DB ping via `@nestjs/terminus`).
- [ ] Implement `src/common/filters/all-exceptions.filter.ts`: map DB/connection errors to JSON `503` `{error:'service_unavailable'}`.
- [ ] Implement admin auth: `src/admin/admin.controller.ts`, `admin.module.ts`, `jwt.strategy.ts` — `POST /api/admin/login` validating seeded admin (bcrypt) → JWT; admin guard middleware for `(admin)` route group; `src/admin/admin.seeder.ts` seeds admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (idempotent).
- [ ] Implement full_auth user flows: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`; first user created via signup gets `ADMIN` role, subsequent users get `USER`; protect all non-public app routes; keep public bookmark/about routes ungated (no 401/403).
- [ ] Implement `lib/config.ts` with `resolveConfig(key: string): string | null` — reads `process.env[key]` first; if value equals `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, reads from `SystemSetting` DB row; returns null if neither set.
- [ ] Implement `GET /api/admin/settings` (list service keys for postgresql + minio + integration keys with masked values + configured status) and `PATCH /api/admin/settings` (upsert key/value, admin role required).
- [ ] Implement `lib/integrations/postgresql-via-typeorm.ts` — typed client calling `resolveConfig('POSTGRESQL_VIA_TYPEORM_PG_DRIVER_API_KEY')`; throw `ServiceUnconfiguredError` (503) if null or `PLACEHOLDER_CONFIGURE_IN_SETTINGS`; export only functions the spec requires (Postgres/TypeORM datastore access). Include its env key in the `GET /api/admin/settings` response.
- [ ] Provide the multi-stage `Dockerfile` (build Vue → build Nest → Node runtime serving both on port 80, copying `backend/dist` + `frontend/dist` + prod deps) and document run/build/env in `README.md`.

## ui_agent tasks
- [ ] Scaffold frontend config: `frontend/package.json`, `tsconfig.json`, `vite.config.ts` (`base: '/e2e-lane-vue-nest/'`, build outDir consumed by backend), `index.html`, `src/main.ts`, `src/App.vue`.
- [ ] Implement `src/router/index.ts`: `createWebHistory('/e2e-lane-vue-nest/')`; routes for `/bookmarks`, `/bookmarks/new`, `/about`, `/admin/login`, `/login`, `/signup`, `:pathMatch(.*)*` → NotFound; each route carries `meta.flow` node; no guards on public routes.
- [ ] Implement `src/views/BookmarksView.vue`: heading "My Bookmarks", rows (title + URL), prominent "Add Bookmark" button → `/bookmarks/new`; empty/loading/graceful-error states on fetch failure.
- [ ] Implement `src/views/BookmarkNewView.vue`: Title + URL fields, "Create" button; client-side validation + display of server validation errors; redirect to `/bookmarks` on success.
- [ ] Implement `src/views/AboutView.vue` (static, heading "About Bookmarks") and `src/views/NotFoundView.vue` (client 404).
- [ ] Implement `src/views/AdminLoginView.vue`: admin login form posting to `/api/admin/login`.
- [ ] Implement `/login` and `/signup` screens (full_auth) as part of main app; show admin section in nav only to admin-role users.
- [ ] Implement `/admin/settings` page: list each service in `postgresql, minio` with configured/unconfigured badge + per-service credential form; list the `PostgreSQL via TypeORM (pg driver)` integration with its credential field(s); display prominent banner "The following need credentials to activate: PostgreSQL via TypeORM (`pg` driver)" (placeholder integration).

## service_agent tasks
- [ ] Implement `src/api/client.ts`: base URL `import.meta.env.BASE_URL + 'api'`; wrap fetch; surface network/DB (503) errors to callers.
- [ ] Wire BookmarksView to `GET /api/bookmarks` via the client (list fetch + error/empty handling).
- [ ] Wire BookmarkNewView to `POST /api/bookmarks` (submit, map 400 validation messages to form fields, redirect to `/bookmarks` on success).
- [ ] Wire AdminLoginView to `POST /api/admin/login` and user `/login`+`/signup` to the auth endpoints; store/attach JWT for admin-only settings calls.
- [ ] Wire `/admin/settings` page to `GET`/`PATCH /api/admin/settings` (load masked keys + configured status, submit credential updates).

## tester tasks
- [ ] Unit: DTO validation — reject empty title, empty url, `not-a-url`, `javascript:alert(1)`; accept `https://…`.
- [ ] Integration/e2e: `GET /api/bookmarks` returns exactly 3 seeded rows on fresh DB; `POST` valid → 201 and appears in list; invalid → 400.
- [ ] Integration/e2e: `/foo` → real 404; `/about` → 200; deep link `/e2e-lane-vue-nest/bookmarks` loads assets; public routes never return 401/403.
- [ ] Seeding: boot with empty DB seeds exactly 3 bookmarks; idempotent across restart; admin seeded from env idempotently.
- [ ] Failure handling: with DB stopped, list/create render error state and app stays up; `/api/health` still 200, `/api/health/deep` → 503.
- [ ] Auth (full_auth): first signup gets ADMIN, subsequent signups get USER; admin login succeeds; `/admin/settings` requires admin; unconfigured integration returns 503 via `ServiceUnconfiguredError`.

## Open questions
- **Auth model conflict:** the spec text describes an `admin_only` baseline ("app fully public / no 401/403", only `/admin/login` + seeded admin), but `<auth_model>` is `full_auth`. Per pipeline rules I applied `full_auth` (User role enum with USER default, `/login`+`/signup`, first-signup-as-admin). Downstream agents must confirm whether public bookmark/about routes remain ungated (spec NFR) while user auth screens still exist — reconcile before implementation.
- **Integration env key semantics:** `<spec_integrations>` derived env key `POSTGRESQL_VIA_TYPEORM_PG_DRIVER_API_KEY` is an API-key-style name, but PostgreSQL access uses `DATABASE_URL`/`PG*` credentials, not an API key. Confirm whether the settings-configured key maps to the DB connection string or is a separate placeholder.
- **minio deployment:** `minio` is listed in `<spec_deployments>` (so it appears in `/admin/settings`), but the spec body declares "No other third-party services" and defines no object-storage behaviour. Confirm whether minio is actually used or only provisioned.
- Spec does not specify JWT expiry/refresh behaviour for admin/user sessions — downstream to choose a sensible default.
