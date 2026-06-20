# NexSMSID V4 — Module Map

## API domain modules (`apps/api/src/modules/`)

| Module        | Folder terkait                                                     | Catatan                         |
| ------------- | ------------------------------------------------------------------ | ------------------------------- |
| Identity      | `auth/`, `users/`, `roles/`, `permissions/`, `modules/identity/`   | JWT, sessions, RBAC             |
| School        | `school-profile/`, `modules/school/`                               | Profil sekolah                  |
| People        | `students/`, `teachers/`, `guardians/`, `staffs/`, `people/`       | Excel import, soft delete       |
| Academic      | `schedules/`, `grades/`, `attendance/`, `subjects/`, `classrooms/` | Jadwal, nilai, absensi          |
| Finance       | `invoices/`, `payments/`, `expenses/`, `payment-categories/`       | Tagihan & pembayaran            |
| PPDB          | `ppdb-periods/`, `ppdb-registrations/`, `public-ppdb/`             | Kuota, upload dokumen           |
| Communication | `announcements/`, `notifications/`, `internal-messages/`           | Notif multi-channel             |
| Operations    | `inventory/`, `library/`, `letters/`                               | Inventaris, perpustakaan, surat |
| Reporting     | `report-center/`, `report-jobs/`, `report-engine/`                 | Async jobs via BullMQ           |
| Finance HR    | `payroll/`, `hr/` patterns                                         | Gaji, kehadiran staff           |

## Portal controllers

| Portal          | Controller prefix                  |
| --------------- | ---------------------------------- |
| Admin dashboard | `dashboard/`                       |
| Teacher         | `teacher-portal/`                  |
| Student         | `student-portal/`                  |
| Guardian        | `guardian-portal/`                 |
| Public site     | `public-ppdb/public.controller.ts` |

## api-client domains (`packages/api-client/src/domains/`)

Setiap domain = `createXxxApi({ request, … })` di file terpisah, di-wire di `client.ts`.

Tambah method baru di domain yang sudah ada; buat file domain baru hanya untuk bounded context baru.

## Permission convention

Format: `resource.action` — contoh: `master-data.view`, `students.create`, `finance.payments.verify`.

Setiap endpoint protected **harus** punya `@RequirePermissions(...)`. Tanpa dekorator → `403 Forbidden`.

Wildcard `*` di user permissions = super access.

## Prisma conventions

- Soft delete: field `deletedAt` — Prisma middleware di `database/prisma.service.ts` auto-filter
- IDs: CUID (`@default(cuid())`)
- Migrations: `apps/api/prisma/migrations/` — jangan edit migration yang sudah deployed

## Web page layout

```
apps/web/src/app/
├── admin/          # Shell: admin-shell, permission-gate
├── teacher/
├── student/
├── guardian/
├── (public)/       # Public marketing + PPDB
├── login/
└── api/auth/session/  # Refresh cookie bridge
```

Admin pages: gunakan komponen `@nexsmsid/ui` (`PageHeader`, `DataTable`, `FormModal`, `SectionCard`).

## Testing locations

| Type        | Path                                  |
| ----------- | ------------------------------------- |
| Unit (API)  | `apps/api/src/**/*.spec.ts`           |
| Integration | `apps/api/test/integration/*.spec.ts` |
| Web unit    | `apps/web/src/**/*.spec.ts`           |

Integration tests butuh `DATABASE_URL` ke `nexsmsid_test` dan Redis di localhost.
