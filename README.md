# NexSMSID V4

Enterprise School Management System — modular monolith, production-ready.

| Atribut         | Nilai                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Nama            | NexSMSID V4                                                                    |
| Version         | 4.0.0                                                                          |
| Package         | `nexsmsid-final`                                                               |
| Package Manager | pnpm@10.18.3                                                                   |
| Node            | >= 20.11.0 (CI: Node.js 24)                                                    |
| Repo            | [github.com/arpayid/nexsmsid-final](https://github.com/arpayid/nexsmsid-final) |
| Status          | Fase 4 — Production pilot ✅ stack Docker + nginx; HTTPS domain opsional       |

## Tech Stack

| Layer      | Teknologi                                           |
| ---------- | --------------------------------------------------- |
| Backend    | NestJS 11, Prisma 6, PostgreSQL 16, Redis 7, BullMQ |
| Frontend   | Next.js 15, React 19, TailwindCSS 3, shadcn/ui      |
| Auth       | JWT (access + refresh), bcryptjs, RBAC              |
| Validation | Zod (env, DTO, pipes)                               |
| Testing    | Vitest (unit + integration)                         |
| Tooling    | pnpm workspace, Turborepo, TypeScript 5.9, ESLint   |
| Infra      | Docker Compose, Nginx, GitHub Actions               |

## Struktur Monorepo

```text
nexsmsid-final/
├── apps/
│   ├── api/          # NestJS API (port 4000, prefix /api/v1)
│   └── web/          # Next.js 15 App Router (port 3000)
├── packages/
│   ├── api-client/   # Typed HTTP client
│   ├── types/        # Shared types
│   └── ui/           # UI component library
├── docker/           # Nginx config
├── docker-compose.yml       # Dev: PostgreSQL + Redis
├── docker-compose.prod.yml  # Production stack
├── Dockerfile.api
├── Dockerfile.web
└── .github/workflows/ci.yml
```

## Prasyarat

- Node.js >= 20.11.0
- pnpm >= 10.18.3
- Docker & Docker Compose (development dan production)

## Development

```bash
pnpm install
cp .env.example .env          # sesuaikan secret JWT (min. 64 karakter)
docker compose up -d          # PostgreSQL + Redis
pnpm --filter @nexsmsid/api prisma migrate dev
pnpm --filter @nexsmsid/api prisma db seed
pnpm dev                      # API :4000 + Web :3000
```

Perintah berguna:

```bash
pnpm build                    # Build seluruh workspace
pnpm typecheck
pnpm lint
pnpm format:check
pnpm --filter @nexsmsid/api test
pnpm validate:integration     # butuh Postgres + Redis + build API
```

### Credential development (setelah seed)

| Role        | Email                     | Password       |
| ----------- | ------------------------- | -------------- |
| Super Admin | `superadmin@nexsmsid.dev` | `ChangeMe123!` |

User seed memakai `forceChangePassword=true` — login pertama akan diminta ganti password.

## Deploy Production

Stack production: **PostgreSQL + Redis + API + Web + Nginx** via `docker-compose.prod.yml` (project Docker: `nexsmsid-final-prod`).

**Penjualan ke banyak sekolah (ganti domain tanpa ubah kode):** lihat [docs/DEPLOY-PER-CUSTOMER.md](docs/DEPLOY-PER-CUSTOMER.md). **Skor kesiapan jual (10 poin):** [docs/SALES-READINESS.md](docs/SALES-READINESS.md).

### 1. Siapkan environment

Salin `.env.production.example` ke `.env.production` di server production dan isi minimal:

```bash
cp .env.production.example .env.production
# edit JWT, POSTGRES_PASSWORD, WEB_ORIGIN/CORS_ORIGIN
pnpm docker:prod:build
pnpm docker:prod:up
```

Contoh isi `.env.production` (staging IP):

```bash
NODE_ENV=production
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgresql://nexsmsid:<password>@postgres:5432/nexsmsid?schema=public
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_REFRESH_SECRET=<openssl rand -base64 64>
CORS_ORIGIN=https://your-domain.com
WEB_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret-key>
```

Turnstile **wajib** di production (divalidasi API saat `NODE_ENV=production`).

**Staging pilot tanpa HTTPS (IP publik / localhost):** set `CORS_ORIGIN` dan `WEB_ORIGIN` ke URL akses yang sama, misalnya `http://156.67.216.146` atau `http://127.0.0.1`. Cookie auth otomatis **tanpa** flag `Secure` bila origin HTTP — login tetap berfungsi di browser. Untuk pilot, Turnstile test key dari `.env.example` boleh dipakai.

| Variabel                     | Peran                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `CORS_ORIGIN` / `WEB_ORIGIN` | Harus sama dengan URL yang dibuka user (termasuk skema `http`/`https`)                 |
| `NEXT_PUBLIC_API_URL`        | Path relatif `/api/v1` (nginx proxy) atau URL absolut penuh                            |
| `API_INTERNAL_URL`           | Sudah diset di `docker-compose.prod.yml` (`http://api:4000`) untuk refresh session web |

### 2. Konfigurasi Nginx

File `docker/nginx/conf.d/default.conf` mendukung dua mode:

- **Staging / pilot HTTP** — blok `default_server` di port 80 (localhost, IP publik, tanpa sertifikat TLS)
- **Production HTTPS** — blok `your-domain.com` dengan redirect HTTP→HTTPS dan sertifikat Let's Encrypt

Untuk domain production:

- Ganti `your-domain.com` dengan domain production
- Sesuaikan path sertifikat Let's Encrypt di volume `certbot_etc`

### 3. Build & jalankan

```bash
pnpm docker:prod:build
pnpm docker:prod:up
pnpm db:migrate:prod
pnpm db:seed:prod    # opsional — hanya first deploy / staging
```

Health check:

```bash
pnpm health                              # default: http://127.0.0.1
pnpm health http://<host-atau-ip>        # staging via IP publik
curl -f http://localhost/api/v1/health
```

Semua 5 service (postgres, redis, api, web, nginx) harus **healthy** sebelum smoke test login.

### 4. Backup database

```bash
pnpm backup          # scripts/backup-postgres.sh → backups/
pnpm restore         # scripts/restore-postgres.sh
```

## CI

Workflow **NexSMSID V4 CI** (`.github/workflows/ci.yml`) berjalan di self-hosted runner `nexsmsid-final-ci-01` dengan label `self-hosted`, `linux`, `nexsmsid-final`.

Pipeline: format → lint → unit test → typecheck → build → integration test → dependency audit (Node.js 24).

PostgreSQL dan Redis di CI dijalankan lewat `scripts/ci-services.sh` (Docker Compose, project `nexsmsid-final-ci`).

Status terakhir: **main hijau** — PR #2–#6 merged (dev bootstrap, CI Node 24, Dockerfile HEALTHCHECK, nginx staging, auth cookies HTTP).

### Registrasi runner (sekali)

```bash
# Di VPS CI, unduh runner dari GitHub → Settings → Actions → Runners
./config.sh --url https://github.com/arpayid/nexsmsid-final --token <TOKEN> \
  --labels self-hosted,linux,nexsmsid-final --name nexsmsid-final-ci-01
sudo ./svc.sh install && sudo ./svc.sh start
```

## API

| Endpoint                    | Deskripsi     |
| --------------------------- | ------------- |
| `GET /api/v1/health`        | Health check  |
| `GET /api/v1/docs`          | Swagger       |
| `POST /api/v1/auth/login`   | Login         |
| `POST /api/v1/auth/refresh` | Refresh token |
| `GET /api/v1/auth/me`       | User saat ini |
