# Operasional minimal — NexSMSID V4

Runbook untuk **menjual dan mengoperasikan banyak instalasi** tanpa tim DevOps besar.  
Satu pelanggan = satu server (atau VM) dengan stack Docker `nexsmsid-v4-prod`.

Lihat juga: [DEPLOY-PER-CUSTOMER.md](DEPLOY-PER-CUSTOMER.md) · [SALES-READINESS.md](SALES-READINESS.md)

---

## Peran & eskalasi

| Tingkat | Siapa | Tugas |
|---------|-------|--------|
| **L1** | Admin sekolah / helpdesk Anda | Login gagal, reset password, isi profil sekolah, cek URL/domain |
| **L2** | Teknis deploy (Anda / mitra) | Restart container, backup/restore, update versi, nginx/SSL |
| **L3** | Pengembang produk | Bug aplikasi, migrasi DB kompleks, patch keamanan |

**Batas L1:** jangan berikan akses root server ke admin sekolah kecuali disepakati.

---

## Pantau kesehatan (cron)

Jalankan **harian** atau **setiap 6 jam** di server pelanggan:

```bash
cd /path/to/nexsmsid-v4
pnpm health https://sms.sekolah-contoh.sch.id >> /var/log/nexsmsid-health.log 2>&1
```

Contoh crontab (`crontab -e`):

```cron
0 */6 * * * cd /opt/nexsmsid-v4 && /usr/bin/bash -lc 'pnpm health "$WEB_ORIGIN"' >> /var/log/nexsmsid-health.log 2>&1
```

Ganti `WEB_ORIGIN` dengan URL aktual atau export di shell profile.

**Alert manual:** jika log berisi HTTP 5xx atau container `Exit`, ikuti § Pemulihan cepat.

---

## Backup database

**Mingguan** (minimal) + sebelum setiap update versi:

```bash
cd /path/to/nexsmsid-v4
pnpm backup
```

Arsip ada di `backups/`. Salin off-site (S3, drive mitra, dll.).

Restore (hati-hati — timpa data):

```bash
pnpm restore backups/nexsmsid-YYYY-MM-DD_HH-MM-SS.sql.gz
pnpm docker:prod:up
```

---

## Update rilis (patch / minor)

Urutan wajib:

1. `pnpm backup`
2. `git pull` (atau deploy artefak rilis)
3. `pnpm docker:prod:build`
4. `pnpm docker:prod:up`
5. `pnpm db:migrate:prod`
6. `pnpm prod:smoke "$WEB_ORIGIN"`

Jika smoke gagal: rollback image/tag sebelumnya + restore backup jika DB rusak.

---

## Deploy pelanggan baru

Satu perintah setelah `.env.production` siap:

```bash
pnpm deploy:customer
# atau dengan URL eksplisit:
pnpm deploy:customer https://sms.sekolah-baru.sch.id
```

Opsional HTTPS nginx config:

```bash
DOMAIN=sms.sekolah-baru.sch.id pnpm deploy:customer
```

Instalasi pertama — seed admin:

```bash
pnpm db:seed:prod
```

---

## Pemulihan cepat

| Gejala | Tindakan |
|--------|----------|
| Situs tidak bisa diakses | `docker compose -f docker-compose.prod.yml ps` → `pnpm docker:prod:up` |
| API 502 | Cek log API: `docker compose -f docker-compose.prod.yml logs api --tail 100` |
| Login 401 massal | Cek `WEB_ORIGIN` / `CORS_ORIGIN` cocok dengan URL browser |
| DB penuh / corrupt | Stop traffic, `pnpm restore` dari backup terakhir |
| Disk penuh | Bersihkan log Docker / rotasi backup lama |

---

## Keamanan rutin

- Rotasi `JWT_*` hanya dengan maintenance window (invalidate semua sesi)
- Ganti `POSTGRES_PASSWORD` hanya dengan re-deploy + update `DATABASE_URL`
- Pantau `pnpm audit` di CI sebelum rilis; terapkan patch dependency ke semua pelanggan
- Pastikan Turnstile **production keys** di env pelanggan (bukan `1x0000…` test key)

---

## Dukungan pelanggan (template respons)

**Login tidak bisa:** pastikan URL persis `WEB_ORIGIN`; coba incognito; reset password super admin via DB hanya L2.

**Domain baru:** update `.env.production` + nginx + sertifikat → `pnpm deploy:customer`.

**Permintaan fitur:** catat di backlog produk; instalasi per sekolah tidak fork kode — fitur baru lewat rilis umum.

---

*Runbook ini melengkapi skor operasional 10/10 di [SALES-READINESS.md](SALES-READINESS.md).*
