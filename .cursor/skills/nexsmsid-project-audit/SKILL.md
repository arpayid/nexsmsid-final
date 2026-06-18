---
name: nexsmsid-project-audit
description: Runs end-to-end audit of NexSMSID V4 school management monorepo and produces report plus roadmap. Orchestrates fullstack-project-audit, docker-compose-audit, and nexsmsid-v4 domain checks. Use when auditing nexsmsid-v4 from scratch, onboarding, pre-deploy review, or creating audit roadmap.
compatibility: Requires pnpm, docker, gh CLI, postgres/redis for integration tests
---

# NexSMSID V4 — Project Audit Orchestrator

## Output wajib

Setelah audit, tulis ke `.cursor/audit/`:

1. `ROADMAP.md` — fase, risiko, exit criteria (sumber kebenaran; laporan harian opsional lokal, tidak di-commit)

## Urutan eksekusi

```
1. Discovery     → README, package.json, app.module.ts, prisma schema
2. Infrastructure→ docker ps, ss ports, .env, runner CI
3. Automated     → format, lint, typecheck, test, build, integration, audit
4. Docker        → scripts/docker-audit.sh + docker-compose-audit skill
5. Security      → auditing-security patterns (auth, RBAC, public PPDB)
6. Smoke test    → pnpm dev + login + 1 CRUD (jika env siap)
7. Roadmap       → prioritas dari risk register
```

## Perintah audit cepat

```bash
# Infrastructure
docker ps
ss -tlnp | grep -E '3000|4000|5432|6379'
test -f .env || echo "BLOCKER: .env missing"

# Automated (mirror CI)
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @nexsmsid/api test && pnpm build
NODE_ENV=test DATABASE_URL="postgresql://nexsmsid:nexsmsid@localhost:5432/nexsmsid_test?schema=public" \
  pnpm --filter @nexsmsid/api test:integration
pnpm audit --audit-level high

# Docker
.cursor/skills/fullstack-project-audit/scripts/docker-audit.sh .

# CI remote
gh run list --repo arpayid/nexsmsid-v4 --branch main --limit 3
gh api repos/arpayid/nexsmsid-v4/actions/runners
```

## Kriteria verdict

| Verdict | Syarat |
|---------|--------|
| **Dev ready** | CI hijau + build/test pass + `.env` + `pnpm dev` + login OK |
| **Feature ready** | Dev ready + smoke test 5 domain |
| **Prod ready** | Feature ready + docker audit clean + staging healthcheck + Turnstile prod |

## Sub-skills (muat bersamaan)

| Skill | Fokus |
|-------|-------|
| `fullstack-project-audit` | Framework 7 fase umum |
| `docker-compose-audit` | Container hardening |
| `nexsmsid-v4` | Konvensi develop fitur |

## Security hotspots (NexSMSID)

Wajib review file ini:

- `apps/api/src/auth/` — JWT, refresh, lockout
- `apps/api/src/auth/guards/permission.guard.ts`
- `apps/web/src/middleware.ts`
- `apps/api/src/public-ppdb/` — upload, quota
- `apps/api/src/config/env.validation.ts`

Pola dari [awesome-cursor-skills/auditing-security](https://github.com/spencerpauly/awesome-cursor-skills).

## Roadmap template (isi dari temuan)

```markdown
## Fase 1 Dev Ready (1–2 hari)
- .env + migrate + seed + pnpm dev + login

## Fase 2 Quality (3–5 hari)
- Smoke test per domain bisnis
- GHA Node 24 upgrade

## Fase 3 Hardening (6–8 hari)
- Dockerfile HEALTHCHECK
- PPDB upload review

## Fase 4 Production (9–12 hari)
- docker:prod:up + health + backup
```

## Referensi audit terakhir

- [../../audit/ROADMAP.md](../../audit/ROADMAP.md)
