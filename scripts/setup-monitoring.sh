#!/usr/bin/env bash
# Setup production monitoring: healthchecks.io + container metrics + alerting
# Usage: bash scripts/setup-monitoring.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi

echo "=== NexSMSID V4 — Monitoring Setup ==="
echo ""

# --- 1. Generate monitoring config ---
cat > docker/cadvisor.Dockerfile << 'CADVEOF'
FROM gcr.io/cadvisor/cadvisor:v0.49.1
CADVEOF
echo "✅ cAdvisor Dockerfile created"

# --- 2. Setup healthchecks.io ping ---
if [ -n "${HEALTHCHECKS_URL:-}" ]; then
  echo "✅ Healthchecks.io URL: $HEALTHCHECKS_URL"
  echo "   Backup container will ping this URL on each backup"
else
  echo "ℹ️  Set HEALTHCHECKS_URL for external monitoring ping"
  echo "   Free: https://healthchecks.io"
fi

# --- 3. Generate alerting config ---
cat > docker/alertmanager.yml << 'ALERTEOF'
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  receiver: 'slack-default'
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: 'slack-critical'
      repeat_interval: 10m

receivers:
  - name: 'slack-default'
    slack_configs:
      - channel: '#nexsmsid-alerts'
        title: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'slack-critical'
    slack_configs:
      - channel: '#nexsmsid-critical'
        title: '🔴 CRITICAL: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
ALERTEOF
echo "✅ Alertmanager config template created (update SLACK_WEBHOOK_URL)"

# --- 4. Setup backup cron monitoring ---
if [ -n "${HEALTHCHECKS_URL:-}" ]; then
  echo ""
  echo "📋 Healthchecks.io integration aktif:"
  echo "  - Backup success → ping HEALTHCHECKS_URL"
  echo "  - Jika backup gagal → notifikasi dari healthchecks.io"
fi

# --- 5. Container health check setup ---
echo ""
echo "📋 Container Health Monitoring:"
echo "  Semua service sudah punya Docker HEALTHCHECK:"
echo "  - postgres: pg_isready setiap 10s"
echo "  - redis: redis-cli ping setiap 10s"
echo "  - api: wget /api/v1/health setiap 30s"
echo "  - web: wget / setiap 30s"
echo "  - nginx: wget /health setiap 30s"

echo ""
echo "=== Monitoring setup selesai ==="
echo ""
echo "▶️  Next steps:"
echo "  1. Set HEALTHCHECKS_URL di .env.production"
echo "  2. Untuk Slack alert, set SLACK_WEBHOOK_URL + deploy alertmanager"
echo "  3. Pantau: docker compose -f docker-compose.prod.yml logs -f backup"
echo "  4. Dashboard: http://host:8080 (cAdvisor) — tambahkan ke compose jika perlu"
