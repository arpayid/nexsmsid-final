---
name: nexsmsid-final-workflow
description: Defines NexSMSID V4 project workflow — phases 0-4, D→P→I→V→R task cycle, quality gate, git/CI rules, and STATUS tracking. Use before starting any project work, at session start, when planning tasks, or checking which phase to execute next.
compatibility: Requires .cursor/workflow/STATUS.md and WORKFLOW.md
---

# NexSMSID V4 — Workflow

**Wajib dibaca sebelum pengerjaan project.** Orchestrator: `nexsmsid-final-master` · Konvensi kode: `nexsmsid-final`.

## Langkah pertama setiap sesi

1. Baca `.cursor/workflow/STATUS.md` — fase aktif & blocker
2. Baca checklist fase aktif di `.cursor/workflow/checklists/`
3. Jangan mulai fitur baru jika Fase 1 belum selesai (kecuali user override)

## Fase project

| Fase  | Nama                 | Checklist                                      |
| ----- | -------------------- | ---------------------------------------------- |
| 0     | Inisialisasi         | `checklists/phase-0-init.md` ✅                |
| 1     | Dev Ready            | `checklists/phase-1-dev-ready.md` ✅           |
| 2     | Quality              | `checklists/phase-2-quality.md` ✅             |
| 3     | Hardening            | `checklists/phase-3-hardening.md` ✅           |
| **4** | **Production Pilot** | `checklists/phase-4-production.md` ← **AKTIF** |

**Blocker saat ini:** HTTPS domain (opsional untuk pilot lokal) — lihat `STATUS.md`.

**Program UI Enterprise 2026** (paralel): lihat `.cursor/workflow/UI-ENTERPRISE-2026.md` · sprint aktif di `UI-PLAN.md`.

## Siklus UI — A→P→E→V→PR→M

Task visual seluruh project web:

```
Audit → Plan → Eksekusi → Validasi → PR → Merge (hanya jika CI hijau)
```

Skill: `nexsmsid-ui-enterprise` · Checklist: `checklists/ui-enterprise-cycle.md`

## Siklus per task — D→P→I→V→R

Setiap task (termasuk fitur Fase 5+) **wajib** mengikuti:

```
Discover → Plan → Implement → Verify → Report
```

Detail: `.cursor/workflow/checklists/task-cycle.md`

### Discover

- Route skill via `nexsmsid-final-master`
- Cek `nexsmsid-final/modules.md` untuk domain terkait
- Scope harus jelas sebelum edit file

### Plan

- Minimal file list
- Cek: migration, permission, api-client, web page
- Task besar: plan ke user dulu

### Implement

- Ikuti `nexsmsid-final` skill — BaseMasterDataService, `@RequirePermissions`, `apiSuccess()`
- Minimal diff

### Verify (quality gate = CI mirror)

```bash
pnpm format:check && pnpm lint && pnpm typecheck
pnpm --filter @nexsmsid/api test
pnpm build
pnpm validate:integration    # jika sentuh API/DB
pnpm audit --audit-level high
```

Tier minimum per scope — lihat `.cursor/workflow/WORKFLOW.md`.

### Report

- Ringkas ke user
- Update `STATUS.md` jika fase/blocker/backlog berubah
- **Commit/PR hanya jika user minta eksplisit**

## Dev vs Docker

| Tujuan           | Perintah                                        | URL         |
| ---------------- | ----------------------------------------------- | ----------- |
| Preview UI       | `pnpm dev` atau `next dev -p 3000`              | `:3000`     |
| Production pilot | `pnpm docker:prod:build && pnpm docker:prod:up` | nginx `:80` |

Setelah merge PR web: rebuild prod images agar pilot dapat UI terbaru.

## Git & CI

| Aturan          | Nilai                                               |
| --------------- | --------------------------------------------------- |
| Base            | `main`                                              |
| Branch          | `feat/`, `fix/`, `chore/`, `cursor/`                |
| CI              | Self-hosted `nexsmsid-final`, compose `nexsmsid-final-ci` |
| Force push main | Dilarang                                            |

## Bootstrap Fase 1 (jalankan jika diminta)

```bash
cp .env.example .env
docker compose up -d
pnpm --filter @nexsmsid/api prisma migrate dev
pnpm --filter @nexsmsid/api prisma db seed
pnpm dev
```

Verifikasi: health 200, login superadmin, `/admin` OK.

## Kapan update STATUS.md

- Fase berubah (semua exit criteria ✅)
- Blocker baru / resolved
- Task aktif dimulai / selesai

## Referensi

- Rencana rinci: [PLAN.md](../../workflow/PLAN.md)
- Diagram & detail: [WORKFLOW.md](../../workflow/WORKFLOW.md)
- Status: [STATUS.md](../../workflow/STATUS.md)
- Roadmap audit: [ROADMAP.md](../../audit/ROADMAP.md)
