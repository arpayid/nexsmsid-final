---
name: nexsmsid-ui-enterprise
description: UI Enterprise 2026 rollout for NexSMSID V4 — audit, plan, execute, validate, PR, merge workflow for entire web UI. Use when redesigning admin/portal UI, design system, shells, dashboard, or any visual consistency work.
compatibility: Requires .cursor/workflow/UI-ENTERPRISE-2026.md and STATUS.md UI section
---

# NexSMSID UI Enterprise 2026

**Tujuan:** Seluruh UI terlihat seperti SaaS enterprise 2026.  
**Referensi:** design-in-code (UI Enterprise S1–S20 selesai).

## Sebelum mulai

1. Baca `.cursor/workflow/STATUS.md` — sprint UI aktif
2. Baca `.cursor/workflow/UI-PLAN.md` — scope sprint
3. Baca `.cursor/audit/ROADMAP.md` jika perlu konteks risiko/hardening

## Siklus wajib (A→P→E→V→PR→M)

| Langkah | Aksi |
|---------|------|
| **A Audit** | Gap + file list → update audit/plan jika perlu |
| **P Plan** | Acceptance criteria + tier verify |
| **E Eksekusi** | Branch `feat/ui-sN-*`, minimal diff |
| **V Validasi** | `format:check` + `lint` + `typecheck` + `build` + smoke |
| **PR** | `gh pr create` dengan test plan |
| **M Merge** | Hanya jika CI hijau; update STATUS |

Checklist lengkap: `.cursor/workflow/checklists/ui-enterprise-cycle.md`

## Sprint order (jangan loncat)

```
UI-S1 design system → UI-S2 shell → UI-S3 dashboard → UI-S4 auth
→ UI-S5 admin patterns → UI-S6 portals → UI-S7 polish
```

## Tier verify (UI-only)

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
```

## Design tokens (mockup)

- Primary: `#10B981` · Teal: `#14B8A6` · Indigo: `#6366F1`
- Amber: `#F59E0B` · Coral: `#EF4444` · Slate: `#64748B`

## Git

- Satu PR per sprint
- Merge setelah CI pass
- Deploy prod: `pnpm docker:prod:build && pnpm docker:prod:up` (jika user minta)

## Konvensi kode

- Komponen shared: `packages/ui`
- Layout admin: `admin-shell.tsx`, dashboard: `components/dashboard/*`
- Bahasa UI admin: Indonesia
- Reuse PageHeader, SearchFilterBar, DataTable — jangan style one-off

## Dokumen

- Workflow: `.cursor/workflow/UI-ENTERPRISE-2026.md`
- Plan: `.cursor/workflow/UI-PLAN.md`
- Roadmap: `.cursor/audit/ROADMAP.md`
