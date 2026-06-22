#!/usr/bin/env bash
# Generate secure production .env.production from template.
# Usage: bash scripts/generate-prod-env.sh [domain]
set -euo pipefail

DOMAIN="${1:-}"
ENV_FILE=".env.production"
EXAMPLE=".env.production.example"

if [[ ! -f "$EXAMPLE" ]]; then
  echo "❌ $EXAMPLE not found. Run from project root."
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  echo "⚠️  $ENV_FILE already exists. Overwrite? (y/N)"
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Generate secrets
POSTGRES_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
REDIS_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_ACCESS=$(openssl rand -base64 64)
JWT_REFRESH=$(openssl rand -base64 64)

cp "$EXAMPLE" "$ENV_FILE"

# Replace placeholders (macOS/BSD vs Linux sed)
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s|replace-with-strong-postgres-password|$POSTGRES_PASS|g" "$ENV_FILE"
  sed -i '' "s|replace-with-strong-redis-password|$REDIS_PASS|g" "$ENV_FILE"
  sed -i '' "s|replace-with-openssl-rand-base64-64-chars-minimum-for-access-token|$JWT_ACCESS|g" "$ENV_FILE"
  sed -i '' "s|replace-with-openssl-rand-base64-64-chars-minimum-for-refresh-token|$JWT_REFRESH|g" "$ENV_FILE"
else
  sed -i "s|replace-with-strong-postgres-password|$POSTGRES_PASS|g" "$ENV_FILE"
  sed -i "s|replace-with-strong-redis-password|$REDIS_PASS|g" "$ENV_FILE"
  sed -i "s|replace-with-openssl-rand-base64-64-chars-minimum-for-access-token|$JWT_ACCESS|g" "$ENV_FILE"
  sed -i "s|replace-with-openssl-rand-base64-64-chars-minimum-for-refresh-token|$JWT_REFRESH|g" "$ENV_FILE"
fi

# Set domain jika diberikan
if [[ -n "$DOMAIN" ]]; then
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|https://sms.sekolah-contoh.sch.id|https://$DOMAIN|g" "$ENV_FILE"
    sed -i '' "s|WEB_ORIGIN=.*|WEB_ORIGIN=https://$DOMAIN|" "$ENV_FILE"
    sed -i '' "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|" "$ENV_FILE"
    sed -i '' "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" "$ENV_FILE"
  else
    sed -i "s|https://sms.sekolah-contoh.sch.id|https://$DOMAIN|g" "$ENV_FILE"
    sed -i "s|WEB_ORIGIN=.*|WEB_ORIGIN=https://$DOMAIN|" "$ENV_FILE"
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|" "$ENV_FILE"
    sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" "$ENV_FILE"
  fi
fi

echo ""
echo "✅ Production env generated: $ENV_FILE"
echo ""
echo "📋 Ringkasan secrets (simpan aman!):"
echo "   POSTGRES_PASSWORD:      $POSTGRES_PASS"
echo "   REDIS_PASSWORD:         $REDIS_PASS"
echo "   JWT_ACCESS_SECRET:      ${JWT_ACCESS:0:20}...${JWT_ACCESS: -8}"
echo "   JWT_REFRESH_SECRET:     ${JWT_REFRESH:0:20}...${JWT_REFRESH: -8}"
if [[ -n "$DOMAIN" ]]; then
  echo "   DOMAIN:                 $DOMAIN"
fi
echo ""
echo "▶️  Selanjutnya: pnpm validate:prod-env && pnpm docker:prod:build"
