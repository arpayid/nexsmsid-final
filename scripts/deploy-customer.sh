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
echo "→ Menyimpan state compose sebelumnya..."
PREV_COMPOSE=$(docker compose -f docker-compose.prod.yml ps -q 2>/dev/null || true)
PREV_STATE_SAVED=false
if [[ -n "$PREV_COMPOSE" ]]; then
  docker compose -f docker-compose.prod.yml config > /tmp/docker-compose.prev.yml 2>/dev/null || true
  docker compose -f docker-compose.prod.yml images > /tmp/docker-images.prev.txt 2>/dev/null || true
  PREV_STATE_SAVED=true
  echo "  State sebelumnya tersimpan."
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
if pnpm prod:smoke "$BASE_URL"; then
  echo ""
  echo "✅ Deploy pelanggan selesai."
else
  echo ""
  echo "❌ Smoke test gagal! Mengembalikan ke state sebelumnya..."
  if [[ "$PREV_STATE_SAVED" == true ]] && [[ -f /tmp/docker-compose.prev.yml ]]; then
    docker compose -f docker-compose.prod.yml down || true
    docker compose -f /tmp/docker-compose.prev.yml up -d
    echo "  Rollback selesai. Periksa log untuk detail."
  else
    echo "  Tidak ada state sebelumnya untuk rollback. Periksa secara manual."
  fi
  exit 1
fi
echo "   Instalasi pertama: pnpm db:seed:prod"
echo "   Pantau rutin:      pnpm health $BASE_URL"
echo "   Dokumentasi:       docs/OPERATIONS.md"
