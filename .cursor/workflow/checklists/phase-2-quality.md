# Checklist — Fase 2: Quality & Coverage

**Tujuan:** Validasi alur bisnis end-to-end sebelum hardening.

## Smoke test per domain

| Domain          | URL                              | Alur                | Status |
| --------------- | -------------------------------- | ------------------- | ------ |
| Master data     | `/admin/master-data/departments` | CRUD 1 record       | [ ]    |
| People          | `/admin/students`                | Create → list       | [ ]    |
| Akademik        | `/admin/academic/schedules`      | View jadwal         | [ ]    |
| Keuangan        | `/admin/finance/invoices`        | List tagihan        | [ ]    |
| PPDB            | `/ppdb/register` + `/admin/ppdb` | Daftar → verifikasi | [ ]    |
| Portal teacher  | `/teacher`                       | Login guru          | [ ]    |
| Portal student  | `/student`                       | Login siswa         | [ ]    |
| Portal guardian | `/guardian`                      | Login wali          | [ ]    |

## CI maintenance (paralel)

- [ ] Upgrade `actions/checkout`, `setup-node`, `pnpm/action-setup`
- [ ] Node 24-ready di workflow
- [ ] CI tetap hijau setelah upgrade

## Dependency

- [ ] Review moderate vulnerability (jika patch tersedia)
- [ ] `pnpm audit --audit-level high` tetap hijau

## Exit

5+ domain lolos smoke, tidak ada blocker login/CRUD → **Fase 3**.
