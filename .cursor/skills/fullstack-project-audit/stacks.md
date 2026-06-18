# Stack-Specific Audit Notes

## Node monorepo (pnpm + Turbo)

```bash
pnpm install
pnpm build && pnpm typecheck && pnpm lint
pnpm --filter <api> test
pnpm validate:integration   # jika ada
pnpm audit --audit-level high
```

Cek: workspace packages, shared types flow, Prisma migrate path, Redis untuk queue.

## NestJS API

- `app.module.ts` — global guards, throttler
- `*.controller.ts` — `@Public`, `@RequirePermissions`, atau setara
- `config/env.validation.ts` — production constraints
- `prisma/schema.prisma` + migrations
- Integration: `test/integration/`

## Next.js / React

- `middleware.ts` — auth redirect, role routing
- Cookie vs localStorage untuk token
- `app/` route groups per portal
- API client layer (typed vs raw fetch)

## Self-hosted CI

- `runs-on` labels cocok dengan runner terdaftar
- `services:` GitHub-hosted **tidak** jalan di self-hosted — butuh docker compose script lokal
- Cek run `queued` lama = runner mismatch

## Docker

```bash
docker compose ps
docker compose -p <project> config
```

Perhatikan: compose project name bentrok antar repo, volume stale dari project lama.

## PHP / Laravel (jika ditemui)

- `.env.example`, `artisan migrate`, queue worker, `phpunit`
- Policy/gate per controller

## Go (jika ditemui)

- `Makefile`, `go test ./...`, `golangci-lint`
- Migrations (goose/migrate), config via env

## Output severity guide

| Severity | Kriteria |
|----------|----------|
| Blocker | Security hole, data loss, CI broken, cannot run dev |
| Warning | Missing tests, audit fail, perf concern, debt |
| Nit | Naming, docs, style inconsistency |
