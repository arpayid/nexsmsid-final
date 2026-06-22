#!/usr/bin/env bash
# Clone NexSMSID instance for new customer (multi-tenancy per stack)
# Usage: bash scripts/clone-instance.sh sms.smkbisa.sch.id /opt/nexsmsid/smkbisa
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: bash scripts/clone-instance.sh <domain> <target_dir>"
  echo ""
  echo "Example:"
  echo "  bash scripts/clone-instance.sh sms.smkbisa.sch.id /opt/nexsmsid/smkbisa"
  exit 1
fi

DOMAIN="$1"
TARGET_DIR="$2"
SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== NexSMSID V4 — Clone Instance ==="
echo "Domain:      $DOMAIN"
echo "Target:      $TARGET_DIR"
echo "Source:      $SOURCE_DIR"
echo ""

# --- 1. Clone repo ---
echo "→ Cloning to $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
rsync -a --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='dist' \
  --exclude='.turbo' --exclude='backups/*' --exclude='storage/*' \
  --exclude='.env*' --exclude='*.log' \
  "$SOURCE_DIR/" "$TARGET_DIR/"
echo "✅ Source cloned"

# --- 2. Generate secrets ---
echo ""
echo "→ Generating production secrets..."
cd "$TARGET_DIR"
bash scripts/generate-prod-env.sh "$DOMAIN"
echo "✅ Secrets generated"

# --- 3. Generate nginx HTTPS config ---
echo ""
echo "→ Setting up nginx..."
if [ -n "$DOMAIN" ]; then
  export DOMAIN
  bash scripts/setup-https-domain.sh 2>/dev/null || true
fi
echo "✅ Nginx configured"

# --- 4. Generate docker-compose override for this instance ---
echo ""
echo "→ Creating docker-compose.override.yml..."
cat > docker-compose.override.yml << OVERRIDE
# Per-instance override — unique project name + port mapping
name: nexsmsid-$(echo "$DOMAIN" | tr '.' '-' | tr '_' '-')

services:
  nginx:
    ports:
      - "${HTTP_PORT:-80}:80"
      - "${HTTPS_PORT:-443}:443"
OVERRIDE
echo "✅ Override created"

# --- 5. Create systemd service (optional) ---
echo ""
echo "→ Creating systemd service template..."
cat > /tmp/nexsmsid@"$(echo "$DOMAIN" | tr '.' '-')".service << SYSTEMD
[Unit]
Description=NexSMSID V4 — $DOMAIN
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$TARGET_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml -f docker-compose.override.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml -f docker-compose.override.yml down
ExecReload=/usr/bin/docker compose -f docker-compose.prod.yml -f docker-compose.override.yml restart

[Install]
WantedBy=multi-user.target
SYSTEMD

echo "✅ Systemd service template created (optional: cp to /etc/systemd/system/)"

# --- 6. Summary ---
echo ""
echo "=== Clone selesai ==="
echo ""
echo "📋 Ringkasan Instalasi:"
echo "  Domain:     $DOMAIN"
echo "  Direktori:  $TARGET_DIR"
echo ""
echo "▶️  Untuk deploy:"
echo "  cd $TARGET_DIR"
echo "  pnpm docker:prod:build"
echo "  pnpm docker:prod:up"
echo "  pnpm db:migrate:prod"
echo "  pnpm db:seed:prod"
echo "  pnpm health https://$DOMAIN"
echo ""
echo "▶️  Untuk update:"
echo "  cd $TARGET_DIR && git pull && pnpm docker:prod:build && pnpm docker:prod:up && pnpm db:migrate:prod"
echo ""
echo "▶️  Monitoring:"
echo "  docker compose -f docker-compose.prod.yml ps"
echo "  docker compose -f docker-compose.prod.yml logs -f --tail=50"
