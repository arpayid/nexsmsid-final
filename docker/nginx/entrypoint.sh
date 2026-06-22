#!/bin/sh
# NexSMSID nginx entrypoint — runs BEFORE nginx starts (via /docker-entrypoint.d/).
# Renders the active site config from baked templates into the writable conf.d dir.
# - Always installs the upstream definitions (api_upstream / web_upstream).
# - DOMAIN unset  -> HTTP-only (serves the app on port 80).
# - DOMAIN set    -> HTTP redirects to HTTPS + HTTPS server (auto self-signed cert
#                    if none is provided in /etc/nginx/ssl).
set -e

SRC=/etc/nginx/templates-src
CONF_D=/etc/nginx/conf.d
SSL_DIR=/etc/nginx/ssl

mkdir -p "$CONF_D" "$SSL_DIR"

# Upstreams are always required.
cp "$SRC/upstream.conf" "$CONF_D/upstream.conf"

# Drop the stock welcome config shipped by the base image if present.
rm -f "$CONF_D/default.conf" "$CONF_D/https.conf"

if [ -n "${DOMAIN:-}" ]; then
    echo "[nginx] HTTPS mode enabled for DOMAIN=$DOMAIN"

    if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
        echo "[nginx] No certificate found — generating self-signed cert for $DOMAIN"
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/privkey.pem" \
            -out "$SSL_DIR/fullchain.pem" \
            -subj "/CN=$DOMAIN/O=NexSMSID/C=ID" 2>/dev/null
        echo "[nginx] Self-signed cert created (replace with a real cert for public production)"
    fi

    cp "$SRC/http_redirect.conf" "$CONF_D/default.conf"
    export DOMAIN
    envsubst '${DOMAIN}' < "$SRC/https_app.conf.template" > "$CONF_D/https.conf"
else
    echo "[nginx] HTTP-only mode (no DOMAIN set)"
    cp "$SRC/http_app.conf" "$CONF_D/default.conf"
fi
