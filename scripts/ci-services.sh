#!/usr/bin/env bash
# Start/stop PostgreSQL + Redis for NexSMSID V4 CI on a self-hosted runner.
# Service containers in workflow `services:` are GitHub-hosted only;
# self-hosted jobs must bring up dependencies locally (Docker Compose here).
set -euo pipefail

COMPOSE_PROJECT_NAME="${CI_COMPOSE_PROJECT:-nexsmsid-final-ci}"
COMPOSE_FILE="${CI_COMPOSE_FILE:-docker-compose.yml}"
POSTGRES_USER="${POSTGRES_USER:-nexsmsid}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
TEST_DB="${CI_TEST_DATABASE:-nexsmsid_test}"

compose() {
  POSTGRES_PORT="$POSTGRES_PORT" REDIS_PORT="$REDIS_PORT" \
    docker compose -p "$COMPOSE_PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

pg_ready() {
  # Always check using Docker container to avoid confusion with host PostgreSQL
  compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d nexsmsid >/dev/null 2>&1
}

redis_ready() {
  compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG
}

services_healthy() {
  pg_ready && redis_ready
}

wait_for_postgres() {
  local attempts=60
  local i=1
  while [ "$i" -le "$attempts" ]; do
    if pg_ready; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "PostgreSQL did not become ready in time" >&2
  return 1
}

wait_for_redis() {
  local attempts=60
  local i=1
  while [ "$i" -le "$attempts" ]; do
    if redis_ready; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "Redis did not become ready in time" >&2
  return 1
}

ensure_test_database() {
  compose exec -T postgres createdb -U "$POSTGRES_USER" "$TEST_DB" 2>/dev/null || true
}

cmd="${1:-}"

case "$cmd" in
  start)
    if services_healthy; then
      ensure_test_database
      echo "CI services already running (warm start) on ports PG:${POSTGRES_PORT} Redis:${REDIS_PORT}"
      exit 0
    fi
    compose up -d postgres redis
    wait_for_postgres
    wait_for_redis
    ensure_test_database
    echo "CI services are ready (project: ${COMPOSE_PROJECT_NAME}, test DB: ${TEST_DB}, PG port: ${POSTGRES_PORT}, Redis port: ${REDIS_PORT})"
    ;;
  stop)
    if [ "${CI_KEEP_SERVICES:-0}" = "1" ]; then
      echo "Keeping CI services running (CI_KEEP_SERVICES=1)"
      exit 0
    fi
    if [ "${CI_RESET_VOLUMES:-0}" = "1" ]; then
      compose down -v --remove-orphans
    else
      compose stop postgres redis
    fi
    echo "CI services stopped (project: ${COMPOSE_PROJECT_NAME})"
    ;;
  status)
    compose ps
    ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 1
    ;;
esac
