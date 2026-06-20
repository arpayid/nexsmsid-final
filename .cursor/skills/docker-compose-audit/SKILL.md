---
name: docker-compose-audit
description: Audits Docker Compose and Dockerfile setups for healthchecks, secret handling, non-root users, project isolation, and production hardening. Use when dockerizing, reviewing docker-compose.yml, Dockerfile, CI Docker services, or infrastructure audit of containerized apps.
metadata:
  references:
    - awesome-cursor-skills/adding-docker
    - Docker docs healthcheck restart policies
compatibility: Requires docker, docker compose, bash
---

# Docker Compose Audit

Pola profesional dari [awesome-cursor-skills/adding-docker](https://github.com/spencerpauly/awesome-cursor-skills) dan Docker production checklists.

## Quick audit (jalankan dulu)

```bash
.cursor/skills/fullstack-project-audit/scripts/docker-audit.sh .
```

Exit 0 = pass. WARN = review manual. FAIL = perbaiki sebelum deploy.

## Checklist manual

```
Infrastructure:
- [ ] docker-compose.yml + docker-compose.prod.yml ada
- [ ] Top-level `name:` eksplisit (hindari bentrok antar repo)
- [ ] Healthcheck di postgres, redis, app services
- [ ] Prod: restart: always + depends_on condition: service_healthy

Security:
- [ ] .dockerignore mengecualikan .env*
- [ ] Prod secrets via ${VAR} — tidak hardcode di compose prod
- [ ] Dockerfile USER non-root untuk runtime
- [ ] Tidak COPY .env ke image

CI self-hosted:
- [ ] scripts/ci-services.sh untuk Postgres/Redis lokal
- [ ] Compose project CI terisolasi (mis. nexsmsid-final-ci)
- [ ] CI_KEEP_SERVICES untuk warm start (opsional)

Production:
- [ ] HEALTHCHECK di Dockerfile atau compose healthcheck
- [ ] Volume persistence untuk DB + storage
- [ ] Nginx/reverse proxy + TLS path dikonfigurasi
```

## NexSMSID V4 conventions

| Context | Compose project |
|---------|-----------------|
| Dev | `nexsmsid-final` |
| CI | `nexsmsid-final-ci` |
| Prod | `nexsmsid-final-prod` |

Jangan gunakan `nexsmsid-ci` (legacy).

## Temuan umum & fix

| Finding | Fix |
|---------|-----|
| Missing healthcheck | Tambah `healthcheck` + `depends_on: condition: service_healthy` |
| No project name | Tambah `name: <project>` di top compose file |
| Hardcoded prod password | Pindah ke `.env` + `${POSTGRES_PASSWORD}` |
| Root container user | `RUN adduser` + `USER` di Dockerfile |
| Missing HEALTHCHECK | `HEALTHCHECK CMD wget -qO- http://127.0.0.1:4000/api/v1/health` |

## Multi-stage Dockerfile pattern (Node monorepo)

```
builder → install + build workspace package
runner  → prod deps only + dist + prisma generate + non-root USER
```

Lihat `Dockerfile.api` di project ini sebagai referensi.

## Referensi

- Script audit: [../fullstack-project-audit/scripts/docker-audit.sh](../fullstack-project-audit/scripts/docker-audit.sh)
- OWASP container: recommend `trivy image` untuk scan image production
