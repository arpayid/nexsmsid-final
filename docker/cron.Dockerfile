# Backup cron container — runs scheduled backups via pg_dump
FROM alpine:3.19

RUN apk add --no-cache postgresql17-client aws-cli curl bash

COPY docker/cron/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV BACKUP_DIR=/backups \
    DB_HOST=postgres \
    DB_PORT=5432 \
    DB_USER=nexsmsid \
    DB_NAME=nexsmsid \
    BACKUP_RETENTION_DAYS=30 \
    SCHEDULE="0 */6 * * *"

ENTRYPOINT ["/entrypoint.sh"]
