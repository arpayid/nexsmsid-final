# AGENTS.md

## Cursor Cloud specific instructions

NexSMSID V4 is a pnpm + Turborepo monorepo (a single product): a NestJS API
(`apps/api`, port `4000`, prefix `/api/v1`) and a Next.js 15 web app
(`apps/web`, port `3000`), backed by PostgreSQL 16 and Redis. Standard commands
live in `README.md` and `package.json` scripts — prefer those. The notes below
are only the non-obvious things that bite you in this VM.

### Services (start each session — NOT in the update script)

PostgreSQL and Redis are installed but **not** managed by systemd here, so start
them manually:

```bash
sudo pg_ctlcluster 16 main start
sudo redis-server --daemonize yes --appendonly yes
```

- Postgres role/db (matches `.env`): user `nexsmsid`, password `nexsmsid`,
  databases `nexsmsid` (dev) and `nexsmsid_test` (integration tests). If they are
  missing on a fresh volume, recreate the role + both DBs, then run
  `pnpm --filter @nexsmsid/api prisma migrate deploy` and
  `DATABASE_URL=postgresql://nexsmsid:nexsmsid@localhost:5432/nexsmsid?schema=public pnpm --filter @nexsmsid/api exec prisma db seed`.
- Redis is optional: BullMQ report jobs fall back to in-process execution if it
  is down, so the API still boots without it.

### `.env` is required and git-ignored

Copy `.env.example` to `.env` if absent. `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
must be long random strings (Zod env validation rejects the placeholder values);
generate with `openssl rand -base64 64`. The example's `SEED_SUPER_ADMIN_NAME`
value contains a space, so do **not** `source` the file from a shell — the apps
load it via `@nestjs/config` / Next.js automatically.

### `pnpm dev` does NOT work out of the box (run the compiled build instead)

Both dev runners are broken by tooling limitations in this repo state; the
`tsc`-compiled output works fine (build + all unit/integration tests pass):

1. **API** — `dev` uses `tsx watch`, but esbuild (used by tsx) does not emit
   `emitDecoratorMetadata`, so NestJS DI injects `undefined` and the app crashes
   in `MailerService` on startup. Run the compiled API instead:
   ```bash
   pnpm --filter @nexsmsid/api build
   node apps/api/dist/main.js        # reads /workspace/.env, listens on :4000
   ```
2. **Web** — `next dev --turbo` returns HTTP 500 on every route: the Edge
   middleware imports `@nexsmsid/types`, whose `development` export condition
   points at TS source that uses a `./portal-routing.js` specifier Turbopack's
   edge bundler cannot resolve. Run the standalone production build instead
   (`next.config.mjs` sets `output: "standalone"`, so `next start` fails with
   `routesManifest.dataRoutes is not iterable` — use `server.js`):
   ```bash
   pnpm --filter @nexsmsid/web build
   cd apps/web && cp -r .next/static .next/standalone/apps/web/.next/static \
     && cp -r public .next/standalone/apps/web/public 2>/dev/null
   cd .next/standalone && PORT=3000 API_INTERNAL_URL=http://localhost:4000 node apps/web/server.js
   ```
   The web server proxies `/api/v1/*` and `/socket.io/*` to `API_INTERNAL_URL`
   (default `http://localhost:4000`) via `next.config.mjs` rewrites, so the
   browser only needs `http://localhost:3000`.

### Lint / test / build (work as documented)

`pnpm lint`, `pnpm typecheck`, `pnpm --filter @nexsmsid/api test`, `pnpm build`,
and `pnpm validate:integration` (needs Postgres + Redis up; auto-creates and
seeds `nexsmsid_test`) all pass.

### Login / seed data

Seeded super admin: `superadmin@nexsmsid.dev` / `ChangeMe123!` with
`forceChangePassword=true` (first login forces a password change at
`/account/change-password`). The seed populates demo students, teachers, classes,
finance, PPDB, etc. Re-running the seed
(`DATABASE_URL=postgresql://nexsmsid:nexsmsid@localhost:5432/nexsmsid?schema=public pnpm --filter @nexsmsid/api exec prisma db seed`)
restores this credential if a prior session changed it.
