#!/usr/bin/env bash
# Run Prisma migrate deploy against the production Postgres via the API container.
# DATABASE_URL in .env.production uses the Docker service hostname `postgres`, so
# migrate must run inside the prod network — not from the host with pnpm alone.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose --env-file .env.production -f docker-compose.prod.yml)

if ! "${COMPOSE[@]}" ps --status running --services api 2>/dev/null | grep -qx api; then
  echo "Error: prod API container is not running. Run: pnpm docker:prod:up" >&2
  exit 1
fi

# Note: the API container already runs `prisma migrate deploy` on startup.
# This script is for manually re-applying migrations without a restart.
echo "=== NexSMSID prod migrate deploy (API container) ==="
"${COMPOSE[@]}" exec -T api sh -c 'cd /app/apps/api && prisma migrate deploy --schema prisma/schema.prisma'
