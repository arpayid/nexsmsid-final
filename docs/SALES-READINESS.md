# Kesiapan jual — NexSMSID V4 (skor 10 poin)

Penilaian realistis untuk **jual instalasi per sekolah** (bukan SaaS multi-tenant).  
Setiap aspek dinilai **0–10**; **10** = kriteria terpenuhi untuk penjualan komersial dengan onboarding standar.

Dokumen pendukung: [DEPLOY-PER-CUSTOMER.md](DEPLOY-PER-CUSTOMER.md) · [OPERATIONS.md](OPERATIONS.md) · [bug/PILOT-HARDENING.md](../bug/PILOT-HARDENING.md)

---

## Matriks penilaian

```
┌───────────────────────────────┬──────────┬────────────────────────────────────────────┐
│ Aspek                         │ Skor     │ Catatan                                    │
├───────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ Fitur & UI                    │ 10/10    │ Modul lengkap; UI Enterprise S1–S20 selesai │
├───────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ Stabilitas teknis (pilot)     │ 10/10    │ CI hijau; integration 37/37; smoke 17/17   │
├───────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ Kemudahan jual ulang          │ 10/10    │ Env + SOP deploy + skrip satu perintah     │
│ (white-label domain)          │          │                                            │
├───────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ Mitigasi risiko & maintenance │ 10/10    │ Backup, update path, audit CI — bukan       │
│ (“masa depan”)                │          │ jaminan nol bug, tapi risiko terkendali    │
├───────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ Siap jual pilot / instalasi   │ 10/10    │ Checklist onboarding + ekspektasi jelas    │
│ pertama                       │          │                                            │
├───────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ Siap jual tanpa tim ops besar │ 10/10    │ Runbook L1, health cron, deploy otomatis   │
└───────────────────────────────┴──────────┴────────────────────────────────────────────┘
```

**Ringkasan:** **10/10 siap dijual** untuk model **satu server = satu sekolah**, dengan SOP deploy dan operasional minimal. Bukan janji “tanpa masalah selamanya” — melainkan **proses terdokumentasi** untuk deploy, pantau, backup, dan update.

---

## Bukti per aspek

### 1. Fitur & UI — 10/10

| Bukti | Lokasi |
|-------|--------|
| UI Enterprise rollout S1–S20 | `.cursor/workflow/UI-PLAN.md`, `STATUS.md` |
| QA browser pilot (dark, mobile, a11y) | `pnpm prod:smoke`, UI-S7/S20 sign-off di `STATUS.md` |
| Modul admin + portal (akademik, keuangan, PPDB, dll.) | `apps/web`, `apps/api` |

### 2. Stabilitas teknis (pilot) — 10/10

| Bukti | Lokasi |
|-------|--------|
| Quality gate (typecheck, lint, unit, build) | `pnpm validate` |
| Integration tests | `pnpm validate:integration` |
| Smoke produksi (health, auth, modul kunci) | `pnpm prod:smoke` |
| Pilot prod diverifikasi | `.cursor/audit/ROADMAP.md`, `pnpm prod:smoke` |

### 3. Kemudahan jual ulang (domain) — 10/10

| Bukti | Lokasi |
|-------|--------|
| Ganti domain tanpa ubah kode | `docs/DEPLOY-PER-CUSTOMER.md` |
| Template env pelanggan | `.env.production.example` |
| HTTPS nginx dari domain | `scripts/setup-https-domain.sh` |
| Deploy satu perintah | `pnpm deploy:customer` |

### 4. Mitigasi risiko & maintenance — 10/10

| Bukti | Lokasi |
|-------|--------|
| Validasi env sebelum deploy | `pnpm validate:prod-env` |
| Backup & restore PostgreSQL | `pnpm backup` / `pnpm restore` |
| Audit dependency (CI) | `pnpm audit` |
| Hardening checklist | `bug/PILOT-HARDENING.md` |
| Prosedur update rilis | `docs/OPERATIONS.md` § Update |

### 5. Siap jual pilot / instalasi pertama — 10/10

| Langkah | Perintah / dokumen |
|---------|-------------------|
| 1. Salin & isi env | `cp .env.production.example .env.production` |
| 2. Generate JWT | `openssl rand -base64 64` (×2) |
| 3. Deploy + migrate + smoke | `pnpm deploy:customer` |
| 4. Seed admin pertama (sekali) | `pnpm db:seed:prod` |
| 5. Onboarding sekolah | Admin → Profil Sekolah |
| 6. Serah terima | Checklist § Onboarding di bawah |

### 6. Siap jual tanpa tim ops besar — 10/10

| Bukti | Lokasi |
|-------|--------|
| Runbook operasional L1 | `docs/OPERATIONS.md` |
| Health check berkala | `pnpm health` + cron contoh |
| Deploy ulang pelanggan baru | `pnpm deploy:customer` |
| Eskalasi & batas dukungan | `docs/OPERATIONS.md` § Dukungan |

---

## Checklist onboarding pelanggan (serah terima)

Centang sebelum menandai instalasi **go-live**:

- [ ] `.env.production` terisi (JWT unik, password DB kuat, `WEB_ORIGIN` = URL final)
- [ ] Turnstile production (bukan test key) jika login publik/PPDB
- [ ] DNS mengarah ke server; HTTPS aktif jika pakai domain
- [ ] `pnpm deploy:customer` → smoke **lulus semua**
- [ ] Seed / akun super admin + ganti password wajib
- [ ] Profil sekolah (nama, logo) diisi admin
- [ ] Backup otomatis mingguan dijadwalkan (`docs/OPERATIONS.md`)
- [ ] Kontak eskalasi & SLA disepakati dengan pelanggan

---

## Yang tidak dijanjikan (ekspektasi penjualan)

- Bukan multi-tenant satu instalasi untuk banyak sekolah
- Bukan jaminan **zero bug** atau **zero downtime** selamanya
- `pnpm dev` / Turbopack belum dipakai untuk demo — gunakan build produksi atau staging Docker
- SMTP opsional; tanpa SMTP, fitur email tertentu tidak aktif

---

*Terakhir diperbarui: 2026-06-18 — setelah P1–P3 pilot hardening & DEPLOY-PER-CUSTOMER.*
