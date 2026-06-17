# Project Status — NexSMSID V4

Terakhir diperbarui: **2026-06-16**

## Fase aktif

| Field | Nilai |
|-------|-------|
| **Fase saat ini** | **4 — Production Pilot** (hampir selesai) |
| **Program paralel** | **UI Enterprise 2026** ← aktif |
| **Blocker utama** | HTTPS domain belum dikonfigurasi (opsional untuk pilot lokal) |
| **CI main** | ✅ Hijau |
| **Dev stack** | ✅ native `next dev` :3000 + API :4000 **atau** `pnpm dev` |
| **Prod stack** | ✅ `nexsmsid-v4-prod` healthy via nginx :80 |
| **Runner** | ✅ `nexsmsid-v4-ci-01` online |

---

## UI Enterprise 2026 (program aktif)

**Workflow:** [UI-ENTERPRISE-2026.md](UI-ENTERPRISE-2026.md) · **Plan:** [UI-PLAN.md](UI-PLAN.md) · **Audit:** [../audit/UI-AUDIT-2026-06-16.md](../audit/UI-AUDIT-2026-06-16.md)

**Siklus per sprint:** Audit → Plan → Eksekusi → Validasi → PR → **Merge jika CI hijau**

| Sprint | Area | Status | PR |
|--------|------|--------|-----|
| UI-S0 | Audit + workflow docs | ✅ | — |
| UI-S1 | Design system (`@nexsmsid/ui` + tokens) | ✅ | #11 |
| UI-S2 | Admin shell | ✅ | #12 |
| UI-S3 | Admin dashboard (mockup penuh) | ✅ | #13 |
| UI-S4 | Auth pages | ✅ | #14 |
| UI-S5 | Admin CRUD patterns | ✅ | #15 |
| UI-S6 | Portal shells | ✅ | #16 |
| UI-S7 | Dark mode + a11y QA | ✅ | #17 |

**Referensi visual:** `bug/UI refaktor.png`

---

## Siklus kerja (wajib setiap task)

Setiap perubahan kode mengikuti **D→P→I→V→R** — lihat [WORKFLOW.md](WORKFLOW.md).

**Task UI:** gunakan **A→P→E→V→PR→M** via skill `nexsmsid-ui-enterprise`.

| Langkah | Ringkas |
|---------|---------|
| **D / A** | Scope jelas, audit gap |
| **P** | Acceptance criteria + file list |
| **I / E** | Implement minimal diff |
| **V** | Quality gate mirror CI |
| **R / PR→M** | PR; merge **hanya** CI hijau |

### Tier verify (Web UI)

`format:check` + `lint` + `typecheck` + `build`

### Dev vs Docker

| Tujuan | Stack | URL |
|--------|-------|-----|
| Preview UI | `pnpm dev` / native | `:3000` |
| Production pilot | `docker-compose.prod.yml` | nginx `:80` |

---

## Fase project (infra)

### Fase 0–3 ✅ · Fase 4 (AKTIF)

- [x] Prod stack + health + backup
- [ ] HTTPS domain (saat deploy domain nyata)

## Merged PRs (UI terkait)

| PR | Judul |
|----|-------|
| #8 | enterprise SaaS premium theme |
| #9 | admin dashboard bento layout |
| #10 | dashboard refactor S1–S5 |
| #11 | UI-S1 design system |
| #12 | UI-S2 admin shell |
| #13 | UI-S3 admin dashboard |
| #14 | UI-S4 auth pages |
| #15 | UI-S5 admin CRUD patterns |
| #16 | UI-S6 portal shells |
| #17 | UI-S7 dark mode + a11y |

## Backlog lokal

| Task | Next step |
|------|-----------|
| UI Enterprise 2026 | ✅ S1–S7 + rollout admin (#18–#24); smoke prod ✅ otomatis |
| ResourceCrudPage batch 2 | ✅ library categories/shelves, hr/positions, payroll/components (PR UI-5p) |
| Fase 4 go-live | HTTPS domain + `validate:prod-env` + backup dry-run |

## Log singkat

| Tanggal | Event |
|---------|-------|
| 2026-06-16 | Program UI Enterprise 2026 + workflow A→P→E→V→PR→M documented |
| 2026-06-17 | UI-5 rollout selesai (#18–#24); smoke prod QA otomatis lulus |
