#!/bin/bash
set -e

BASE_URL="${1:-http://127.0.0.1}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== NexSMSID Healthcheck ==="

echo -e "\n1. Web Root Check:"
curl -s -I "$BASE_URL/" | head -n 1

echo -e "\n2. API Health Check:"
curl -s -I "$BASE_URL/api/v1/health" | head -n 1
curl -s "$BASE_URL/api/v1/health"

echo -e "\n\n3. Docker Services Status:"
cd "$PROJECT_DIR" && docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "(not in Docker context)"

echo -e "\n4. Disk Space:"
df -h / | tail -1

echo -e "\n5. Backups:"
ls -lh "$PROJECT_DIR/backups" 2>/dev/null | tail -2 || echo "(no backups directory)"
