# Checklist — Fase 0: Inisialisasi

**Tujuan:** Project siap dikerjakan dengan skill, workflow, dan baseline audit.

## Skill & tooling

- [x] Skill lokal: `nexsmsid-v4`, `nexsmsid-v4-master`, audit skills
- [x] Skill eksternal via skills.sh (NestJS, Next.js, Prisma, Turbo, Docker, Vitest, GHA)
- [x] `SKILLS-INDEX.md` manifest
- [x] Workflow skill + dokumen (`WORKFLOW.md`, `STATUS.md`)

## Infrastructure baseline

- [x] CI runner `nexsmsid-v4-ci-01` label `nexsmsid-v4`
- [x] Docker compose project `nexsmsid-v4` / `nexsmsid-v4-ci`
- [x] Referensi v3 dihapus dari repo
- [x] `pnpm audit --audit-level high` hijau di CI

## Audit baseline

- [x] `.cursor/audit/REPORT-2026-06-15.md`
- [x] `.cursor/audit/ROADMAP.md`

## Exit

Semua ✅ di atas → lanjut **Fase 1 — Dev Ready**.
