# NexSMSID V4 — Audit Roadmap

**Diperbarui:** 2026-06-18 (post-audit penuh)  
**Verdict saat ini:** Fase 4 Production Pilot ✅ — go-live pilot IP; HTTPS domain opsional

---

## Fase 0 — Init ✅

- [x] Monorepo pnpm + Turborepo
- [x] Prisma schema + migrations
- [x] CI workflow + self-hosted runner

## Fase 1 — Dev Ready ✅

- [x] `.env` + migrate + seed
- [x] Build + unit test + typecheck
- [x] Login superadmin seed
- [x] Compiled API/web run path documented (`AGENTS.md`)

**Exit criteria:** CI hijau + build pass → **met**

## Fase 2 — Quality ✅

- [x] Integration tests (37) — Postgres + Redis
- [x] PPDB integration + provision tests
- [x] ESLint + Prettier gate
- [x] UI Enterprise program S1–S20

**Exit criteria:** integration pass + smoke domain → **met**

## Fase 3 — Hardening ✅

- [x] Dockerfile HEALTHCHECK
- [x] Non-root API container
- [x] JWT secret validation production
- [x] Rate limit + Turnstile PPDB public
- [x] multer >=2.2.0 override (#40)
- [x] RBAC migration students.provision-portal

**Exit criteria:** docker audit PASS + audit high clean → **met**

## Fase 4 — Production Pilot (AKTIF — hampir selesai)

- [x] `docker-compose.prod.yml` healthy
- [x] nginx reverse proxy :80
- [x] `pnpm prod:smoke` 17/17
- [x] Backup/restore scripts
- [x] PPDB portal auto-provision (#39)
- [x] Public PPDB register fix (publicCompetencies)
- [x] Rebuild prod post-#39/#40 (2026-06-18)
- [ ] HTTPS domain nyata + certbot (saat DNS siap)
- [ ] QA manual browser residual

**Exit criteria go-live pilot:** prod smoke + health + backup tested → **met untuk IP pilot**

---

## Fase 5 — Post-Pilot (backlog)

| Prioritas | Task | Estimasi |
|-----------|------|----------|
| P1 | Rebuild prod Docker + migrate prod | 30 menit |
| P2 | js-yaml override (swagger transitive) | 1 jam |
| P2 | Fix 2 ESLint react-hooks warnings | 1 jam |
| P2 | QA manual: dark mode, mobile, a11y | 2–4 jam |
| P2 | HTTPS + domain production | saat DNS ready |
| P3 | Enable PR auto-merge di GitHub settings | 15 menit |
| P3 | Repair `pnpm dev` / Turbopack edge bundler | 4–8 jam |

---

## CI / GitHub Status (2026-06-18)

| Item | Status |
|------|--------|
| `main` latest CI | ✅ SUCCESS (`c2bde98`) |
| Open PRs | 0 |
| Merged recent | #39 PPDB provision, #40 multer, docs commit |

---

## Referensi

- [REPORT-2026-06-18.md](./REPORT-2026-06-18.md) — audit penuh hari ini
- [REPORT-2026-06-15.md](./REPORT-2026-06-15.md) — audit awal
- [UI-AUDIT-2026-06-16.md](./UI-AUDIT-2026-06-16.md) — UI Enterprise
- [../workflow/STATUS.md](../workflow/STATUS.md) — status operasional
