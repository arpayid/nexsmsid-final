---
name: nexsmsid-v4-master
description: Master orchestrator for NexSMSID V4 monorepo — maps entire project, routes tasks to local and external skills (skills.sh, ECC, awesome-cursor-skills), and defines audit → develop → deploy workflows. Use for any work in nexsmsid-v4 when unsure which skill to load, onboarding, full-project context, or multi-domain tasks.
compatibility: pnpm 10, Node 20+, Docker, PostgreSQL 16, Redis 7, self-hosted GHA runner label nexsmsid-v4
---

# NexSMSID V4 — Master Skill

Skill utama yang memetakan seluruh project dan mengarahkan agent ke skill spesifik (lokal + eksternal).

## Kapan pakai skill ini

- Mulai sesi baru di repo `nexsmsid-v4`
- Task menyentuh banyak layer (DB + API + Web + CI)
- Audit, onboarding, atau pre-deploy review
- Tidak yakin skill mana yang relevan

**Langkah pertama:** baca `nexsmsid-v4-workflow` + `STATUS.md` → baca skill ini → pilih sub-skill → ikuti konvensi `nexsmsid-v4`.

---

## Peta project

```
nexsmsid-v4/
├── apps/
│   ├── api/          NestJS 11, Prisma, BullMQ, JWT auth
│   └── web/          Next.js 15 App Router, 5 portal
├── packages/
│   ├── types/        Shared TS types, portal helpers
│   ├── api-client/   Typed HTTP client per domain
│   └── ui/           Shared React components
├── docker-compose.yml          project: nexsmsid-v4
├── docker-compose.prod.yml     project: nexsmsid-v4-prod
├── .github/workflows/ci.yml    runs-on: nexsmsid-v4
├── scripts/ci-services.sh      CI postgres+redis (nexsmsid-v4-ci)
└── .cursor/skills/               skill lokal (tidak di-commit)
```

| Layer | Path | Port / prefix |
|-------|------|---------------|
| API | `apps/api` | `:4000`, `/api/v1` |
| Web | `apps/web` | `:3000` |
| DB | Docker postgres | `:5432` |
| Queue | Docker redis + BullMQ | `:6379` |

Package scope: `@nexsmsid/*` · Package manager: `pnpm@10` · Build: Turbo

---

## Skill registry

### Lokal (`.cursor/skills/`)

| Skill | Path | Gunakan saat |
|-------|------|--------------|
| **nexsmsid-v4-workflow** | `nexsmsid-v4-workflow/` | Fase project, D→P→I→V→R, quality gate |
| **nexsmsid-v4** | `nexsmsid-v4/` | Develop fitur, debug, konvensi kode |
| **nexsmsid-v4-master** | `nexsmsid-v4-master/` | Orchestrasi & routing skill (ini) |
| **nexsmsid-project-audit** | `nexsmsid-project-audit/` | Audit end-to-end + roadmap |
| **fullstack-project-audit** | `fullstack-project-audit/` | Framework audit 7 fase umum |
| **docker-compose-audit** | `docker-compose-audit/` | Hardening container/compose |
| **auditing-security** | `auditing-security/` | Security review OWASP (vendored awesome-cursor-skills) |
| **codebase-onboarding** | `codebase-onboarding/` | Generate onboarding doc |

Detail modul API: `nexsmsid-v4/modules.md`

### Eksternal (`.agents/skills/` — via skills.sh)

| Skill | Sumber | Gunakan saat |
|-------|--------|--------------|
| **nestjs-best-practices** | kadajett/agent-nestjs-skills | Module/guard/DI, API patterns |
| **nextjs-app-router-patterns** | wshobson/agents | App Router, RSC, layouts |
| **prisma-database-setup** | prisma/skills | Schema, migrate, seed |
| **prisma-client-api** | prisma/skills | Query, transaction, middleware |
| **turborepo** | vercel/turborepo | Monorepo task, cache, pipeline |
| **docker-expert** | sickn33/antigravity-awesome-skills | Dockerfile, networking |
| **docker-patterns** | affaan-m/everything-claude-code | ECC Docker best practices |
| **vitest** | antfu/skills | Unit/integration test patterns |
| **github-actions** | dalestudy/skills | CI workflow, self-hosted runner |

Install tambahan: `npx skills add <owner/repo@skill> -a cursor -y`

---

## Routing: task → skill

| User intent | Baca skill |
|-------------|------------|
| Mulai sesi / fase project / planning | `nexsmsid-v4-workflow` |
| Tambah/edit fitur API | `nexsmsid-v4` + `nestjs-best-practices` |
| Tambah halaman web / portal | `nexsmsid-v4` + `nextjs-app-router-patterns` |
| Ubah schema / migration | `nexsmsid-v4` + `prisma-database-setup` + `prisma-client-api` |
| Query Prisma kompleks | `prisma-client-api` |
| Monorepo / turbo / cache | `turborepo` |
| Dockerfile / compose prod | `docker-expert` + `docker-patterns` + `docker-compose-audit` |
| CI / runner / workflow | `github-actions` + baca `.github/SELF_HOSTED_RUNNER.md` |
| Unit / integration test | `vitest` + `nexsmsid-v4` (quality gate) |
| Audit project | `nexsmsid-project-audit` (orchestrator) |
| Security hardening | `auditing-security` |
| Onboarding developer baru | `codebase-onboarding` |
| Tidak jelas | **skill ini** → narrow down |

---

## Workflow standar

Detail lengkap: `.cursor/workflow/WORKFLOW.md` · Status: `.cursor/workflow/STATUS.md`

### 0. Cek fase (setiap sesi)
Baca `STATUS.md` → jalankan checklist fase aktif sebelum fitur baru.

### 1. Bootstrap dev (Fase 1)

```bash
pnpm install
cp .env.example .env          # JWT min 64 char
docker compose up -d          # nexsmsid-v4
pnpm --filter @nexsmsid/api prisma migrate dev
pnpm --filter @nexsmsid/api prisma db seed
pnpm dev
```

Login seed: `superadmin@nexsmsid.dev` / `ChangeMe123!`

### 2. Develop fitur

Ikuti checklist di `nexsmsid-v4` → muat sub-skill sesuai layer.

### 3. Quality gate (mirror CI)

```bash
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @nexsmsid/api test
pnpm build
pnpm validate:integration     # butuh postgres+redis
pnpm audit --audit-level high
```

### 4. Audit (jika diminta)

Jalankan `nexsmsid-project-audit` → output ke `.cursor/audit/REPORT-*.md` + `ROADMAP.md`

### 5. Deploy staging/prod

```bash
pnpm docker:prod:build && pnpm docker:prod:up
pnpm db:migrate:prod && pnpm db:seed:prod   # seed hanya first deploy
pnpm health
```

---

## Konvensi kritis (jangan dilanggar)

1. **RBAC wajib** — setiap endpoint protected butuh `@RequirePermissions(...)`; tanpa itu → 403
2. **JWT di httpOnly cookie** — bukan localStorage
3. **Response envelope** — `apiSuccess()` di API
4. **Soft delete** — `deletedAt`, jangan hard delete master data
5. **Infra v4 only** — compose project `nexsmsid-v4` / `nexsmsid-v4-ci` / `nexsmsid-v4-prod`; runner label `nexsmsid-v4`
6. **pnpm.overrides** — jaga `pnpm audit --audit-level high` hijau
7. **Skill lokal** — `.cursor/` dan `.agents/` tidak di-commit kecuali user minta

---

## Security hotspots

Prioritas review manual:

- `apps/api/src/auth/` — JWT, refresh rotation, lockout
- `apps/api/src/auth/guards/permission.guard.ts`
- `apps/web/src/middleware.ts` — portal isolation
- `apps/api/src/public-ppdb/` — upload publik, quota
- `apps/api/src/config/env.validation.ts` — prod constraints

---

## Artefak audit & roadmap

| File | Isi |
|------|-----|
| `.cursor/audit/REPORT-*.md` | Temuan audit terbaru |
| `.cursor/audit/ROADMAP.md` | Fase 1–4 prioritas |
| `.cursor/audit/ONBOARDING.md` | Onboarding (jika dibuat) |

**Verdict saat ini (2026-06-15):** CI hijau, build/test pass, belum dev-ready (no `.env`, no smoke test).

---

## Model & agent

- Model tersedia: **Composer 2.5 Fast** (`composer-2.5-fast`)
- Subagent explore: gunakan untuk onboarding paralel (lihat `codebase-onboarding`)

---

## Referensi cepat

- Module map: [modules.md](../nexsmsid-v4/modules.md)
- Develop conventions: [nexsmsid-v4/SKILL.md](../nexsmsid-v4/SKILL.md)
- Audit orchestrator: [nexsmsid-project-audit/SKILL.md](../nexsmsid-project-audit/SKILL.md)
- Skill index: [SKILLS-INDEX.md](../SKILLS-INDEX.md)
- CI runner: [SELF_HOSTED_RUNNER.md](../../../.github/SELF_HOSTED_RUNNER.md)
