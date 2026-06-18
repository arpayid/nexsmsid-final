# Rencana Kerja Rinci — NexSMSID V4

**Dibuat:** 2026-06-15 · **Eksekusi terakhir:** 2026-06-16  
**Berdasarkan:** [WORKFLOW.md](WORKFLOW.md) · [STATUS.md](STATUS.md) · [ROADMAP.md](../audit/ROADMAP.md)  

> **Status eksekusi:** Fase 0–3 ✅ selesai · **Fase 4 aktif** (prod pilot jalan).  
> Sumber kebenaran fase & backlog: **[STATUS.md](STATUS.md)** — dokumen ini tetap sebagai rencana referensi per fase.

---

## Ringkasan eksekutif

| Aspek | Nilai |
|-------|-------|
| **Tujuan utama** | Project siap develop → quality → hardening → production pilot |
| **Durasi estimasi** | 10–12 hari kerja (Fase 1–4) |
| **Blocker saat ini** | HTTPS domain (opsional pilot lokal) — lihat STATUS.md |
| **Yang sudah siap** | CI hijau, build/test/integration pass, prod stack healthy |
| **Model agent** | Composer 2.5 Fast only |

```mermaid
gantt
    title Rencana Kerja NexSMSID V4
    dateFormat YYYY-MM-DD
    section Fase0
    Inisialisasi_skill_workflow     :done, p0, 2026-06-15, 1d
    section Fase1_DevReady
    Setup_env_docker                :active, p1a, 2026-06-16, 1d
    Migrate_seed_dev_login          :p1b, after p1a, 1d
    section Fase2_Quality
    Smoke_master_people_akademik    :p2a, 2026-06-18, 1d
    Smoke_finance_ppdb_portal       :p2b, after p2a, 1d
    CI_upgrade_node24               :p2c, 2026-06-18, 1d
    section Fase3_Hardening
    Docker_HEALTHCHECK              :p3a, 2026-06-20, 1d
    Security_PPDB_audit             :p3b, after p3a, 1d
    Docker_audit_cleanup            :p3c, after p3b, 1d
    section Fase4_Production
    Prod_env_compose                :p4a, 2026-06-23, 1d
    Health_backup_https             :p4b, after p4a, 2d
```

---

## Prinsip operasional

### Setiap sesi kerja dimulai dengan

1. Baca `STATUS.md`
2. Muat skill `nexsmsid-v4-workflow`
3. Kerjakan hanya task fase aktif (kecuali user override)

### Setiap task kode (setelah Fase 1)

Ikuti **D → P → I → V → R** — detail di [checklists/task-cycle.md](checklists/task-cycle.md)

### Definisi selesai

| Level | Kriteria |
|-------|----------|
| Sub-task | Output terverifikasi + dicatat di log |
| Fase | Semua exit criteria ✅ di `STATUS.md` |
| Project pilot-ready | Fase 4 exit + tidak ada risk High open |

---

## Fase 0 — Inisialisasi ✅ SELESAI

**Tujuan:** Fondasi skill, audit, workflow, dan CI terisolasi dari v3.

| ID | Task | Status | Output |
|----|------|--------|--------|
| P0-01 | Install skill lokal (nexsmsid-v4, audit, workflow) | ✅ | `.cursor/skills/` |
| P0-02 | Install skill eksternal via skills.sh | ✅ | `.agents/skills/` (9 skill) |
| P0-03 | Audit baseline | ✅ | `ROADMAP.md` |
| P0-04 | Roadmap audit | ✅ | `ROADMAP.md` |
| P0-05 | Workflow + STATUS + checklists | ✅ | `.cursor/workflow/` |
| P0-06 | CI decouple v3 → v4 | ✅ | Runner `nexsmsid-v4-ci-01` |
| P0-07 | `pnpm audit --audit-level high` hijau | ✅ | overrides di `package.json` |

**Tidak ada action tersisa di Fase 0.**

---

## Fase 1 — Dev Ready (AKTIF)

**Tujuan:** Stack lokal jalan, developer bisa login dan navigasi admin dasar.  
**Estimasi:** 1–2 hari  
**Skill:** `nexsmsid-v4-workflow`, `nexsmsid-v4`, `prisma-database-setup`  
**Checklist:** [phase-1-dev-ready.md](checklists/phase-1-dev-ready.md)

### Blok 1.1 — Environment file

| ID | Langkah | Perintah / Aksi | Expected result | Risiko |
|----|---------|-----------------|-----------------|--------|
| P1-01 | Copy template env | `cp .env.example .env` | File `.env` ada di root | — |
| P1-02 | Generate JWT access | `openssl rand -base64 64` → paste ke `JWT_ACCESS_SECRET` | Min 64 karakter | Secret lemah → auth gagal |
| P1-03 | Generate JWT refresh | `openssl rand -base64 64` → paste ke `JWT_REFRESH_SECRET` | Min 64 karakter | Sama |
| P1-04 | Verifikasi DATABASE_URL | Cek `postgresql://nexsmsid:nexsmsid@localhost:5432/nexsmsid` | Match docker-compose | Port conflict |
| P1-05 | Verifikasi REDIS_URL | Cek `redis://localhost:6379` | Match compose | — |
| P1-06 | Verifikasi WEB_ORIGIN | `http://localhost:3000` | CORS OK di dev | — |
| P1-07 | Buat storage dir | `mkdir -p storage/reports` | Path sesuai `STORAGE_PATH` | Upload gagal |

**Verifikasi blok 1.1:**
```bash
test -f .env && grep -q 'JWT_ACCESS_SECRET=.' .env && echo OK
```

### Blok 1.2 — Infrastructure lokal

| ID | Langkah | Perintah | Expected result | Risiko |
|----|---------|----------|-----------------|--------|
| P1-08 | Start postgres + redis | `docker compose up -d` | Project name `nexsmsid-v4` | Port 5432/6379 dipakai proses lain |
| P1-09 | Cek health postgres | `docker compose ps` | Status `healthy` | Container crash |
| P1-10 | Cek health redis | `docker compose ps` | Status `healthy` | — |
| P1-11 | Test koneksi DB | `docker compose exec postgres pg_isready -U nexsmsid` | `accepting connections` | — |

**Catatan:** CI memakai project terpisah `nexsmsid-v4-ci` — tidak bentrok dengan dev `nexsmsid-v4`.

**Verifikasi blok 1.2:**
```bash
docker compose ps --format '{{.Name}} {{.Status}}' | grep healthy
```

### Blok 1.3 — Database migrate & seed

| ID | Langkah | Perintah | Expected result | Risiko |
|----|---------|----------|-----------------|--------|
| P1-12 | Generate Prisma client | `pnpm --filter @nexsmsid/api prisma generate` | Client generated | — |
| P1-13 | Apply migrations | `pnpm --filter @nexsmsid/api prisma migrate dev` | 17 migration applied | Schema drift |
| P1-14 | Seed data | `pnpm --filter @nexsmsid/api prisma db seed` | Superadmin + roles + permissions | Seed error |
| P1-15 | Verifikasi seed | Query user superadmin (opsional via prisma studio) | User `superadmin@nexsmsid.dev` ada | — |

**Verifikasi blok 1.3:**
```bash
pnpm --filter @nexsmsid/api prisma migrate status
# Harus: Database schema is up to date
```

### Blok 1.4 — Dev server

| ID | Langkah | Perintah | Expected result | Risiko |
|----|---------|----------|-----------------|--------|
| P1-16 | Start dev | `pnpm dev` | Turbo menjalankan api + web | Env invalid |
| P1-17 | Cek API port | `ss -tlnp \| grep 4000` atau curl health | Port listening | Nest crash |
| P1-18 | Cek Web port | `ss -tlnp \| grep 3000` | Port listening | Next crash |
| P1-19 | Health check API | `curl -s http://localhost:4000/api/v1/health` | HTTP 200, body OK | DB/Redis down |

**Verifikasi blok 1.4:**
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health
# Harus: 200
```

### Blok 1.5 — Smoke login & dashboard

| ID | Langkah | Aksi manual / otomatis | Expected result | Risiko |
|----|---------|------------------------|-----------------|--------|
| P1-20 | Buka login page | `http://localhost:3000/login` | Form render | — |
| P1-21 | Login superadmin | Email: `superadmin@nexsmsid.dev` / Pass: `ChangeMe123!` | Redirect ke admin atau force password change | Cookie/CORS issue |
| P1-22 | Password change flow | Ikuti jika diminta | Masuk dashboard | — |
| P1-23 | Dashboard admin | `http://localhost:3000/admin` | Shell + menu tampil tanpa error kritis | Permission missing |
| P1-24 | Cek cookie auth | DevTools → httpOnly cookie ada | JWT tidak di localStorage | — |

### Exit criteria Fase 1

- [ ] P1-01 s/d P1-24 semua pass
- [ ] Update `STATUS.md`: fase → **2 — Quality**
- [ ] Update log di `STATUS.md`
- [ ] Blocker R1, R2 di REPORT → **Resolved**

### Rollback / troubleshooting Fase 1

| Masalah | Solusi |
|---------|--------|
| Port 5432/6379 busy | `ss -tlnp \| grep -E '5432\|6379'` — stop proses bentrok atau ubah port compose |
| Migration gagal | `docker compose down -v` (hati-hati: hapus data) → ulang P1-08–P1-14 |
| JWT error | Pastikan secret 64+ char, restart `pnpm dev` |
| CORS error | Pastikan `WEB_ORIGIN` dan `CORS_ORIGIN` = `http://localhost:3000` |
| API tidak start | Cek `DATABASE_URL`, redis, log Nest di terminal |

---

## Fase 2 — Quality & Coverage

**Tujuan:** Validasi alur bisnis end-to-end + maintenance CI.  
**Estimasi:** 2–3 hari  
**Prasyarat:** Fase 1 ✅  
**Skill:** `nexsmsid-v4`, `nexsmsid-v4-workflow`  
**Checklist:** [phase-2-quality.md](checklists/phase-2-quality.md)

### Blok 2.1 — Smoke test domain (urutan disarankan)

Setiap smoke test = **D→P→I→V→R** ringkas (discover URL, plan alur, execute manual, verify hasil, report).

#### 2.1.1 Master Data — Departments

| ID | Langkah | URL | Alur uji | Pass criteria |
|----|---------|-----|----------|---------------|
| P2-01 | List | `/admin/master-data/departments` | Buka halaman | Tabel/data load |
| P2-02 | Create | Form tambah | Buat 1 department test | Record muncul di list |
| P2-03 | Update | Edit record | Ubah nama | Perubahan tersimpan |
| P2-04 | Delete | Soft delete | Hapus record test | Hilang dari list aktif |

**Akun:** superadmin (sudah login dari Fase 1)

#### 2.1.2 People — Students

| ID | Langkah | URL | Alur uji | Pass criteria |
|----|---------|-----|----------|---------------|
| P2-05 | List | `/admin/students` | Buka halaman | List siswa load |
| P2-06 | Create | Form tambah siswa | Buat 1 siswa test | Muncul di list |
| P2-07 | Detail | Klik record | View detail | Data konsisten |

#### 2.1.3 Academic — Schedules

| ID | Langkah | URL | Alur uji | Pass criteria |
|----|---------|-----|----------|---------------|
| P2-08 | View | `/admin/academic/schedules` | Buka jadwal | Halaman render, data/tabel OK |

#### 2.1.4 Finance — Invoices

| ID | Langkah | URL | Alur uji | Pass criteria |
|----|---------|-----|----------|---------------|
| P2-09 | List | `/admin/finance/invoices` | Buka tagihan | List load tanpa error |

#### 2.1.5 PPDB

| ID | Langkah | URL | Alur uji | Pass criteria |
|----|---------|-----|----------|---------------|
| P2-10 | Public register | `/ppdb/register` | Form pendaftaran publik | Form render (Turnstile dev OK) |
| P2-11 | Submit test | Form PPDB | Submit data dummy | Response sukses / validasi jelas |
| P2-12 | Admin verify | `/admin/ppdb` | Verifikasi pendaftaran | Admin bisa lihat & proses |

#### 2.1.6 Portal multi-role

| ID | Portal | URL | Akun seed | Pass criteria |
|----|--------|-----|-----------|---------------|
| P2-13 | Teacher | `/teacher` | Akun guru dari seed | Login + dashboard guru |
| P2-14 | Student | `/student` | Akun siswa dari seed | Login + dashboard siswa |
| P2-15 | Guardian | `/guardian` | Akun wali dari seed | Login + dashboard wali |

**Catatan:** Cek seed di `apps/api/prisma/seed*` untuk kredensial portal non-admin.

### Blok 2.2 — Dokumentasi hasil smoke test

| ID | Task | Output |
|----|------|--------|
| P2-16 | Tulis hasil per domain | `.cursor/audit/SMOKE-TEST-YYYY-MM-DD.md` |
| P2-17 | Catat bug blocker | Issue list di smoke doc + `STATUS.md` |
| P2-18 | Fix bug blocker (jika ada) | Ikuti D→P→I→V→R per bug |

**Format smoke doc per domain:**
```markdown
## [Domain]
- Status: PASS / FAIL / BLOCKED
- Tester: [nama]
- Tanggal: YYYY-MM-DD
- Langkah: ...
- Temuan: ...
- Screenshot/log: (opsional)
```

### Blok 2.3 — CI maintenance (paralel, bisa hari yang sama)

| ID | Task | File | Detail | Verify |
|----|------|------|--------|--------|
| P2-19 | Upgrade checkout | `.github/workflows/ci.yml` | `actions/checkout@v4` → latest | CI hijau |
| P2-20 | Upgrade setup-node | `.github/workflows/ci.yml` | Node 24-ready | No deprecation warn |
| P2-21 | Upgrade pnpm action | `.github/workflows/ci.yml` | `pnpm/action-setup@v4` latest | CI hijau |
| P2-22 | Test di branch | `chore/ci-node24` | Push, buat PR | `gh run list` success |

**Skill:** `github-actions`

**Quality gate setelah perubahan CI:**
```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
gh run list --repo arpayid/nexsmsid-v4 --limit 3
```

### Blok 2.4 — Dependency review

| ID | Task | Perintah | Pass criteria |
|----|------|----------|---------------|
| P2-23 | Audit high | `pnpm audit --audit-level high` | 0 high/critical |
| P2-24 | Review moderate | `pnpm audit` | Patch jika tersedia tanpa breaking |
| P2-25 | Update overrides | `package.json` pnpm.overrides | CI audit step pass |

### Exit criteria Fase 2

- [ ] Minimal 5 domain smoke PASS (P2-01–P2-12)
- [ ] Portal smoke P2-13–P2-15 (ideal, bukan blocker fase jika seed tidak ada)
- [ ] Smoke doc ditulis (P2-16)
- [ ] Tidak ada bug blocker terbuka
- [ ] CI upgrade selesai atau dijadwalkan dengan PR merged
- [ ] Update `STATUS.md` → **Fase 3**

---

## Fase 3 — Hardening

**Tujuan:** Production readiness — Docker, security, cleanup.  
**Estimasi:** 2–3 hari  
**Prasyarat:** Fase 2 ✅  
**Skill:** `docker-expert`, `docker-compose-audit`, `auditing-security`, `nexsmsid-v4`  
**Checklist:** [phase-3-hardening.md](checklists/phase-3-hardening.md)

### Blok 3.1 — Docker HEALTHCHECK

| ID | Task | File | Implementasi | Verify |
|----|------|------|--------------|--------|
| P3-01 | HEALTHCHECK API | `Dockerfile.api` | `curl -f http://localhost:4000/api/v1/health` atau setara | `docker inspect` shows healthy |
| P3-02 | HEALTHCHECK Web | `Dockerfile.web` | HTTP check ke port 3000 | Same |
| P3-03 | Build test lokal | — | `pnpm docker:prod:build` | Build sukses |
| P3-04 | Align dengan compose | `docker-compose.prod.yml` | Healthcheck instruction konsisten | Prod compose healthy |

**Referensi:** prod compose sudah punya healthcheck — Dockerfile harus match.

### Blok 3.2 — Security audit terarah

Gunakan skill `auditing-security` + checklist manual:

| ID | Area | File / scope | Cek spesifik | Severity jika gagal |
|----|------|--------------|--------------|---------------------|
| P3-05 | PPDB upload | `apps/api/src/public-ppdb/` | MIME whitelist, max size, path sandbox | High |
| P3-06 | Permission guard | Semua controller protected | Tiap handler punya `@RequirePermissions` | Critical |
| P3-07 | Portal middleware | `apps/web/src/middleware.ts` | Cross-portal access blocked | High |
| P3-08 | Secrets | Repo scan | Tidak ada `.env` committed | Critical |
| P3-09 | Prod env validation | `apps/api/src/config/env.validation.ts` | Turnstile + JWT 64 char enforced | High |
| P3-10 | Error exposure | API exception filter | No stack trace di prod response | Medium |

**Output:** `.cursor/audit/SECURITY-REVIEW-YYYY-MM-DD.md`

### Blok 3.3 — Docker audit script

| ID | Task | Perintah | Pass criteria |
|----|------|----------|---------------|
| P3-11 | Run docker audit | `.cursor/skills/fullstack-project-audit/scripts/docker-audit.sh .` | 0 FAIL |
| P3-12 | Fix FAIL items | Sesuai output script | Re-run → 0 FAIL |
| P3-13 | Document WARN | Catat di security review | Accepted atau fixed |

### Blok 3.4 — Cleanup technical debt

| ID | Task | File | Detail |
|----|------|------|--------|
| P3-14 | Hapus deprecated auth | `apps/web/src/lib/auth-storage.ts` | Hapus jika tidak direferensikan |
| P3-15 | Staging healthcheck | `scripts/staging-healthcheck.sh` | Jalankan setelah prod compose lokal |
| P3-16 | Verifikasi .dockerignore | `.dockerignore` | `.env` excluded |

**Quality gate Fase 3 (setelah code change):**
```bash
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @nexsmsid/api test && pnpm build
pnpm validate:integration
pnpm audit --audit-level high
```

### Exit criteria Fase 3

- [ ] P3-01, P3-02 HEALTHCHECK ada
- [ ] P3-11 docker audit 0 FAIL
- [ ] Security review tanpa finding Critical
- [ ] Staging healthcheck pass di prod compose lokal
- [ ] Update `STATUS.md` → **Fase 4**

---

## Fase 4 — Production Pilot

**Tujuan:** Deploy stack production di environment staging/pilot.  
**Estimasi:** 2–3 hari  
**Prasyarat:** Fase 3 ✅  
**Skill:** `docker-expert`, `docker-patterns`, `nexsmsid-v4-workflow`  
**Checklist:** [phase-4-production.md](checklists/phase-4-production.md)

### Blok 4.1 — Production environment

| ID | Variable / config | Requirement | Verify |
|----|-------------------|-------------|--------|
| P4-01 | `NODE_ENV` | `production` | — |
| P4-02 | `JWT_ACCESS_SECRET` | 64+ char, unik dari dev | — |
| P4-03 | `JWT_REFRESH_SECRET` | 64+ char, unik dari dev | — |
| P4-04 | `WEB_ORIGIN` | Domain HTTPS nyata, bukan localhost | env.validation pass |
| P4-05 | `TURNSTILE_SECRET_KEY` | Production key Cloudflare | Wajib di prod |
| P4-06 | `DATABASE_URL` | Prod postgres credentials | Koneksi OK |
| P4-07 | `REDIS_URL` | Prod redis | Koneksi OK |

**Peringatan:** Jangan commit file `.env` production.

### Blok 4.2 — Deploy sequence

| ID | Langkah | Perintah | Expected | Rollback |
|----|---------|----------|----------|----------|
| P4-08 | Build images | `pnpm docker:prod:build` | Images built | — |
| P4-09 | Start stack | `pnpm docker:prod:up` | 5 services healthy | `pnpm docker:prod:down` |
| P4-10 | Migrate prod | `pnpm db:migrate:prod` | Schema up to date | Restore backup |
| P4-11 | Seed (first only) | `pnpm db:seed:prod` | Initial data | — |
| P4-12 | Health check | `pnpm health` | All checks pass | Debug per service |

**Services prod:** postgres, redis, api, web, nginx (lihat `docker-compose.prod.yml`)

### Blok 4.3 — HTTPS & domain

| ID | Task | Detail |
|----|------|--------|
| P4-13 | Konfigurasi nginx | SSL cert, proxy ke api/web |
| P4-14 | DNS | Domain mengarah ke server |
| P4-15 | Smoke prod login | Login flow via HTTPS |
| P4-16 | CORS prod | `WEB_ORIGIN` match domain |

### Blok 4.4 — Operasional

| ID | Task | Perintah | Pass criteria |
|----|------|----------|---------------|
| P4-17 | Backup | `pnpm backup` | File backup terbuat |
| P4-18 | Restore dry-run | `pnpm restore` (staging) | DB restored di env test |
| P4-19 | Monitor logs | `docker compose -f docker-compose.prod.yml logs` | No critical errors |
| P4-20 | Dokumentasi runbook | `.cursor/audit/PROD-RUNBOOK.md` | Prosedur operasional |

### Exit criteria Fase 4

- [ ] Stack prod healthy (P4-08–P4-12)
- [ ] HTTPS + login OK (P4-13–P4-16)
- [ ] Backup/restore teruji (P4-17–P4-18)
- [ ] Runbook ditulis (P4-20)
- [ ] Update `STATUS.md` → **Prod Ready**
- [ ] Risk register: semua High → Resolved

---

## Fase 5+ — Pengembangan fitur (ongoing)

Setelah Fase 1 selesai, setiap fitur baru mengikuti template ini:

### Template task fitur

```markdown
## Task: [Nama fitur]
**ID:** FEAT-XXX
**Fase project:** 2+ (development ongoing)
**Domain:** [identity / academic / finance / ...]

### D — Discover
- Modul: apps/api/src/...
- Web: apps/web/src/app/admin/...
- Permission existing: ...
- Skill: nexsmsid-v4 + [sub-skill]

### P — Plan
| Layer | File | Perubahan |
|-------|------|-----------|
| Prisma | schema.prisma | ... |
| API | *.service.ts | ... |
| Web | page.tsx | ... |
| api-client | domains/*.ts | ... |

### I — Implement
- [ ] ...

### V — Verify
Tier: [API only / Web only / Full]
- [ ] format:check, lint, typecheck, test, build, integration

### R — Report
- Ringkasan ke user
- Update STATUS.md task table
```

### Routing skill per jenis fitur

| Jenis fitur | Skill utama | Quality tier |
|-------------|-------------|--------------|
| CRUD master data | nexsmsid-v4 | Full |
| Endpoint API baru | nexsmsid-v4 + nestjs-best-practices | Full |
| Halaman admin | nexsmsid-v4 + nextjs-app-router-patterns | Web + build |
| Schema DB | prisma-database-setup | Full + integration |
| Laporan BullMQ | nexsmsid-v4 | Full + Redis |
| PPDB publik | nexsmsid-v4 + auditing-security | Full + security review |

---

## Git & CI — Prosedur perubahan kode

### Workflow branch

```
main
 └── feat/nama-fitur     # fitur baru
 └── fix/nama-bug        # bug fix
 └── chore/nama-task     # CI, deps, refactor
 └── cursor/nama-task    # agent-generated
```

### Prosedur PR (hanya saat user minta)

| Step | Aksi | Perintah |
|------|------|----------|
| 1 | Buat branch | `git checkout -b feat/nama` |
| 2 | Stage changes | `git add <files>` |
| 3 | Commit | HEREDOC message |
| 4 | Push | `git push -u origin HEAD` |
| 5 | Create PR | `gh pr create` |
| 6 | Tunggu CI | `gh run watch` |
| 7 | Merge | Setelah CI hijau + user approve |

**CI environment:** runner `nexsmsid-v4`, services via `scripts/ci-services.sh`, compose `nexsmsid-v4-ci`.

---

## Risk register & mitigasi

| ID | Risk | Fase | Mitigasi | Owner |
|----|------|------|----------|-------|
| R1 | `.env` tidak ada | 1 | Blok P1-01–P1-07 | Agent |
| R2 | Dev server belum smoke | 1–2 | Blok P1-16–P1-24, P2-* | Agent + User |
| R3 | Dockerfile tanpa HEALTHCHECK | 3 | P3-01, P3-02 | Agent |
| R4 | PPDB upload security | 3 | P3-05 audit | Agent |
| R5 | Node 20 deprecation CI | 2 | P2-19–P2-22 | Agent |
| R6 | Prod deploy tanpa backup | 4 | P4-17 wajib sebelum go-live | User |

---

## Timeline & milestone

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| M0 — Workflow ready | 2026-06-15 ✅ | WORKFLOW, PLAN, skills |
| M1 — Dev Ready | 2026-06-17 | `.env`, dev running, login OK |
| M2 — Quality pass | 2026-06-20 | Smoke doc, CI upgraded |
| M3 — Hardened | 2026-06-22 | Docker audit 0 FAIL, security review |
| M4 — Prod pilot | 2026-06-25 | Prod stack, backup, runbook |

---

## Lampiran — Perintah cepat

```bash
# Status project
cat .cursor/workflow/STATUS.md

# Fase 1 bootstrap
cp .env.example .env && docker compose up -d
pnpm --filter @nexsmsid/api prisma migrate dev
pnpm --filter @nexsmsid/api prisma db seed
pnpm dev

# Quality gate penuh
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @nexsmsid/api test && pnpm build
pnpm validate:integration && pnpm audit --audit-level high

# CI status
gh run list --repo arpayid/nexsmsid-v4 --branch main --limit 5

# Docker audit
.cursor/skills/fullstack-project-audit/scripts/docker-audit.sh .
```

---

## Dokumen terkait

| Dokumen | Path |
|---------|------|
| Workflow utama | [WORKFLOW.md](WORKFLOW.md) |
| Status terkini | [STATUS.md](STATUS.md) |
| Checklists per fase | [checklists/](checklists/) |
| Audit roadmap | [../audit/ROADMAP.md](../audit/ROADMAP.md) |
| Skill workflow | [../skills/nexsmsid-v4-workflow/SKILL.md](../skills/nexsmsid-v4-workflow/SKILL.md) |
| Skill develop | [../skills/nexsmsid-v4/SKILL.md](../skills/nexsmsid-v4/SKILL.md) |
