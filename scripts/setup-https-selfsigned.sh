#!/usr/bin/env bash
# Self-signed HTTPS is now generated automatically by the nginx container
# whenever DOMAIN is set and no real cert exists in the nginx_ssl volume.
#
# This script remains only to generate a self-signed cert on the host for
# local TLS smoke tests outside Docker. For the Docker stack, just set DOMAIN.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CN="${1:-localhost}"
SSL_DIR="$PROJECT_DIR/docker/nginx/ssl/selfsigned"

mkdir -p "$SSL_DIR"

if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
  echo "Generating self-signed certificate for CN=$CN ..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/CN=$CN/O=NexSMSID/C=ID"
  echo "Wrote $SSL_DIR/{fullchain,privkey}.pem"
else
  echo "Cert already exists at $SSL_DIR/fullchain.pem"
fi

echo ""
echo "For the Docker production stack you do NOT need this script:"
echo "  set DOMAIN=<host> in .env.production and nginx auto-generates a self-signed cert."
