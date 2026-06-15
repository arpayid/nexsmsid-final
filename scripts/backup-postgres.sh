#!/bin/bash
set -e

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
DB_NAME="${POSTGRES_DB:-nexsmsid}"
DB_USER="${POSTGRES_USER:-nexsmsid}"
CONTAINER_NAME=$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null || true)

if [ -z "$CONTAINER_NAME" ]; then
  echo "Error: Postgres container not found. Is the production stack running?"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup for database: $DB_NAME..."

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "Backup successful: $BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Keep only last 30 backups
ls -t "$BACKUP_DIR/backup_${DB_NAME}"_*.sql 2>/dev/null | tail -n +31 | xargs rm -- 2>/dev/null || true
