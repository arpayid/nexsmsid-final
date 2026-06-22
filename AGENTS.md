# AGENTS.md

## Cursor Cloud specific instructions

NexSMSID is a pnpm/Turborepo monorepo: NestJS API (`apps/api`, port 4000, prefix `/api/v1`),
Next.js web (`apps/web`, port 3000), and shared packages (`packages/{contracts,types,api-client,ui}`).
The production stack runs everything in Docker: `postgres`, `redis`, `api`, `web`, `nginx` (publishes
80/443), and a `backup` cron container. Standard dev/lint/test/build commands live in `README.md` and
the root `package.json` scripts — use those; this section only covers non-obvious cloud caveats.

### Dependencies / install
- Always install with `pnpm install --frozen-lockfile` (used by CI and both Dockerfiles). A plain
  `pnpm install` fails because `.npmrc` sets `strict-peer-dependencies=true` and a Sentry→vite peer is
  unmet; the frozen lockfile is the source of truth. The startup update script already runs this.

### Docker daemon (must be started each session)
- Docker is preinstalled in the VM image but the daemon is NOT auto-started. Start it once per session:
  `sudo dockerd > /tmp/dockerd.log 2>&1 &`
- `/etc/docker/daemon.json` is configured for nested DinD (`storage-driver: fuse-overlayfs` and
  `features.containerd-snapshotter: false`, required on Docker 29 for fuse-overlayfs); `iptables` is set
  to `iptables-legacy`. If the daemon won't start, re-apply those before retrying.
- Run docker as the `ubuntu` user via `sg docker -c "<cmd>"` (group membership isn't active in the
  login shell otherwise), or use `sudo docker`.

### Running the full prod stack in the cloud
- Use BOTH compose files — the cloud override is mandatory here:
  `docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.cloud.yml up -d`
- Why the override (`docker-compose.cloud.yml`): the Cloud VM's cgroup-v2 hierarchy is entirely a
  "threaded" subtree and does NOT delegate the `memory`/`io` controllers, so Docker cannot apply the
  per-container CPU/memory limits in `deploy.resources` (`runc ... cannot enter cgroupv2 ... it is in
  threaded mode`). The override zeroes those limits so containers can start, and adds a build-time
  `extra_hosts: api:127.0.0.1` for `web` so Next.js static-generation fetches fail fast instead of
  hanging ~5s each on the VM resolver's `SERVFAIL` for the bare `api` host (which can push slow pages
  past Next's 60s timeout). Real servers use `docker-compose.prod.yml` alone.
- nginx config is baked into the image from `docker/nginx/templates-src/` (no `conf.d` bind-mount); the
  upstreams are defined there, so do not expect to edit `docker/nginx/conf.d/*.conf` at runtime.

### .env.production (git-ignored — recreate if missing)
- `.env.production` is required and git-ignored. For a local HTTP pilot set `WEB_ORIGIN`/`CORS_ORIGIN` to
  `http://localhost`, generate JWT secrets with `openssl rand -base64 64`, and use the Turnstile test keys
  (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`). Validate with
  `bash scripts/validate-prod-env.sh` (its `SENTRY_DSN` check is the only failure you can ignore locally).
- `LOG_LEVEL` must be `error`, `warn`, or `debug`. The env enum also allows `log`/`verbose`, but those
  crash the pino logger at boot (`default level:log must be included in custom levels`).
- `SENTRY_DSN`: compose always passes it (empty string fails API env validation: `SENTRY_DSN: Invalid URL`).
  Set a well-formed dummy DSN for the pilot, or a real one in production.

### Migrations & seed
- Migrations are applied automatically: the api container entrypoint (`docker/api/entrypoint.sh`) runs
  `prisma migrate deploy` on startup before launching the server, so no manual migrate step is needed.
- Seeding is manual and only for first deploy. `DATABASE_URL` uses the `postgres` service host, so seed
  from inside the container. The seed refuses the default password under `NODE_ENV=production`, so pass
  non-default `SEED_SUPER_ADMIN_EMAIL`/`SEED_SUPER_ADMIN_PASSWORD` (and `SEED_SUPER_ADMIN_NAME`) via
  `exec -e`; if the runtime image lacks `tsx`, run the seed with `npx -y tsx@4 prisma/seed.ts`.
- After seed, the super-admin has `forceChangePassword=true`: login succeeds and redirects to
  `/account/change-password` — that is expected, not an error.
