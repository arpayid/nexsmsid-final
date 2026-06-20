# Pilot Hardening — NexSMSID V4

Checklist sebelum go-live domain nyata (Fase 4).

## 1. Environment production

```bash
cp .env.production.example .env.production
# Edit: JWT (openssl rand -base64 64), POSTGRES_PASSWORD, WEB_ORIGIN, CORS_ORIGIN
pnpm validate:prod-env
```

| Variabel                                   | Wajib             | Catatan                                         |
| ------------------------------------------ | ----------------- | ----------------------------------------------- |
| `NODE_ENV`                                 | production        |                                                 |
| `WEB_ORIGIN` / `CORS_ORIGIN`               | URL akses user    | Sama persis (http IP staging atau https domain) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥64 char, berbeda | `openssl rand -base64 64`                       |
| `TURNSTILE_SECRET_KEY`                     | Production key    | Test key hanya pilot internal                   |
| `NEXT_PUBLIC_API_URL`                      | `/api/v1`         | Behind nginx                                    |
| `POSTGRES_PASSWORD`                        | Strong            | Bukan placeholder example                       |

## 2. Deploy stack

```bash
pnpm validate:prod-env
pnpm docker:prod:build
pnpm docker:prod:up
pnpm db:migrate:prod
pnpm health http://localhost   # atau IP/domain
```

## 3. HTTPS (domain nyata)

1. Arahkan DNS A record ke server
2. Set `WEB_ORIGIN` / `CORS_ORIGIN` / `NEXT_PUBLIC_APP_URL` ke `https://domain`
3. Jalankan certbot (contoh):
   ```bash
   certbot certonly --webroot -w /var/www/certbot -d sekolah.example.com
   ```
4. Copy `docker/nginx/conf.d/https.conf.example` → `https.conf`, sesuaikan `server_name` + path sertifikat
5. Reload nginx container
6. Blok redirect HTTP→HTTPS di `default.conf` sudah ada untuk `your-domain.com` — ganti domain

## 4. Smoke test prod

- [ ] `GET /api/v1/health` → OK
- [ ] Login superadmin + Turnstile
- [ ] Admin dashboard load
- [ ] 1 flow kritik: PPDB / tagihan / presensi

## 5. Operasional

```bash
pnpm backup          # uji backup
pnpm restore         # dry run restore
```

## 6. Build note

`next build` di Docker mungkin log `fetch failed` saat prerender `/jurusan/*` jika API belum jalan — **bukan blocker**; fallback slug seed (`pmkr`) dipakai.
