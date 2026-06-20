# Project Status — NexSMSID V4

Terakhir diperbarui: **2026-06-18**

## Fase aktif

| Field               | Nilai                                                         |
| ------------------- | ------------------------------------------------------------- |
| **Fase saat ini**   | **4 — Production Pilot** (hampir selesai)                     |
| **Program paralel** | **UI Enterprise 2026** ✅ **100% admin mockup**               |
| **Blocker utama**   | HTTPS domain belum dikonfigurasi (opsional untuk pilot lokal) |
| **CI main**         | ✅ Hijau                                                      |
| **Dev stack**       | ✅ native `next dev` :3000 + API :4000 **atau** `pnpm dev`    |
| **Prod stack**      | ✅ `nexsmsid-final-prod` healthy via nginx :80                   |
| **Runner**          | ✅ `nexsmsid-final-ci-01` online                                 |

---

## UI Enterprise 2026 (program aktif)

**Workflow:** [UI-ENTERPRISE-2026.md](UI-ENTERPRISE-2026.md) · **Plan:** [UI-PLAN.md](UI-PLAN.md) · **Roadmap:** [../audit/ROADMAP.md](../audit/ROADMAP.md)

**Siklus per sprint:** Plan → Desain → Build → Review → PR → **Merge jika CI hijau**

| Sprint | Area                                    | Status | PR  |
| ------ | --------------------------------------- | ------ | --- |
| UI-S0  | Audit + workflow docs                   | ✅     | —   |
| UI-S1  | Design system (`@nexsmsid/ui` + tokens) | ✅     | #11 |
| UI-S2  | Admin shell                             | ✅     | #12 |
| UI-S3  | Admin dashboard (mockup penuh)          | ✅     | #13 |
| UI-S4  | Auth pages                              | ✅     | #14 |
| UI-S5  | Admin CRUD patterns                     | ✅     | #15 |
| UI-S6  | Portal shells                           | ✅     | #16 |
| UI-S7  | Dark mode + a11y QA                     | ✅     | #17 |
| UI-S8  | Portal polish + prod smoke              | ✅     | #26 |
| UI-S9  | Dashboard mockup parity                 | ✅     | #27 |
| UI-S10 | Shell mockup parity                     | ✅     | #28 |
| UI-S11 | People module enterprise                | ✅     | #29 |
| UI-S12 | Reports ModuleReportHub                 | ✅     | #30 |
| UI-S13 | Exams subdomain polish                  | ✅     | #32 |
| UI-S14 | HR + Payroll polish                     | ✅     | #33 |
| UI-S15 | ResourceCrudPage batch 3                | ✅     | #34 |
| UI-S16 | Users + roles polish                    | ✅     | #35 |
| UI-S17 | Portal notifications 100%               | ✅     | #31 |
| UI-S18 | Auth & account polish                   | ✅     | #36 |
| UI-S19 | Public brand enterprise                 | ✅     | #38 |
| UI-S20 | QA sign-off 100%                        | ✅     | #37 |

**Referensi visual:** design-in-code (UI Enterprise S1–S20 ✅ — mockup PNG dihapus dari repo)

---

## Siklus kerja (wajib setiap task)

Setiap perubahan kode mengikuti **D→P→I→V→R** — lihat [WORKFLOW.md](WORKFLOW.md).

**Task UI:** gunakan **Plan → Desain → Build → Review → PR → Merge** via skill `nexsmsid-ui-enterprise`.

| Langkah        | Ringkas                                       |
| -------------- | --------------------------------------------- |
| **Plan**       | Scope + acceptance criteria + file list       |
| **Desain**     | Pola visual/komponen (mockup, tokens, layout) |
| **Build**      | Branch `feat/ui-sN-*`, minimal diff           |
| **Review**     | Quality gate mirror CI                        |
| **PR → Merge** | `gh pr create`; merge **hanya** CI hijau      |

### Tier verify (Web UI)

`format:check` + `lint` + `typecheck` + `build`

### Dev vs Docker

| Tujuan           | Stack                     | URL         |
| ---------------- | ------------------------- | ----------- |
| Preview UI       | `pnpm dev` / native       | `:3000`     |
| Production pilot | `docker-compose.prod.yml` | nginx `:80` |

---

## Fase project (infra)

### Fase 0–3 ✅ · Fase 4 (AKTIF)

- [x] Prod stack + health + backup
- [ ] HTTPS domain (saat deploy domain nyata)

## Merged PRs (UI terkait)

| PR  | Judul                                            |
| --- | ------------------------------------------------ |
| #8  | enterprise SaaS premium theme                    |
| #9  | admin dashboard bento layout                     |
| #10 | dashboard refactor S1–S5                         |
| #11 | UI-S1 design system                              |
| #12 | UI-S2 admin shell                                |
| #13 | UI-S3 admin dashboard                            |
| #14 | UI-S4 auth pages                                 |
| #15 | UI-S5 admin CRUD patterns                        |
| #16 | UI-S6 portal shells                              |
| #17 | UI-S7 dark mode + a11y                           |
| #26 | UI-S8 portal polish + prod smoke + HTTPS scripts |
| #27 | UI-S9 dashboard mockup parity                    |
| #28 | UI-S10 admin shell mockup parity                 |
| #29 | UI-S11 people module enterprise                  |
| #30 | UI-S12 ModuleReportHub enterprise                |
| #31 | UI-S17 portal notifications 100%                 |
| #32 | UI-S13 exams subdomain polish                    |
| #33 | UI-S14 HR + payroll enterprise                   |
| #34 | UI-S15 ResourceCrudPage batch 3                  |
| #35 | UI-S16 users & roles polish                      |
| #36 | UI-S18 auth & account polish                     |
| #37 | UI-S20 enterprise sign-off                       |
| #38 | UI-S19 public site brand                         |
| #39 | PPDB portal auto-provision + RBAC migration      |
| #40 | multer >=2.2.0 CI audit gate                     |

## Backlog lokal

| Task                | Next step                                           |
| ------------------- | --------------------------------------------------- |
| UI Enterprise 2026  | ✅ **100%** (S1–S20); prod rebuild post-S19 ✅      |
| Fase 4 go-live      | HTTPS domain nyata + certbot (saat DNS siap)        |
| Rebuild prod Docker | ✅ Sync image post-#39/#40 (2026-06-18)             |
| QA manual browser   | ✅ Dark mode, mobile nav, skip link (P2 2026-06-18) |

## Log singkat

| Tanggal    | Event                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| 2026-06-16 | Program UI Enterprise 2026 + workflow A→P→E→V→PR→M documented                  |
| 2026-06-17 | UI-S8 merged (#26); prod rebuild + `pnpm prod:smoke` 17/17; HTTPS staging OK   |
| 2026-06-17 | Sesi workflow Plan→Desain→Build→Review→PR→Merge: S13–S18 merged (#32–#36)      |
| 2026-06-17 | UI-S20 sign-off: audit 10/10, `prod:smoke` 17/17, program admin mockup 100% ✅ |
| 2026-06-17 | UI-S19 public brand (#38); prod rebuild + smoke 17/17 post-merge               |
| 2026-06-18 | Audit penuh: quality gates ✅, prod smoke 17/17, docker 14/14 PASS             |
| 2026-06-18 | PPDB portal provision (#39) + multer fix (#40) merged; permission OK prod      |
| 2026-06-18 | P1 prod sync: rebuild Docker, migrate via API container, smoke 17/17           |
| 2026-06-18 | P2 browser QA: dark mode, mobile nav, skip link; AuthPageShell a11y            |
