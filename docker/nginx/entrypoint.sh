#!/bin/sh
# Agentfull nginx entrypoint — runs BEFORE nginx starts (via /docker-entrypoint.d/)
# Handles: env var substitution + self-signed SSL generation

set -e

# Generate self-signed SSL cert jika DOMAIN diset tapi cert belum ada
if [ -n "$DOMAIN" ] && [ ! -f /etc/nginx/ssl/fullchain.pem ]; then
    echo "[agentfull] Generating self-signed SSL cert for $DOMAIN..."
    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/CN=$DOMAIN/O=NexSMSID/C=ID" 2>/dev/null
    echo "[agentfull] Self-signed cert created"
fi

# Substitusi DOMAIN di https.conf template
if [ -f /etc/nginx/conf.d/https.conf.example ] && [ -n "$DOMAIN" ]; then
    echo "[agentfull] Generating https.conf from template (DOMAIN=$DOMAIN)..."
    export DOMAIN
    envsubst '${DOMAIN}' < /etc/nginx/conf.d/https.conf.example > /etc/nginx/conf.d/https.conf
    echo "[agentfull] https.conf generated"
fi
