#!/usr/bin/env bash
# Full customer deploy: validate env → build → up → migrate → smoke.
# Usage:
#   bash scripts/deploy-customer.sh
#   DOMAIN=sms.sekolah.sch.id bash scripts/deploy-customer.sh
#   PORT=8080 bash scripts/deploy-customer.sh  # custom HTTP port
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
BASE_URL="${1:-}"

echo "=== NexSMSID V4 — Deploy pelanggan ==="
echo "Env: $ENV_FILE"

bash scripts/validate-prod-env.sh "$ENV_FILE"

echo ""
echo "→ Docker build..."
pnpm docker:prod:build

echo ""
echo "→ Docker up..."
pnpm docker:prod:up

echo ""
echo "→ Database migrate..."
pnpm db:migrate:prod

if [[ -z "$BASE_URL" ]]; then
  BASE_URL=$(grep -E '^WEB_ORIGIN=' "$ENV_FILE" | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
fi

if [[ -z "$BASE_URL" ]]; then
  BASE_URL="http://localhost"
fi

echo ""
echo "→ Smoke test: $BASE_URL"
if pnpm prod:smoke "$BASE_URL"; then
  echo ""
  echo "✅ Deploy pelanggan selesai."
else
  echo ""
  echo "❌ Smoke test gagal! Periksa log: docker compose -f docker-compose.prod.yml logs"
  exit 1
fi

echo ""
echo "📋 Post-deploy:"
echo "   Health check:    pnpm health $BASE_URL"
echo "   Lihat log API:   docker compose -f docker-compose.prod.yml logs -f api"
echo "   Lihat log web:   docker compose -f docker-compose.prod.yml logs -f web"
echo "   Backup DB:       pnpm backup"
echo "   Instalasi pertama: pnpm db:seed:prod"
echo "   Dokumentasi:       cat docs/OPERATIONS.md"
