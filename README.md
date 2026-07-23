# e2e-lane-vue-nest

A fully-public **Bookmarks** app: browse and add bookmarks (title + URL), with an
About page. Built as two services:

- **`web/`** — Vue 3 + Vite SPA (vue-router `createWebHistory`), served by nginx
  with an SPA fallback and an `/api/` reverse-proxy to the backend.
- **`backend/`** — NestJS + Prisma (PostgreSQL) REST API on port `3000`.

Served behind the ingress sub-path `/e2e-lane-vue-nest/` (Vite `--base` +
nginx). The ingress strips the prefix, so nginx receives `/` and `/api/...`.

## API surface

| Method | Path                  | Notes                                             |
| ------ | --------------------- | ------------------------------------------------- |
| GET    | `/api/bookmarks`      | List bookmarks (public)                           |
| POST   | `/api/bookmarks`      | Create; validates non-empty title + http/https URL |
| GET    | `/api/health`         | Liveness — never touches the DB                   |
| GET    | `/api/health/deep`    | Readiness — pings the DB (503 if down)            |
| POST   | `/api/admin/login`    | Seeded admin login → JWT                          |
| GET    | `/api/admin/settings` | Admin-only; masked service/integration config     |
| PATCH  | `/api/admin/settings` | Admin-only; upsert config key/values              |
| POST   | `/api/auth/signup`    | First user becomes ADMIN, others USER             |
| POST   | `/api/auth/login`     | User login → JWT                                  |

Public bookmark/about routes are never guarded (no 401/403). DB/connection
failures are mapped to a JSON `503 { error: 'service_unavailable' }` by a global
exception filter, so the UI degrades gracefully instead of crashing.

## Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy          # apply migrations
node prisma/seed/seed.js           # seed admin + example bookmarks (idempotent)
npm run build && npm run start:prod
```

The `BookmarksSeeder` and `AdminSeeder` also seed idempotently on boot, wrapped
in try/catch so a down DB never crashes startup.

## Frontend

```bash
cd web
npm install
npx vite build --base=/e2e-lane-vue-nest/
npm run dev                        # local dev, proxies /api → :3000
```

## Environment (from `app-secrets`)

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded admin credentials (optional; a
  deterministic demo credential is derived and printed as `SEED_CRED` otherwise)
- `PORT` — backend port (default `3000`)
