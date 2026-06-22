# Backup cron container — pg_dump + S3 + healthchecks.io
FROM alpine:3.21

# Install packages — postgresql-client for pg_dump, aws-cli for S3
RUN apk add --no-cache \
    postgresql16-client \
    curl \
    bash \
    && if command -v aws >/dev/null 2>&1; then \
         echo "aws-cli already available"; \
       else \
         apk add --no-cache aws-cli 2>/dev/null || \
         echo "aws-cli not in repo, will use curl for S3"; \
       fi

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
