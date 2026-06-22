#!/bin/sh
# NexSMSID API entrypoint — apply pending DB migrations, then start the server.
# `prisma migrate deploy` is idempotent and takes a DB advisory lock, so it is
# safe even when multiple API replicas start concurrently.
set -e

cd /app/apps/api

echo "[api] Applying database migrations (prisma migrate deploy)..."
prisma migrate deploy --schema prisma/schema.prisma

cd /app
echo "[api] Migrations applied. Starting API..."
exec "$@"
