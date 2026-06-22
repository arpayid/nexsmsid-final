#!/usr/bin/env bash
# Encrypt/decrypt .env.production for secure storage
# Usage:
#   bash scripts/secrets-encrypt.sh encrypt   # encrypt .env.production → .env.production.enc
#   bash scripts/secrets-encrypt.sh decrypt   # decrypt .env.production.enc → .env.production
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

ENV_FILE=".env.production"
ENC_FILE=".env.production.enc"
KEY_FILE=".env.production.key"

case "${1:-}" in
  encrypt)
    if [ ! -f "$ENV_FILE" ]; then
      echo "❌ $ENV_FILE not found"
      exit 1
    fi
    
    # Generate key jika belum ada
    if [ ! -f "$KEY_FILE" ]; then
      openssl rand -base64 32 > "$KEY_FILE"
      chmod 600 "$KEY_FILE"
      echo "✅ Key generated: $KEY_FILE (BACKUP THIS FILE!)"
    fi
    
    KEY=$(cat "$KEY_FILE")
    
    # Encrypt
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
      -in "$ENV_FILE" \
      -out "$ENC_FILE" \
      -pass "pass:$KEY"
    
    echo "✅ Encrypted: $ENV_FILE → $ENC_FILE"
    echo "   Key file:  $KEY_FILE"
    echo ""
    echo "⚠️  Store $KEY_FILE securely! Loss = data loss."
    echo "   Recommended:"
    echo "   - Password manager (Bitwarden, 1Password)"
    echo "   - GPG encrypted email to yourself"
    echo "   - Print + safe deposit box"
    ;;
    
  decrypt)
    if [ ! -f "$ENC_FILE" ]; then
      echo "❌ $ENC_FILE not found"
      exit 1
    fi
    
    if [ ! -f "$KEY_FILE" ]; then
      echo "❌ $KEY_FILE not found"
      echo "   Provide key manually or restore $KEY_FILE"
      exit 1
    fi
    
    KEY=$(cat "$KEY_FILE")
    
    openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
      -in "$ENC_FILE" \
      -out "$ENV_FILE" \
      -pass "pass:$KEY"
    
    echo "✅ Decrypted: $ENC_FILE → $ENV_FILE"
    chmod 600 "$ENV_FILE"
    ;;
    
  rotate)
    echo "=== Secret Rotation ==="
    echo ""
    
    # Backup current env
    if [ -f "$ENV_FILE" ]; then
      cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
      echo "✅ Current env backed up"
    fi
    
    # Generate new secrets
    NEW_POSTGRES=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    NEW_REDIS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    NEW_JWT_ACCESS=$(openssl rand -base64 64)
    NEW_JWT_REFRESH=$(openssl rand -base64 64)
    
    # Update env file
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$NEW_POSTGRES|" "$ENV_FILE"
      sed -i '' "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$NEW_REDIS|" "$ENV_FILE"
      sed -i '' "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$NEW_JWT_ACCESS|" "$ENV_FILE"
      sed -i '' "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$NEW_JWT_REFRESH|" "$ENV_FILE"
    else
      sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$NEW_POSTGRES|" "$ENV_FILE"
      sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$NEW_REDIS|" "$ENV_FILE"
      sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$NEW_JWT_ACCESS|" "$ENV_FILE"
      sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$NEW_JWT_REFRESH|" "$ENV_FILE"
    fi
    
    echo "✅ Secrets rotated: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_*"
    echo ""
    echo "⚠️  Wajib restart stack setelah rotate:"
    echo "   pnpm docker:prod:up"
    echo "   Semua user perlu login ulang (JWT berubah)"
    ;;
    
  validate)
    echo "=== Secret Validation ==="
    echo ""
    
    fail=0
    source_env() {
      set -a
      source "$ENV_FILE" 2>/dev/null
      set +a
    }
    source_env
    
    [ -f "$ENV_FILE" ] && echo "✅ $ENV_FILE exists" || { echo "❌ $ENV_FILE missing"; fail=1; }
    [ -f "$KEY_FILE" ] && echo "✅ $KEY_FILE exists" || echo "⚠️  $KEY_FILE missing (encrypted backup not possible)"
    [ -f "$ENC_FILE" ] && echo "✅ $ENC_FILE exists (encrypted backup)" || echo "ℹ️  $ENC_FILE not found (run encrypt first)"
    
    # Check permissions
    PERMS=$(stat -c "%a" "$ENV_FILE" 2>/dev/null)
    [ "${PERMS:-600}" = "600" ] || [ "${PERMS:-600}" = "400" ] && \
      echo "✅ $ENV_FILE permissions: $PERMS" || \
      echo "⚠️  $ENV_FILE permissions: $PERMS (recommend: 600)"
    
    echo ""
    echo "=== Secret Strength ==="
    for var in JWT_ACCESS_SECRET JWT_REFRESH_SECRET POSTGRES_PASSWORD REDIS_PASSWORD; do
      val=$(grep "^$var=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- || echo "")
      len=${#val}
      if [ "$len" -ge 32 ]; then
        echo "✅ $var: $len chars (strong)"
      elif [ "$len" -ge 16 ]; then
        echo "⚠️  $var: $len chars (adequate)"
      else
        echo "❌ $var: $len chars (TOO SHORT!)"
        fail=1
      fi
    done
    
    [ "$fail" -eq 0 ] && echo "" && echo "✅ All secrets valid" || echo "" && echo "❌ Some secrets need attention"
    ;;
    
  *)
    echo "Usage: bash scripts/secrets-encrypt.sh <command>"
    echo ""
    echo "Commands:"
    echo "  encrypt    Encrypt .env.production → .env.production.enc"
    echo "  decrypt    Decrypt .env.production.enc → .env.production"
    echo "  rotate     Regenerate all secrets in .env.production"
    echo "  validate   Check secret strength + file permissions"
    ;;
esac
