#!/usr/bin/env bash
# Validate .env.production before docker prod deploy.
set -euo pipefail

ENV_FILE="${1:-.env.production}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "FAIL: $ENV_FILE not found. Copy from .env.production.example"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

ENV_FILE_OVERRIDE="${ENV_FILE}.local"
if [[ -f "$ENV_FILE_OVERRIDE" ]]; then
  set -a
  source "$ENV_FILE_OVERRIDE"
  set +a
fi

fail=0

check() {
  if [[ "$1" != "1" ]]; then
    echo "❌ FAIL: $2"
    fail=1
  else
    echo "✅ OK: $2"
  fi
}

warn() {
  echo "⚠️  WARN: $1"
}

echo ""
echo "=== NexSMSID V4 — Production Env Validation ==="
echo ""

[[ "${NODE_ENV:-}" == "production" ]] && ok_node=1 || ok_node=0
check "$ok_node" "NODE_ENV=production"

[[ -n "${WEB_ORIGIN:-}" && "${WEB_ORIGIN}" != "http://localhost:3000" ]] && ok_origin=1 || ok_origin=0
check "$ok_origin" "WEB_ORIGIN is a non-localhost production URL"

[[ -n "${CORS_ORIGIN:-}" ]] && ok_cors=1 || ok_cors=0
check "$ok_cors" "CORS_ORIGIN is set"

access_len=${#JWT_ACCESS_SECRET}
refresh_len=${#JWT_REFRESH_SECRET}
[[ "$access_len" -ge 64 ]] && ok_access=1 || ok_access=0
check "$ok_access" "JWT_ACCESS_SECRET length >= 64 ($access_len)"

[[ "$refresh_len" -ge 64 ]] && ok_refresh=1 || ok_refresh=0
check "$ok_refresh" "JWT_REFRESH_SECRET length >= 64 ($refresh_len)"

[[ -n "${JWT_ACCESS_SECRET:-}" && -n "${JWT_REFRESH_SECRET:-}" && "$JWT_ACCESS_SECRET" != "$JWT_REFRESH_SECRET" ]] && ok_diff=1 || ok_diff=0
check "$ok_diff" "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET differ"

[[ -n "${TURNSTILE_SECRET_KEY:-}" ]] && ok_turnstile=1 || ok_turnstile=0
check "$ok_turnstile" "TURNSTILE_SECRET_KEY is set"

[[ -n "${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}" ]] && ok_tsite=1 || ok_tsite=0
check "$ok_tsite" "NEXT_PUBLIC_TURNSTILE_SITE_KEY is set"

[[ -n "${POSTGRES_PASSWORD:-}" && "$POSTGRES_PASSWORD" != "replace-with-strong-postgres-password" ]] && ok_pg=1 || ok_pg=0
check "$ok_pg" "POSTGRES_PASSWORD is not placeholder"

[[ -n "${REDIS_PASSWORD:-}" ]] && ok_redis=1 || ok_redis=0
check "$ok_redis" "REDIS_PASSWORD is set"

[[ -n "${DATABASE_URL:-}" ]] && ok_db=1 || ok_db=0
check "$ok_db" "DATABASE_URL is set"

[[ "${NEXT_PUBLIC_API_URL:-}" == "/api/v1" ]] && ok_api_url=1 || ok_api_url=0
check "$ok_api_url" "NEXT_PUBLIC_API_URL=/api/v1 (nginx proxy)"

[[ -n "${SENTRY_DSN:-}" ]] && ok_sentry=1 || ok_sentry=0
check "$ok_sentry" "SENTRY_DSN is set (production monitoring)"

if [[ -n "${DOMAIN:-}" ]]; then
  check "1" "DOMAIN=$DOMAIN (HTTPS will be configured)"
else
  warn "DOMAIN not set — HTTP only, no HTTPS redirect"
fi

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo "❌ Production env validation FAILED. Fix $ENV_FILE before deploy."
  exit 1
fi

echo "✅ Production env validation PASSED."
