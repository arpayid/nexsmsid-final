#!/usr/bin/env bash
# Prod smoke test — health, auth, admin + portal API modules.
# Usage: bash scripts/prod-smoke.sh [BASE_URL]
set -euo pipefail

BASE_URL="${1:-http://localhost}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

# Self-signed staging certs (setup-https-selfsigned.sh) need -k
CURL_OPTS=()
if [[ "$BASE_URL" == https://* ]]; then
  CURL_OPTS=(-k)
fi
curl_cmd() { curl "${CURL_OPTS[@]}" "$@"; }

pass=0
fail=0

ok() {
  echo "✅ $1"
  pass=$((pass + 1))
}

bad() {
  echo "❌ $1"
  fail=$((fail + 1))
}

echo "=== NexSMSID Prod Smoke ==="
echo "Base: $BASE_URL"
echo ""

echo "--- Health ---"
root_code=$(curl_cmd -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
[ "$root_code" = "200" ] && ok "GET / → $root_code" || bad "GET / → $root_code"

health_body=$(curl_cmd -s "$BASE_URL/api/v1/health")
echo "$health_body" | grep -q '"status":"ok"' && ok "GET /api/v1/health" || bad "GET /api/v1/health: $health_body"

echo ""
echo "--- Auth redirect ---"
loc=$(curl_cmd -s -o /dev/null -w "%{redirect_url}" "$BASE_URL/admin")
echo "$loc" | grep -q "login" && ok "/admin → login" || bad "/admin redirect: $loc"

echo ""
echo "--- Superadmin ---"
login_body=$(curl_cmd -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@nexsmsid.dev","password":"ChangeMe123!"}')
echo "$login_body" | grep -q '"success":true' && ok "superadmin login" || bad "superadmin login: $login_body"

for ep in \
  "/api/v1/library/categories?limit=5" \
  "/api/v1/library/shelves?limit=5" \
  "/api/v1/hr/positions?limit=5" \
  "/api/v1/payroll/components?limit=5" \
  "/api/v1/exams/types?limit=5" \
  "/api/v1/inventory/items?limit=5" \
  "/api/v1/ppdb/registrations?limit=5"; do
  code=$(curl_cmd -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE_URL$ep")
  [ "$code" = "200" ] && ok "$ep → $code" || bad "$ep → $code"
done

echo ""
echo "--- Portal logins ---"
for cred in "guru@nexsmsid.dev" "siswa@nexsmsid.dev" "wali@nexsmsid.dev"; do
  body=$(curl_cmd -s -X POST "$BASE_URL/api/v1/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$cred\",\"password\":\"ChangeMe123!\"}")
  echo "$body" | grep -q '"success":true' && ok "login $cred" || bad "login $cred"
  sleep 1
done

echo ""
echo "--- Portal routes (unauthenticated redirect) ---"
for r in "/student/grades" "/teacher/attendance" "/guardian/children"; do
  code=$(curl_cmd -s -o /dev/null -w "%{http_code}" "$BASE_URL$r")
  if [ "$code" = "307" ] || [ "$code" = "308" ]; then
    ok "$r → redirect $code"
  else
    bad "$r → $code"
  fi
done

echo ""
echo "=== SUMMARY: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
