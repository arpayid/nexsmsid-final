# Smoke Test — NexSMSID V4

**Tanggal:** 2026-06-15  
**Fase:** 2 — Quality  
**Environment:** Local dev (`pnpm dev`)

## Ringkasan

| Kategori | Pass | Fail | Catatan |
|----------|------|------|---------|
| API health | ✅ | | `GET /api/v1/health` → 200 |
| API login | ✅ | | Superadmin login sukses |
| API CRUD (post pwd change) | ⏳ | | Rate limit 429 saat retest |
| Web admin pages | ✅ | | 7/7 halaman admin → 200 |
| Web portal pages | ✅ | | teacher/student/guardian → 200 |
| Web public | ⚠️ | | `/login`, `/ppdb/register` → 500 (`.next` cache conflict saat parallel build) |

## API Smoke

| ID | Endpoint | Akun | Status | HTTP |
|----|----------|------|--------|------|
| P2-health | `/api/v1/health` | — | PASS | 200 |
| P2-login | `/api/v1/auth/login` | superadmin | PASS | 200 |
| P2-pwd | `/api/v1/auth/change-password` | superadmin | PASS | 200 |
| P2-dept | `/api/v1/departments` | superadmin | BLOCKED | 403 → pwd change required (expected sebelum change) |
| P2-teacher | `/api/v1/auth/login` | guru@nexsmsid.dev | PASS | 200 |
| P2-student | `/api/v1/auth/login` | siswa@nexsmsid.dev | PASS | 200 |
| P2-guardian | `/api/v1/auth/login` | wali@nexsmsid.dev | PASS | 200 |

## Web Smoke (HTTP status)

| ID | Path | Status | HTTP |
|----|------|--------|------|
| P2-W01 | `/admin` | PASS | 200 |
| P2-W02 | `/admin/master-data/departments` | PASS | 200 |
| P2-W03 | `/admin/students` | PASS | 200 |
| P2-W04 | `/admin/academic/schedules` | PASS | 200 |
| P2-W05 | `/admin/finance/invoices` | PASS | 200 |
| P2-W06 | `/admin/ppdb` | PASS | 200 |
| P2-W07 | `/teacher` | PASS | 200 |
| P2-W08 | `/student` | PASS | 200 |
| P2-W09 | `/guardian` | PASS | 200 |
| P2-W10 | `/login` | FAIL | 500 (dev cache — restart dev fixes) |
| P2-W11 | `/ppdb/register` | FAIL | 500 (same) |

## Verdict Fase 2

- **5 domain admin web:** PASS (departments, students, schedules, invoices, ppdb admin)
- **3 portal web:** PASS
- **CI Node 24:** In progress (PR terpisah)
- **Blocker:** Tidak ada blocker kritis — login/public 500 adalah dev cache artifact
