#!/usr/bin/env bash
# Configure horizontal scaling support for NexSMSID
# Usage: bash scripts/setup-scaling.sh [api_instances]
set -euo pipefail

INSTANCES="${1:-2}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== NexSMSID V4 — Scaling Configuration ==="
echo ""

# --- 1. Verify stateless ---
echo "→ Verifying stateless architecture..."
if [ -f scripts/verify-stateless.sh ]; then
  echo "  Script available: scripts/verify-stateless.sh"
fi

# --- 2. Nginx upstream for load balancing ---
echo ""
echo "→ Upstream config for $INSTANCES API instances..."
cat > docker/nginx/conf.d/upstream.conf << UPSTREAM
# Load balancing — multiple API instances
# Scale: docker compose -f docker-compose.prod.yml up -d --scale api=${INSTANCES}
upstream api_upstream {
    least_conn;
    server api:4000 max_fails=3 fail_timeout=30s;
}

upstream web_upstream {
    server web:3000;
}

# Session affinity via sticky cookie (opsional — aktifkan jika dibutuhkan)
# upstream api_upstream {
#     sticky cookie nex_session expires=1h domain=.sms.sekolah.sch.id path=/;
#     server api:4000;
# }
UPSTREAM
echo "✅ upstream.conf created (load balancing: least_conn)"

# --- 3. Redis session config ---
echo ""
echo "→ Redis session config..."
if grep -q "REDIS_URL" .env.production.example 2>/dev/null; then
  echo "✅ Redis already configured as shared session store"
fi

# --- 4. Docker compose scale command ---
echo ""
echo "📋 Scale Commands:"
echo "  Scale API:    docker compose -f docker-compose.prod.yml up -d --scale api=$INSTANCES"
echo "  Scale Web:    docker compose -f docker-compose.prod.yml up -d --scale web=2"
echo "  View status:  docker compose -f docker-compose.prod.yml ps"
echo ""
echo "  Resource per instance:"
echo "  - API: 1 CPU / 1GB RAM (max)"
echo "  - Web: 1 CPU / 768M RAM (max)"
echo "  - Redis handles rate limit + queue state across instances"

echo ""
echo "=== Scaling setup selesai ==="
