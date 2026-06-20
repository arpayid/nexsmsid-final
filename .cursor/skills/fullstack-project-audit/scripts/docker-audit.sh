#!/usr/bin/env bash
# Docker Compose audit — inspired by production hardening checklists
# (awesome-cursor-skills/adding-docker, Docker docs healthcheck/restart policies)
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

PASS=0
WARN=0
FAIL=0

ok()   { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }

echo "=== Docker Audit: $(basename "$(pwd)") ==="

# 1. Compose files exist
for f in docker-compose.yml docker-compose.prod.yml; do
  if [[ -f "$f" ]]; then ok "Found $f"; else warn "Missing $f"; fi
done

# 2. Explicit project names (avoid cross-repo collision)
for f in docker-compose.yml docker-compose.prod.yml; do
  [[ -f "$f" ]] || continue
  if grep -q '^name:' "$f" 2>/dev/null; then
    ok "$f has explicit project name: $(grep '^name:' "$f" | head -1)"
  else
    warn "$f has no top-level 'name:' — compose project may collide across repos"
  fi
done

# 3. Healthchecks on stateful services
for f in docker-compose.yml docker-compose.prod.yml; do
  [[ -f "$f" ]] || continue
  if grep -q 'healthcheck:' "$f"; then
    ok "$f defines healthcheck(s)"
  else
    warn "$f missing healthcheck blocks"
  fi
done

# 4. Prod restart policies
if [[ -f docker-compose.prod.yml ]]; then
  if grep -q 'restart: always' docker-compose.prod.yml; then
    ok "Production services use restart: always"
  else
    warn "docker-compose.prod.yml missing restart: always"
  fi
fi

# 5. Secrets not hardcoded in compose (basic scan)
for f in docker-compose.yml docker-compose.prod.yml; do
  [[ -f "$f" ]] || continue
  if grep -E 'PASSWORD:\s*[^$\{]' "$f" | grep -v 'POSTGRES_PASSWORD:\s*$' | grep -qv '\${' 2>/dev/null; then
    if [[ "$f" == "docker-compose.yml" ]]; then
      warn "$f has dev credentials inline — acceptable for local, never copy to prod"
    else
      fail "$f may contain hardcoded passwords"
    fi
  else
    ok "$f uses env interpolation for secrets (basic scan)"
  fi
done

# 6. .dockerignore prevents .env in image
if [[ -f .dockerignore ]]; then
  if grep -qE '^\.env' .dockerignore; then
    ok ".dockerignore excludes .env"
  else
    warn ".dockerignore should exclude .env*"
  fi
else
  warn "No .dockerignore found"
fi

# 7. Dockerfile non-root user (API)
if [[ -f Dockerfile.api ]]; then
  if grep -q '^USER ' Dockerfile.api; then
    ok "Dockerfile.api runs as non-root"
  else
    warn "Dockerfile.api should set USER for production"
  fi
  if grep -q 'HEALTHCHECK' Dockerfile.api; then
    ok "Dockerfile.api has HEALTHCHECK"
  else
    warn "Dockerfile.api missing HEALTHCHECK instruction"
  fi
fi

# 8. Running containers vs project naming
if command -v docker >/dev/null 2>&1; then
  echo ""
  echo "Running compose projects:"
  docker ps --format '  {{.Names}} (project={{.Label "com.docker.compose.project"}})' 2>/dev/null | head -10 || true
  if docker ps --format '{{.Label "com.docker.compose.project"}}' 2>/dev/null | grep -q 'nexsmsid-ci'; then
    fail "Legacy v3 compose project 'nexsmsid-ci' still running"
  else
    ok "No legacy nexsmsid-ci containers detected"
  fi
fi

# 9. CI services script
if [[ -f scripts/ci-services.sh ]]; then
  ok "CI services script present (scripts/ci-services.sh)"
  if grep -q 'nexsmsid-final-ci' scripts/ci-services.sh .github/workflows/ci.yml 2>/dev/null; then
    ok "CI compose project targets nexsmsid-final-ci"
  else
    warn "CI compose project name may not match v4 convention"
  fi
else
  warn "No scripts/ci-services.sh for self-hosted CI"
fi

echo ""
echo "=== Summary: PASS=$PASS WARN=$WARN FAIL=$FAIL ==="
[[ "$FAIL" -eq 0 ]]
