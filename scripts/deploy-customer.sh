#!/usr/bin/env bash
# Full customer deploy: validate env → optional HTTPS nginx → build → up → migrate → smoke.
# Usage:
#   pnpm deploy:customer
#   pnpm deploy:customer https://sms.sekolah.sch.id
#   DOMAIN=sms.sekolah.sch.id pnpm deploy:customer
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
BASE_URL="${1:-}"

echo "=== NexSMSID V4 — Deploy pelanggan ==="
echo "Env: $ENV_FILE"

bash scripts/validate-prod-env.sh "$ENV_FILE"

if [[ -n "${DOMAIN:-}" ]]; then
  echo ""
  echo "→ Setup nginx HTTPS untuk DOMAIN=$DOMAIN"
  bash scripts/setup-https-domain.sh
fi

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
  echo "WARN: WEB_ORIGIN kosong — smoke memakai http://localhost"
  BASE_URL="http://localhost"
fi

echo ""
echo "→ Smoke test: $BASE_URL"
pnpm prod:smoke "$BASE_URL"

echo ""
echo "✅ Deploy pelanggan selesai."
echo "   Instalasi pertama: pnpm db:seed:prod"
echo "   Pantau rutin:      pnpm health $BASE_URL"
echo "   Dokumentasi:       docs/OPERATIONS.md"
