---
name: fullstack-project-audit
description: Audits unfamiliar fullstack projects end-to-end — architecture discovery, environment setup, automated quality gates, security review, smoke tests, and risk register. Use when onboarding a new codebase, assessing bugs/readiness, pre-deploy review, or when the user asks to audit, review, or evaluate a project.
---

# Fullstack Project Audit

## Prinsip

Urutan aman: **pahami → jalankan → ukur → temukan risiko → laporkan**. Jangan refactor sebelum audit selesai.

Setiap temuan beri severity: **blocker** | **warning** | **nit**.

## Fase 1 — Discovery (30–60 menit)

Baca tanpa mengubah kode:

1. `README`, root `package.json` / `pyproject.toml` / `go.mod`
2. Struktur folder (monorepo vs single app)
3. CI config (`.github/workflows/`, `.gitlab-ci.yml`)
4. Env template (`.env.example`)
5. Docker / deploy (`docker-compose*`, `Dockerfile`, k8s manifests)
6. Database layer (migrations, ORM schema)

**Output:** stack summary, entry points (dev command, ports), daftar modul/domain bisnis.

## Fase 2 — Infrastructure (15–30 menit)

```bash
docker ps
ss -tlnp | grep -E '3000|4000|5432|6379|8080'
```

**Docker projects (jika ada):** jalankan script audit:

```bash
.cursor/skills/fullstack-project-audit/scripts/docker-audit.sh .
```

Atau muat skill `docker-compose-audit` untuk checklist mendalam.

Checklist:

- [ ] `.env` ada dan secret production tidak hardcoded
- [ ] DB + cache (jika dipakai) reachable
- [ ] Dev server bisa start (`npm/pnpm/yarn dev` atau setara)
- [ ] Login / auth dasar berfungsi (jika ada)

**Output:** environment matrix (hijau/merah per service).

## Fase 3 — Automated signals (30–45 menit)

Jalankan pipeline setara CI lokal:

```bash
# Sesuaikan dengan project
<install>
<lint>
<typecheck>
<unit-test>
<build>
<integration-test>   # jika ada
<audit / security-scan>
```

Catat pass/fail per langkah. CI remote = sumber kebenaran jika ada.

**Output:** tabel hasil otomatis + daftar vulnerability/deprecation.

## Fase 4 — Security review (45–60 menit)

Muat pola dari skill `docker-compose-audit` (secrets di image) dan checklist OWASP (lihat [awesome-cursor-skills/auditing-security](https://github.com/spencerpauly/awesome-cursor-skills)).

Prioritas (adaptasi ke stack):

| Area | Cek |
|------|-----|
| Auth | Token storage, refresh rotation, session invalidation |
| Authorization | Setiap endpoint protected punya guard/role check eksplisit |
| Input | Validasi DTO/schema, SQL injection, XSS, path traversal |
| Upload | MIME/size/path sandbox |
| Config | Secret min length, production env validation |
| Public routes | Rate limit, captcha, data leakage |
| Frontend | Middleware/route guard, open redirect, CSRF |

**Output:** temuan security dengan severity + file path.

## Fase 5 — Smoke test manual (60–90 menit)

Uji alur kritikal end-to-end:

1. Login / register
2. Dashboard utama per role
3. Satu CRUD per domain bisnis inti
4. Satu alur transaksi (payment, order, submission — jika ada)
5. Portal/role isolation (user A tidak akses data user B)

Catat: error HTTP, UI kosong padahal API 200, form tanpa feedback.

**Output:** bug repro steps + screenshot/log jika perlu.

## Fase 6 — Technical debt (30 menit)

Cari sinyal:

- `TODO`, `FIXME`, `@deprecated`, dead code
- Test coverage gap di modul kritikal
- Dependency outdated / audit failures
- Inkonsistensi pola (dua cara CRUD, dua auth flow)
- Dokumentasi setup vs realitas (CI runner, compose project name)

**Output:** backlog teknis terprioritasi.

## Fase 7 — Risk register

Template laporan akhir:

```markdown
# Audit Report — [Project Name] — [Date]

## Executive summary
[2–3 kalimat: siap/tidak siap dikerjakan/deploy]

## Environment
| Service | Status | Notes |

## Automated checks
| Step | Result |

## Security findings
| ID | Area | Finding | Severity | Status |

## Smoke test
| Flow | Result | Notes |

## Technical debt
| Item | Priority |

## Recommended next steps
1. [Blocker fixes]
2. [Warnings]
3. [Nice-to-have]
```

## Kriteria "siap dikerjakan"

- [ ] Dev environment jalan + health check OK
- [ ] CI hijau atau kegagalan terdokumentasi + ada rencana fix
- [ ] Login + 1 CRUD per modul utama berhasil
- [ ] Tidak ada security **blocker** terbuka
- [ ] Risk register disepakati

## Anti-patterns saat audit

- Jangan langsung rewrite arsitektur
- Jangan commit `.env` atau secret
- Jangan asumsikan CI hijau tanpa cek run terbaru
- Jangan skip smoke test karena unit test pass
- Jangan campur temuan audit dengan feature request baru

## Template kerja (3 hari)

| Hari | Fokus |
|------|-------|
| 1 | Discovery + Infra + Automated |
| 2 | Security + Smoke test admin/core |
| 3 | Portal/role lain + debt + risk register |

## Referensi

- Checklist per stack: [stacks.md](stacks.md)
- Docker audit script: [scripts/docker-audit.sh](scripts/docker-audit.sh)
- NexSMSID orchestrator: [../nexsmsid-project-audit/SKILL.md](../nexsmsid-project-audit/SKILL.md)
