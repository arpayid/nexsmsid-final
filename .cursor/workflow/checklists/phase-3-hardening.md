# Checklist — Fase 3: Hardening

**Tujuan:** Production readiness sebelum deploy pilot.

## Docker

- [ ] `HEALTHCHECK` di `Dockerfile.api`
- [ ] `HEALTHCHECK` di `Dockerfile.web`
- [ ] `.cursor/skills/fullstack-project-audit/scripts/docker-audit.sh .` → 0 FAIL

## Security

Gunakan skill `auditing-security` + review manual:

- [ ] `apps/api/src/public-ppdb/` — MIME, size limit, path sandbox
- [ ] `apps/api/src/auth/guards/permission.guard.ts` — semua endpoint protected punya permission
- [ ] `apps/web/src/middleware.ts` — portal isolation
- [ ] `.env` tidak ter-commit, `.gitignore` OK
- [ ] `pnpm audit --audit-level high` hijau

## Cleanup

- [ ] Hapus deprecated `apps/web/src/lib/auth-storage.ts` (jika masih ada)
- [ ] `scripts/staging-healthcheck.sh` lulus setelah prod compose lokal

## Exit

Docker audit clean, security review tanpa critical → **Fase 4**.
