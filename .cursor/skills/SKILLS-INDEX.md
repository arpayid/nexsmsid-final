# NexSMSID V4 — Skills Index

Manifest semua skill untuk project ini. **Lokal only — tidak di-commit.**

## Entry points

| Skill                    | Path                                           | Kapan                                    |
| ------------------------ | ---------------------------------------------- | ---------------------------------------- |
| **nexsmsid-v4-workflow** | `.cursor/skills/nexsmsid-v4-workflow/SKILL.md` | **Sebelum pengerjaan** — fase, D→P→I→V→R |
| **nexsmsid-v4-master**   | `.cursor/skills/nexsmsid-v4-master/SKILL.md`   | Routing skill & peta project             |

Workflow docs: `.cursor/workflow/WORKFLOW.md` · Status: `.cursor/workflow/STATUS.md`

## Skill lokal (`.cursor/skills/`)

| Skill                   | Sumber                | Fokus                                     |
| ----------------------- | --------------------- | ----------------------------------------- |
| nexsmsid-v4-workflow    | Dibuat lokal          | Fase 0–4, task cycle, git/CI rules        |
| nexsmsid-v4             | Dibuat lokal          | Konvensi develop, bootstrap, quality gate |
| nexsmsid-v4-master      | Dibuat lokal          | Orchestrator seluruh project              |
| nexsmsid-project-audit  | Dibuat lokal          | Audit E2E + roadmap                       |
| fullstack-project-audit | Dibuat lokal          | Framework audit 7 fase                    |
| docker-compose-audit    | Dibuat lokal          | Container hardening                       |
| auditing-security       | awesome-cursor-skills | OWASP, secrets, RBAC                      |
| codebase-onboarding     | awesome-cursor-skills | Onboarding doc paralel                    |

Supporting files:

- `nexsmsid-v4/modules.md` — peta domain API
- `fullstack-project-audit/scripts/docker-audit.sh` — script audit Docker

## Skill eksternal (`.agents/skills/` — skills.sh)

Diinstal via `npx skills add <repo@skill> -a cursor -y`:

| Skill                      | Repo sumber                        | Installs (skills.sh) |
| -------------------------- | ---------------------------------- | -------------------- |
| nestjs-best-practices      | kadajett/agent-nestjs-skills       | ~19K                 |
| nextjs-app-router-patterns | wshobson/agents                    | ~21K                 |
| prisma-database-setup      | prisma/skills                      | ~12K                 |
| prisma-client-api          | prisma/skills                      | ~11K                 |
| turborepo                  | vercel/turborepo                   | ~38K                 |
| docker-expert              | sickn33/antigravity-awesome-skills | ~20K                 |
| docker-patterns            | affaan-m/everything-claude-code    | ~6K                  |
| vitest                     | antfu/skills                       | ~23K                 |
| github-actions             | dalestudy/skills                   | ~600                 |

List terpasang: `npx skills list`

## Sumber referensi eksternal

| Platform                   | URL                                                   | Catatan                                 |
| -------------------------- | ----------------------------------------------------- | --------------------------------------- |
| skills.sh                  | https://skills.sh                                     | Registry skill untuk Cursor/Claude Code |
| everything-claude-code     | https://github.com/affaan-m/everything-claude-code    | ECC patterns (docker-patterns)          |
| awesome-cursor-skills      | https://github.com/spencerpauly/awesome-cursor-skills | auditing-security, codebase-onboarding  |
| antigravity-awesome-skills | https://github.com/sickn33/antigravity-awesome-skills | docker-expert                           |

## Menambah skill baru

```bash
# Cari di skills.sh, lalu install:
npx skills add <owner/repo@skill-name> -a cursor -y

# Atau buat lokal:
# .cursor/skills/<nama-skill>/SKILL.md
# Update SKILLS-INDEX.md dan nexsmsid-v4-master/SKILL.md
```

## Git ignore

Skill dan audit docs sengaja lokal. Jangan commit kecuali user minta:

- `.cursor/skills/`
- `.cursor/audit/`
- `.agents/skills/`
