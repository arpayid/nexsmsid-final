#!/bin/bash
set -e

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-nexsmsid}"
DB_USER="${POSTGRES_USER:-nexsmsid}"
CONTAINER_NAME=$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null || true)

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file $BACKUP_FILE not found."
  exit 1
fi

if [ -z "$CONTAINER_NAME" ]; then
  echo "Error: Postgres container not found. Is the production stack running?"
  exit 1
fi

echo "Warning: This will overwrite the current database: $DB_NAME"
read -r -p "Are you sure? (y/N) " confirm
if [[ $confirm != [yY] ]]; then
  echo "Aborted."
  exit 0
fi

echo "Restoring database from $BACKUP_FILE..."

cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME"

echo "Restore successful!"
