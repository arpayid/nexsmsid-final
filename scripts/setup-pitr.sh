#!/usr/bin/env bash
# Setup PostgreSQL Point-in-Time Recovery (WAL archiving)
# Usage: bash scripts/setup-pitr.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found. Run generate-prod-env.sh first."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "=== PostgreSQL PITR Setup ==="
echo ""

# WAL archiving dir on host
ARCHIVE_DIR="${PITR_ARCHIVE_DIR:-/var/lib/nexsmsid/pg_archive}"
sudo mkdir -p "$ARCHIVE_DIR"
sudo chown 999:999 "$ARCHIVE_DIR"  # postgres user UID:GID in alpine

echo "Creating PITR config override..."

cat > /tmp/pitr-postgres.conf << PITRCONF
# PITR / WAL Archiving — applied via docker-compose volume override
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/data/pg_archive/%f && cp %p /var/lib/postgresql/data/pg_archive/%f'
archive_timeout = 300
max_wal_senders = 3
wal_keep_size = 1024
PITRCONF

echo "✅ PITR config generated"
echo ""

echo "📋 Untuk mengaktifkan PITR:"
echo "  1. Mount config ke postgres container:"
echo "     volumes:"
echo "       - ./postgres-pitr.conf:/etc/postgresql/postgresql.conf:ro"
echo "       - ${ARCHIVE_DIR}:/var/lib/postgresql/data/pg_archive"
echo ""
echo "  2. Restart stack: pnpm docker:prod:up"
echo ""
echo "  3. Test archive:"
echo "     docker compose -f docker-compose.prod.yml exec postgres ls /var/lib/postgresql/data/pg_archive/"
echo ""
echo "  4. Restore dari PITR:"
echo "     # Pilih timestamp target (misal 5 menit sebelum disaster)"
echo "     TARGET_TIME='2026-06-22 10:00:00 WITA'"
echo "     # Stop app, restore:"
echo "     docker compose -f docker-compose.prod.yml stop api web"
echo "     docker compose -f docker-compose.prod.yml exec postgres sh -c"
echo "     'pg_ctl stop -D /var/lib/postgresql/data &&"
echo "      rm -rf /var/lib/postgresql/data/* &&"
echo "      pg_basebackup -R -D /var/lib/postgresql/data &&"
echo "      pg_ctl start -D /var/lib/postgresql/data'"
