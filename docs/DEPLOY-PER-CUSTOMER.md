# Deploy per pelanggan — NexSMSID V4

Panduan standar saat produk dijual ke sekolah baru: **satu instalasi = satu sekolah = satu domain**.  
Tidak perlu fork atau ubah kode aplikasi — cukup konfigurasi environment, nginx, dan DNS di sisi pelanggan.

Lihat juga: [README.md](../README.md) (deploy umum) · [SALES-READINESS.md](SALES-READINESS.md) (skor kesiapan jual) · [OPERATIONS.md](OPERATIONS.md) (runbook L1) · [bug/PILOT-HARDENING.md](../bug/PILOT-HARDENING.md) (checklist hardening)

---

## Model penjualan

| Aspek                              | Pola                                                    |
| ---------------------------------- | ------------------------------------------------------- |
| Multi-tenant satu DB banyak domain | **Tidak** — setiap pelanggan punya stack Docker sendiri |
| Ganti domain                       | **Ya** — lewat `.env.production` + nginx                |
| Ganti nama/logo sekolah            | **Ya** — Admin → Profil Sekolah (database)              |
| Brand produk (NexAdmin / NexSMSID) | Tetap di UI; bukan domain pelanggan                     |

---

## Variabel wajib per pelanggan

Salin `.env.production.example` → `.env.production` di server pelanggan.

| Variabel                         | Contoh                         | Catatan                                              |
| -------------------------------- | ------------------------------ | ---------------------------------------------------- |
| `WEB_ORIGIN`                     | `https://sms.smkcontoh.sch.id` | **Harus persis** URL yang dibuka user (skema + host) |
| `CORS_ORIGIN`                    | sama dengan `WEB_ORIGIN`       | Dipakai CORS API & cookie auth                       |
| `NEXT_PUBLIC_APP_URL`            | sama dengan `WEB_ORIGIN`       | Sitemap / robots                                     |
| `NEXT_PUBLIC_API_URL`            | `/api/v1`                      | Tetap relatif jika di belakang nginx                 |
| `JWT_ACCESS_SECRET`              | `openssl rand -base64 64`      | Unik per instalasi, ≥64 karakter                     |
| `JWT_REFRESH_SECRET`             | `openssl rand -base64 64`      | Beda dari access secret                              |
| `POSTGRES_PASSWORD`              | strong random                  | Update juga di `DATABASE_URL`                        |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | dari Cloudflare Turnstile      | Hostname harus domain pelanggan                      |
| `TURNSTILE_SECRET_KEY`           | pasangan site key              | Wajib di `NODE_ENV=production`                       |

**Opsional:**

| Variabel                      | Kapan                                                            |
| ----------------------------- | ---------------------------------------------------------------- |
| `PPDB_PROVISION_EMAIL_DOMAIN` | Domain email default akun portal siswa (mis. `smkcontoh.sch.id`) |
| `SMTP_*`                      | Email welcome / notifikasi                                       |

Validasi sebelum deploy:

```bash
pnpm validate:prod-env
```

Deploy lengkap (build → up → migrate → smoke):

```bash
pnpm deploy:customer
# atau: pnpm deploy:customer https://sms.smkcontoh.sch.id
# dengan nginx HTTPS: DOMAIN=sms.smkcontoh.sch.id pnpm deploy:customer
```

Lihat [OPERATIONS.md](OPERATIONS.md) untuk cron health, backup, dan update rilis.

---

## DNS & HTTPS (tanggung jawab pelanggan / tim deploy)

Aplikasi **tidak** mengatur DNS. Yang diperlukan:

1. **A record** `@` (dan opsional `www`) → IP server VPS pelanggan
2. **HTTPS** — salah satu:
   - **Let's Encrypt + certbot** (DNS only / grey cloud) — ikuti `bug/PILOT-HARDENING.md`
   - **Cloudflare proxy** (orange cloud) + Origin Certificate di nginx
3. Propagasi DNS aktif sebelum smoke test domain

Pilot tanpa domain (hanya IP + HTTP) tetap didukung:

```bash
WEB_ORIGIN=http://203.0.113.10
CORS_ORIGIN=http://203.0.113.10
NEXT_PUBLIC_APP_URL=http://203.0.113.10
```

Cookie auth otomatis tanpa flag `Secure` pada origin HTTP.

---

## Nginx — sekali per domain

Placeholder `your-domain.com` ada di `docker/nginx/conf.d/default.conf` dan `https.conf.example`.

```bash
# Ganti your-domain.com di default.conf (blok redirect HTTP→HTTPS)
DOMAIN=sms.smkcontoh.sch.id bash scripts/setup-https-domain.sh
```

Lalu terbitkan sertifikat (certbot atau Cloudflare Origin Cert) dan aktifkan `docker/nginx/conf.d/https.conf`.

Stack default tetap melayani **HTTP di IP/localhost** lewat blok `default_server` — berguna untuk staging sebelum domain siap.

---

## Checklist deploy pertama (sekolah baru)

```bash
# 1. Environment
cp .env.production.example .env.production
# edit semua variabel di tabel atas

# 2. Validasi
pnpm validate:prod-env

# 3. Nginx domain (jika pakai HTTPS + domain)
DOMAIN=<domain-pelanggan> bash scripts/setup-https-domain.sh
# + certbot / origin cert sesuai opsi HTTPS

# 4. Build & jalankan
pnpm docker:prod:build
pnpm docker:prod:up
pnpm db:migrate:prod
pnpm db:seed:prod          # hanya first deploy

# 5. Verifikasi
pnpm health https://<domain-pelanggan>
pnpm prod:smoke https://<domain-pelanggan>
```

**Login awal seed:** `superadmin@nexsmsid.dev` / `ChangeMe123!` — ganti password segera.  
Atur **Profil Sekolah** di admin untuk nama, logo, dan data publik.

---

## Checklist ganti domain (instalasi sudah jalan)

Tanpa ubah kode — hanya konfigurasi:

1. Update `.env.production`: `WEB_ORIGIN`, `CORS_ORIGIN`, `NEXT_PUBLIC_APP_URL`
2. Buat Turnstile key baru untuk hostname domain
3. Jalankan `scripts/setup-https-domain.sh` + perbarui sertifikat nginx
4. `pnpm docker:prod:build && pnpm docker:prod:up` (rebuild web agar build args Turnstile ikut)
5. `pnpm prod:smoke https://<domain-baru>`

Data PostgreSQL **tidak** perlu di-reset hanya karena ganti domain.

---

## Smoke test minimum

| Check    | Perintah / aksi                                            |
| -------- | ---------------------------------------------------------- |
| Health   | `curl -f https://<domain>/api/v1/health`                   |
| Otomatis | `pnpm prod:smoke https://<domain>` → target 17/17          |
| Manual   | Login superadmin, dashboard admin, `/ppdb/register` publik |
| Portal   | Login guru/siswa/wali (setelah ganti password seed)        |

---

## Yang tidak perlu diubah per pelanggan

- Source code `apps/api`, `apps/web`, `packages/*`
- Skema database (migrate deploy saja)
- CI / GitHub Actions
- IP pilot atau contoh di dokumentasi (bukan runtime)

---

## Troubleshooting singkat

| Gejala                               | Penyebab umum                                                 |
| ------------------------------------ | ------------------------------------------------------------- |
| Login gagal / cookie tidak tersimpan | `WEB_ORIGIN` tidak sama dengan URL di address bar             |
| CORS error                           | `CORS_ORIGIN` / `WEB_ORIGIN` salah skema (`http` vs `https`)  |
| Turnstile gagal                      | Site key tidak mencakup hostname domain production            |
| `db:migrate:prod` gagal dari host    | Gunakan `pnpm db:migrate:prod` (jalan di dalam container API) |
| Redirect loop HTTPS                  | `server_name` nginx tidak cocok dengan domain                 |

---

## Referensi skrip

| Skrip                           | Fungsi                            |
| ------------------------------- | --------------------------------- |
| `pnpm validate:prod-env`        | Validasi `.env.production`        |
| `pnpm docker:prod:build` / `up` | Stack production                  |
| `pnpm db:migrate:prod`          | Prisma migrate di container API   |
| `pnpm db:seed:prod`             | Seed first deploy                 |
| `pnpm prod:smoke [URL]`         | Smoke test HTTP/API               |
| `pnpm backup` / `pnpm restore`  | Operasional database              |
| `scripts/setup-https-domain.sh` | Generate `https.conf` dari domain |
