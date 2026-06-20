---
name: codebase-onboarding
description: Explores codebase architecture, data models, APIs, auth, and deployment in parallel, then synthesizes an onboarding document. Use when onboarding to a new repo or generating project overview.
origin: spencerpauly/awesome-cursor-skills
---

# Codebase Onboarding

Generate onboarding doc by exploring in parallel.

## Workflow

### 1. Parallel exploration areas

| Agent        | Focus                                  |
| ------------ | -------------------------------------- |
| Architecture | Monorepo structure, frameworks, config |
| Data models  | Prisma schema, migrations, seeds       |
| API          | Controllers, routes, auth per endpoint |
| Auth         | JWT, RBAC, middleware, portals         |
| Deployment   | Docker, CI, env vars, local dev        |

### 2. Synthesize to markdown

Sections: Quick Start, Architecture, Data Models, API, Auth, Deployment, Key Files, Gotchas.

### 3. For NexSMSID V4

Use existing artifacts instead of re-exploring from scratch when available:

- `.cursor/audit/ROADMAP.md`
- `.cursor/workflow/STATUS.md`
- `.cursor/skills/nexsmsid-v4/modules.md`
- `README.md`, `.github/SELF_HOSTED_RUNNER.md`

Write output to `.cursor/audit/ONBOARDING.md` unless user specifies otherwise.
