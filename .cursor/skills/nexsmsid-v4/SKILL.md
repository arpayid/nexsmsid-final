---
name: nexsmsid-v4
description: Develop, debug, and extend NexSMSID V4 — enterprise school management monorepo (NestJS API, Next.js 15, Prisma, RBAC). Use when working in nexsmsid-v4, adding modules, API endpoints, admin pages, PPDB, portals, CI, or database changes.
---

# NexSMSID V4

## Stack (jangan improvisasi stack lain)

| Layer | Path | Tech |
|-------|------|------|
| API | `apps/api` | NestJS 11, Prisma 6, PostgreSQL 16, Redis 7, BullMQ |
| Web | `apps/web` | Next.js 15 App Router, React 19, Tailwind, `@nexsmsid/ui` |
| Shared | `packages/types`, `packages/api-client`, `packages/ui` | pnpm workspace |

API prefix: `/api/v1` · Dev ports: API `4000`, Web `3000`

## Dev bootstrap

```bash
pnpm install
cp .env.example .env          # JWT secrets min 64 chars
docker compose up -d          # project: nexsmsid-v4
pnpm --filter @nexsmsid/api prisma migrate dev
pnpm --filter @nexsmsid/api prisma db seed
pnpm dev
```

Seed login: `superadmin@nexsmsid.dev` / `ChangeMe123!` (force password change on first login).

## Quality gate (jalankan sebelum selesai)

```bash
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @nexsmsid/api test
pnpm build
pnpm validate:integration     # needs Postgres + Redis
pnpm audit --audit-level high
```

CI: self-hosted runner label `nexsmsid-v4`, compose project `nexsmsid-v4-ci` via `scripts/ci-services.sh`.

## Arsitektur modul API

Domain besar di `apps/api/src/modules/` (identity, academic, finance, ppdb, …). Fitur spesifik punya folder sendiri (`departments/`, `library/`, `payroll/`, …).

**Pola master data** (CRUD sederhana + soft delete + audit):

1. DTO: Zod schema di `*.dto.ts`
2. Service: extend `BaseMasterDataService` — set `modelName`, `auditEntity`, `searchableFields`, schemas
3. Controller: extend `MasterDataController` — pass service + optional Excel options
4. Module: register di `app.module.ts` atau parent module
5. Permission: `@RequirePermissions("…")` pada setiap handler (wajib — guard menolak endpoint tanpa permission eksplisit)

**Pola people** (siswa/guru/staff): extend `BasePeopleService` di `people/base-people.service.ts`.

**Response API**: gunakan `apiSuccess()` dari `common/api-response.ts` — jangan return raw entity tanpa envelope.

## Auth & keamanan (wajib)

- Global guards: `JwtAuthGuard` + `PermissionGuard` (`app.module.ts`)
- Dekorator: `@Public()`, `@AllowAuthenticated()`, atau `@RequirePermissions("code")`
- Token: httpOnly cookies (`auth-cookies.ts`) — jangan simpan JWT di localStorage
- Web middleware: `apps/web/src/middleware.ts` — isolasi portal admin/teacher/student/guardian
- Production: `env.validation.ts` — JWT 64+ char, Turnstile wajib, `WEB_ORIGIN` bukan localhost
- Upload: gunakan helper di `common/upload` — jangan terima path arbitrer dari client

## Menambah fitur end-to-end

Checklist minimal:

```
- [ ] Prisma schema + migration (jika perlu)
- [ ] API: module, service, controller, DTO (Zod)
- [ ] Permission seed / role mapping (jika endpoint baru)
- [ ] packages/api-client: domain method di domains/*.ts + wire di client.ts
- [ ] apps/web: halaman di app/admin/... atau portal terkait
- [ ] Unit test (*.spec.ts) dan/atau integration test (test/integration/)
- [ ] typecheck + lint + build
```

**Web admin master data**: reuse `MasterDataPage` — lihat `apps/web/src/app/admin/master-data/*/page.tsx`.

**Web API calls**: `createBrowserApiClient()` dari `@/lib/api-client`, hook `useApiQuery`.

## Monorepo rules

- Package scope: `@nexsmsid/api`, `@nexsmsid/web`, `@nexsmsid/types`, `@nexsmsid/ui`, `@nexsmsid/api-client`
- Build order: `types` → `api-client` / `ui` → `api` / `web` (Turbo handles this)
- Prisma: schema di `apps/api/prisma/schema.prisma`, generate via `pnpm --filter @nexsmsid/api prisma:generate`
- Dependency overrides: root `package.json` → `pnpm.overrides` (audit high harus hijau)

## Portals & routing

| Portal | Path prefix | Claim JWT `portal` |
|--------|-------------|-------------------|
| Admin | `/admin` | `admin` |
| Teacher | `/teacher` | `teacher` |
| Student | `/student` | `student` |
| Guardian | `/guardian` | `guardian` |
| Public | `/`, `/ppdb`, `/login` | — |

Portal helpers: `packages/types` → `portalHomePath`, `resolvePortalForUser`.

## Infra naming (v4 only)

| Context | Docker compose project |
|---------|------------------------|
| Local dev | `nexsmsid-v4` |
| CI | `nexsmsid-v4-ci` |
| Production | `nexsmsid-v4-prod` |

Jangan pakai `nexsmsid-ci` atau referensi repo v3.

## Kapan buat file baru vs reuse

| Kebutuhan | Gunakan |
|-----------|---------|
| CRUD master data | `BaseMasterDataService` + `MasterDataController` + `MasterDataPage` |
| CRUD orang | `BasePeopleService` + `PeoplePage` |
| Laporan/export | `report-engine/`, `report-jobs/` (BullMQ + Redis) |
| Notifikasi | `notifications/` (email, WhatsApp opsional) |
| PPDB publik | `public-ppdb/` + captcha |

## Referensi detail

- Peta domain API & permission patterns: [modules.md](modules.md)
- CI runner setup: [SELF_HOSTED_RUNNER.md](../../../.github/SELF_HOSTED_RUNNER.md)
