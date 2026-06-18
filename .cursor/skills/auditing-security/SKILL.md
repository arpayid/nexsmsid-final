---
name: auditing-security
description: Performs systematic security audit checking OWASP Top 10, secrets exposure, auth/RBAC, injection, and dependency vulnerabilities. Use when auditing security, hardening apps, or reviewing auth endpoints.
origin: spencerpauly/awesome-cursor-skills
---

# Security Audit

Use when the user asks to audit security, check for vulnerabilities, review code for security issues, or harden an application.

## Steps

1. **Scan for hardcoded secrets** — `password=`, `secret=`, `token=`, `api_key=`, AWS/Stripe/GitHub key patterns. Verify `.env` not committed.

2. **Check authentication & authorization**
   - All API routes authenticated before processing
   - RBAC enforced server-side (not UI only)
   - Password hashing: bcrypt/argon2
   - Tokens: httpOnly, secure, reasonable expiry

3. **Check injection vulnerabilities**
   - SQL: parameterized queries (Prisma OK)
   - XSS: `dangerouslySetInnerHTML`, unescaped user input
   - Command injection: `exec()` with user input
   - Path traversal: file upload paths

4. **Review dependency security** — `pnpm audit --audit-level high`

5. **Check CORS and security headers** — no `*` origin in prod, CSP, HSTS

6. **Review data exposure** — no password hashes in API responses, no stack traces in prod errors

7. **Generate report** — Critical / High / Medium / Low with file path and fix

## NexSMSID V4 hotspots

- `apps/api/src/auth/` — JWT rotation, lockout
- `apps/api/src/auth/guards/permission.guard.ts` — explicit permissions required
- `apps/web/src/middleware.ts` — portal isolation
- `apps/api/src/public-ppdb/` — public upload + quota
- `apps/api/src/config/env.validation.ts` — prod constraints
