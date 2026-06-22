#!/usr/bin/env bash
# HTTPS is now configured automatically by the nginx container.
# Setting DOMAIN in .env.production is all that is required:
#   - nginx renders the HTTPS server + HTTP->HTTPS redirect at startup
#   - a self-signed cert is generated if none is present in the nginx_ssl volume
#
# This script just prints the steps to install a *real* certificate.
set -euo pipefail

DOMAIN="${DOMAIN:-}"

if [ -z "$DOMAIN" ]; then
  echo "ERROR: Set DOMAIN=your-domain.com"
  exit 1
fi

cat <<EOF
HTTPS for $DOMAIN is handled by the nginx container automatically.

1. In .env.production set:
     DOMAIN=$DOMAIN
     WEB_ORIGIN=https://$DOMAIN
     CORS_ORIGIN=https://$DOMAIN
     NEXT_PUBLIC_APP_URL=https://$DOMAIN

2. Deploy / restart the stack:
     pnpm docker:prod:up

   nginx will serve HTTPS with a self-signed cert and redirect HTTP -> HTTPS.

3. Install a trusted certificate (recommended for public production):

   Option A — Let's Encrypt (certbot, webroot is mounted at /var/www/certbot):
     docker compose -f docker-compose.prod.yml exec nginx sh -c '\\
       apk add --no-cache certbot && \\
       certbot certonly --webroot -w /var/www/certbot -d $DOMAIN'
     # then copy the issued cert into the nginx_ssl volume as
     #   /etc/nginx/ssl/fullchain.pem and /etc/nginx/ssl/privkey.pem
     # and reload: docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

   Option B — Cloudflare Origin Certificate / your own cert:
     # copy your cert + key into the nginx_ssl volume:
     docker compose -f docker-compose.prod.yml cp fullchain.pem nginx:/etc/nginx/ssl/fullchain.pem
     docker compose -f docker-compose.prod.yml cp privkey.pem  nginx:/etc/nginx/ssl/privkey.pem
     docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
EOF
