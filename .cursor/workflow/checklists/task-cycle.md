# Checklist — Siklus Task (D→P→I→V→R)

Gunakan untuk **setiap** task pengembangan setelah Fase 1 selesai.

## D — Discover

- [ ] Baca `STATUS.md` — fase & blocker
- [ ] Muat skill via `nexsmsid-final-master` routing
- [ ] Identifikasi file/modul terkait (`modules.md`)
- [ ] Scope jelas — tanya user jika ambigu

## P — Plan

- [ ] Daftar file yang akan diubah
- [ ] Cek kebutuhan: Prisma migration? Permission baru? api-client? Halaman web?
- [ ] Task besar: ringkas plan ke user sebelum coding

## I — Implement

- [ ] Minimal diff — tidak ubah kode tidak terkait
- [ ] Pola `nexsmsid-final`: DTO Zod, service base class, `@RequirePermissions`
- [ ] api-client domain method jika endpoint baru
- [ ] Halaman web jika fitur UI

## V — Verify

Pilih tier sesuai scope (lihat WORKFLOW.md):

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm --filter @nexsmsid/api test`
- [ ] `pnpm build`
- [ ] `pnpm validate:integration` (jika sentuh API/DB)
- [ ] `pnpm audit --audit-level high` (jika ubah dependencies)

## R — Report

- [ ] Ringkas perubahan + hasil test ke user
- [ ] Update `STATUS.md` jika selesai fase/blocker/backlog
- [ ] Commit hanya jika user minta
- [ ] PR hanya jika user minta
- [ ] Deploy prod pilot: setelah merge web/API → `docker:prod:build` + `docker:prod:up`
