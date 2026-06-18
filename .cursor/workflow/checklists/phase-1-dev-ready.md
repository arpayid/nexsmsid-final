# Checklist — Fase 1: Dev Ready

**Tujuan:** Developer (dan agent) bisa menjalankan stack lokal dan login.

## Prasyarat

- [x] `pnpm install` sukses
- [x] `pnpm build` sukses
- [ ] PostgreSQL + Redis running (`docker compose up -d`)

## Setup environment

```bash
cp .env.example .env
```

- [ ] `JWT_ACCESS_SECRET` — min 64 char (`openssl rand -base64 64`)
- [ ] `JWT_REFRESH_SECRET` — min 64 char
- [ ] `DATABASE_URL` mengarah ke localhost:5432
- [ ] `REDIS_URL` mengarah ke localhost:6379

## Database

```bash
pnpm --filter @nexsmsid/api prisma migrate dev
pnpm --filter @nexsmsid/api prisma db seed
```

- [ ] Migration applied tanpa error
- [ ] Seed data tersedia (superadmin, roles, permissions)

## Dev server

```bash
pnpm dev
```

- [ ] API listening `:4000`
- [ ] Web listening `:3000`
- [ ] Tidak ada error fatal di console

## Smoke verifikasi

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health
# Harus: 200
```

- [ ] Health endpoint 200
- [ ] Login `superadmin@nexsmsid.dev` / `ChangeMe123!`
- [ ] Redirect/password change flow OK
- [ ] Dashboard `/admin` render tanpa error kritis

## Exit

Semua ✅ → update `STATUS.md` ke **Fase 2**, mulai smoke test domain.
