#!/usr/bin/env bash
# Prepare production HTTPS nginx config from domain env vars.
# Usage: DOMAIN=sekolah.example.com bash scripts/setup-https-domain.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${DOMAIN:-}"

if [ -z "$DOMAIN" ]; then
  echo "ERROR: Set DOMAIN=your-domain.com"
  exit 1
fi

SRC="$PROJECT_DIR/docker/nginx/conf.d/https.conf.example"
DEST="$PROJECT_DIR/docker/nginx/conf.d/https.conf"

sed "s/your-domain.com/$DOMAIN/g" "$SRC" > "$DEST"

echo "Wrote $DEST for domain $DOMAIN"
echo "Next:"
echo "  1. certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
echo "  2. Update .env.production WEB_ORIGIN/CORS_ORIGIN/NEXT_PUBLIC_APP_URL to https://$DOMAIN"
echo "  3. pnpm docker:prod:up && reload nginx"
