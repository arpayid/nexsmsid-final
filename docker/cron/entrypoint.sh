#!/bin/sh
# Backup cron container — periodic pg_dump + S3 offsite + healthchecks.io ping
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-nexsmsid}"
DB_NAME="${DB_NAME:-nexsmsid}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
SCHEDULE="${SCHEDULE:-0 */6 * * *}"
HEALTHCHECKS_URL="${HEALTHCHECKS_URL:-}"
S3_BUCKET="${S3_BUCKET:-}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"

do_backup() {
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="${BACKUP_DIR}/nexsmsid_${DB_NAME}_${TIMESTAMP}.sql.gz"
    
    echo "[backup] Starting backup: $DB_NAME@$DB_HOST:$DB_PORT"
    
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        --compress=9 \
        -f "$BACKUP_FILE" 2>&1
    
    if [ -f "$BACKUP_FILE" ] && gzip -t "$BACKUP_FILE" 2>/dev/null; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "[backup] Success: $BACKUP_FILE ($SIZE)"
    else
        echo "[backup] Backup corrupted!"
        return 1
    fi
    
    # S3 upload via aws-cli atau curl
    if [ -n "$S3_BUCKET" ]; then
        if command -v aws >/dev/null 2>&1; then
            echo "[backup] Upload to S3 via aws-cli..."
            aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/$(date +%Y/%m)/" --only-show-errors 2>&1 || \
                echo "[backup] S3 upload failed"
        else
            echo "[backup] aws-cli not installed, skip S3"
            echo "[backup] Install: apk add aws-cli"
        fi
    fi
    
    # Healthchecks.io ping
    if [ -n "$HEALTHCHECKS_URL" ]; then
        curl -sf -o /dev/null "$HEALTHCHECKS_URL" 2>/dev/null || true
    fi
    
    # Rotasi backup lama
    find "$BACKUP_DIR" -name "nexsmsid_${DB_NAME}_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null
    COUNT=$(find "$BACKUP_DIR" -name "nexsmsid_${DB_NAME}_*.sql.gz" -type f | wc -l)
    echo "[backup] Active backups: $COUNT, retention: ${RETENTION_DAYS}d"
}

if [ "${1:-}" = "--once" ]; then
    do_backup
    exit $?
fi

echo "[backup] Cron scheduler started. Schedule: $SCHEDULE"
do_backup || true

echo "$SCHEDULE root /entrypoint.sh --once >> /var/log/backup-cron.log 2>&1" > /etc/crontabs/root
crond -f
