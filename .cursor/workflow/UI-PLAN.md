# UI Enterprise 2026 — Execution Plan

**Workflow:** [UI-ENTERPRISE-2026.md](UI-ENTERPRISE-2026.md) · **Status:** [STATUS.md](STATUS.md) · **Roadmap:** [../audit/ROADMAP.md](../audit/ROADMAP.md)

Setiap baris = **1 PR** → validasi → merge jika CI hijau.

---

## UI-S0 — Audit & workflow ✅

| Item | Status |
|------|--------|
| Dokumen A→P→E→V→PR→M | ✅ |
| Audit baseline | ✅ |
| Sprint map | ✅ |
| Update STATUS.md | ✅ |

---

## UI-S1 — Design system foundation

**Branch:** `feat/ui-s1-design-system`

**Scope:**

- `apps/web/src/app/globals.css` — tokens selaras mockup (#10B981, dll.)
- `packages/ui/src/*` — Button, Badge, Card, Input, StatCard, PageHeader polish
- Dokumentasi token singkat di komentar CSS (bukan file markdown baru)

**Acceptance:**

- [ ] Primary/emerald konsisten di Button + Badge
- [ ] Card shadow/radius seragam
- [ ] Dark mode: variabel tidak broken (minimal smoke)

**Verify:** tier Web

---

## UI-S2 — Admin shell

**Branch:** `feat/ui-s2-admin-shell`

**Scope:**

- `apps/web/src/components/admin-shell.tsx`
- `globals.css` — nav primary, mobile bottom nav

**Acceptance:**

- [ ] 8 nav utama flat (Dashboard … Pengaturan) + Menu lengkap di bawah
- [ ] Header: search lebar, bell badge merah, avatar
- [ ] Mobile: bottom nav (Dashboard, Akademik, Keuangan, PPDB, Lainnya)
- [ ] Semua modul lama tetap reachable

**Verify:** tier Web + smoke RBAC

---

## UI-S3 — Admin dashboard

**Branch:** `feat/ui-s3-admin-dashboard`

**Scope:**

- `apps/web/src/components/dashboard/*`
- `apps/web/src/app/admin/(dashboard)/page.tsx`

**Acceptance:**

- [ ] Hero banner gradient + CTA (mockup)
- [ ] KPI 4 kolom + sparkline
- [ ] Chart Arus Kas + PPDB; alert + ringkasan keuangan
- [ ] Tanpa Rekap Presensi (keputusan produk)
- [ ] Tanpa duplikat metrik

**Verify:** tier Web

**Catatan:** PR #8–#10 sudah cover sebagian; sprint ini = selaraskan penuh mockup pasca S1–S2.

---

## UI-S4 — Auth pages

**Branch:** `feat/ui-s4-auth`

**Scope:**

- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/account/change-password/*`

**Acceptance:**

- [ ] Login split/brand panel enterprise
- [ ] Form states: loading, error, validation jelas
- [ ] Mobile usable

---

## UI-S5 — Admin page patterns

**Branch:** `feat/ui-s5-admin-patterns` (bisa sub-PR per modul)

**Scope (fase 5a — pilot 3 modul):**

- Siswa, Keuangan dashboard, PPDB list
- Pattern: PageHeader + SearchFilterBar + DataTable + EmptyState

**Acceptance:**

- [ ] 3 halaman pilot konsisten visual
- [ ] Dokumentasi pattern singkat di komentar atau Storybook skip

**Fase 5b+:** roll out modul lain bertahap (satu PR per domain).

---

## UI-S6 — Portal shells

**Branch:** `feat/ui-s6-portal-shells`

**Scope:**

- `portal-shell.tsx`
- Dashboard portal guru, siswa, wali (home only dulu)

**Acceptance:**

- [ ] Brand selaras admin (emerald, card style)
- [ ] Nav portal responsive

---

## UI-S7 — QA polish

**Branch:** `feat/ui-s7-polish`

**Scope:**

- Dark mode pass
- Focus ring / keyboard nav spot check
- Responsive regression pass admin + portal

---

## Sprint aktif

| Field | Nilai |
|-------|-------|
| **Sprint** | UI-S0 ✅ selesai → **UI-S1** berikutnya |
| **Branch** | — |
| **PR** | — |

Update baris ini di setiap sprint (STATUS.md mirror).
