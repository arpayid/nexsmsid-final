#!/bin/bash
# Restore PostgreSQL from backup.
# Usage: bash scripts/restore-postgres.sh [backup_file]
#   backup_file: path ke file .sql.gz di direktori backups/
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE="${ENV_FILE:-.env.production}"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.production not found"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

BACKUP_FILE="${1:-}"
BACKUP_DIR="${PROJECT_DIR}/backups"

if [ -z "$BACKUP_FILE" ]; then
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "(no backups found)"
  echo ""
  echo "Usage: bash scripts/restore-postgres.sh backups/nexsmsid_20260622_120000.sql.gz"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Extract DB info from DATABASE_URL
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-nexsmsid}"
DB_USER="${DB_USER:-nexsmsid}"

echo "⚠️  WARNING: This will OVERWRITE the database '$DB_NAME' on '$DB_HOST'"
echo "   Backup file: $BACKUP_FILE"
echo ""
echo "   Type 'RESTORE' to confirm:"
read -r confirm
if [ "$confirm" != "RESTORE" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "=== Restoring database ==="

# Stop API & web during restore
echo "→ Stopping API & web services..."
docker compose -f docker-compose.prod.yml stop api web 2>/dev/null || true

# Restore
echo "→ Restoring from $BACKUP_FILE..."
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  File size: $SIZE"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --quiet 2>&1
else
  PGPASSWORD="${POSTGRES_PASSWORD}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$BACKUP_FILE" \
    --quiet 2>&1
fi

echo "✅ Restore completed"

# Restart services
echo "→ Restarting services..."
docker compose -f docker-compose.prod.yml start api web 2>/dev/null || true

echo ""
echo "✅ Database restore selesai. Verifikasi: pnpm health"
