# Checklist — Fase 4: Production Pilot

**Tujuan:** Stack production berjalan di environment staging/pilot.

## Environment production

- [ ] `.env` production lengkap (Turnstile wajib, JWT 64+ char)
- [ ] `WEB_ORIGIN` bukan localhost
- [ ] `NODE_ENV=production`

## Deploy

```bash
pnpm docker:prod:build
pnpm docker:prod:up
pnpm db:migrate:prod
# seed hanya first deploy:
# pnpm db:seed:prod
pnpm health
```

- [ ] Stack prod jalan: postgres, redis, api, web, nginx
- [ ] `pnpm health` pass
- [ ] Login production flow OK

## Operasional

- [ ] `pnpm backup` teruji
- [ ] `pnpm restore` teruji (dry run)
- [ ] HTTPS/nginx dikonfigurasi untuk domain target

## Exit

Semua ✅ → project **prod ready** untuk pilot sekolah pertama.
