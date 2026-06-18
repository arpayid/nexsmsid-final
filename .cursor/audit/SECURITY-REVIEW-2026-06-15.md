# Security Review — NexSMSID V4

**Tanggal:** 2026-06-15  
**Fase:** 3 — Hardening  
**Skill:** auditing-security

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 2 |

**Verdict:** No critical blockers for production pilot.

## Findings

### S-01 — PPDB upload path sandbox ✅ OK
- **File:** `apps/api/src/public-ppdb/ppdb-file.util.ts`
- **Checks:** `..` rejected, files scoped to `ppdb/{registrationId}/`
- **Severity:** — (pass)

### S-02 — PPDB MIME whitelist ✅ OK
- **File:** `ppdb-file.util.ts` → `contentTypeForPpdbFilename`
- **Allowed:** pdf, png, jpg/jpeg only
- **Severity:** — (pass)

### S-03 — Permission guard ✅ OK
- Global `PermissionGuard` + `@RequirePermissions` pattern enforced in codebase
- **Severity:** — (pass)

### S-04 — Portal middleware ✅ OK
- **File:** `apps/web/src/middleware.ts`
- Cross-portal isolation active
- **Severity:** — (pass)

### S-05 — JWT httpOnly cookies ✅ OK
- Tokens in cookies, not localStorage
- **Severity:** — (pass)

### S-06 — Dev compose hardcoded DB password ⚠️ Medium (accepted)
- **File:** `docker-compose.yml`
- Dev-only `nexsmsid:nexsmsid` — prod uses env interpolation
- **Severity:** Medium — accepted for local dev

### S-07 — auth-storage.ts legacy ⚠️ Low
- Still referenced by web shells — not safe to delete yet
- **Severity:** Low — defer cleanup

### S-08 — `pnpm audit --audit-level high` ✅ OK
- CI passes with high-only gate
- **Severity:** — (pass)

## PPDB manual review checklist

- [x] Path traversal blocked (`..`)
- [x] Registration-scoped file keys
- [x] MIME type whitelist
- [x] Public routes use `@Public()` + captcha where required
- [x] Upload tokens via dedicated service
