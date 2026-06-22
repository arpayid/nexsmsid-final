# NexSMSID V4 — Setup & Deploy Guide

## 📋 Prasyarat Server

- Ubuntu 22.04+ / Debian 12+
- Docker + Docker Compose terinstall
- Domain + DNS pointing ke IP server
- Port 80 & 443 terbuka

## 🚀 1. Install Docker & Portainer

```bash
# Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
newgrp docker

# Install Portainer
docker volume create portainer_data
docker run -d \
  --name portainer \
  --restart always \
  -p 8000:8000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:lts
```

Akses: `https://IP-SERVER:9443`

## 🏗️ 2. Deploy NexSMSID via Portainer

### A. Login Portainer → Stacks → Add Stack

| Field | Isi |
|-------|-----|
| Name | `nexsmsid` |
| Build method | **Repository** |
| Repository URL | `https://github.com/arpayid/nexsmsid-final` |
| Compose path | `docker-compose.prod.yml` |
| Branch | `main` |

### B. Environment Variables (wajib diisi)

```env
DOMAIN=sms.sekolah.sch.id
WEB_ORIGIN=https://sms.sekolah.sch.id
CORS_ORIGIN=https://sms.sekolah.sch.id
NEXT_PUBLIC_APP_URL=https://sms.sekolah.sch.id
NEXT_PUBLIC_API_URL=/api/v1

POSTGRES_PASSWORD=        # generate: openssl rand -base64 32
REDIS_PASSWORD=           # generate: openssl rand -base64 32
DATABASE_URL=postgresql://nexsmsid:${POSTGRES_PASSWORD}@postgres:5432/nexsmsid?schema=public
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

JWT_ACCESS_SECRET=        # generate: openssl rand -base64 64
JWT_REFRESH_SECRET=       # generate: openssl rand -base64 64 (beda!)

NEXT_PUBLIC_TURNSTILE_SITE_KEY=  # dari Cloudflare
TURNSTILE_SECRET_KEY=            # dari Cloudflare

BACKUP_SCHEDULE=0 */6 * * *
BACKUP_RETENTION_DAYS=30
```

### C. Deploy → tunggu build selesai

## 🔧 3. Post-Deploy (via Portainer Console)

### Masuk ke container `api` → Exec Console

```bash
# 1. Migrate database
cd /app/apps/api && npx prisma migrate deploy

# 2. Seed admin (hanya deploy pertama)
npx prisma db seed

# 3. Verifikasi
curl -s http://localhost:4000/api/v1/health
```

## 📊 4. Cek Status

### Portainer Dashboard:
- Containers → semua status ✅ **Running** + **Healthy**
- Volumes → `postgres_data`, `redis_data`, `storage_data`, `backup_data` ✅

### Via Browser:
- `https://sms.sekolah.sch.id` → Login page ✅
- `https://sms.sekolah.sch.id/api/v1/health` → `{"status":"ok"}` ✅

## 🔐 5. Setup SSL (LetsEncrypt)

Setelah deploy berjalan dan domain aktif:

```bash
# Masuk ke container nginx
docker exec -it nexsmsid-nginx-1 sh

# Install certbot
apk add certbot

# Generate SSL
certbot certonly --webroot -w /var/www/certbot -d sms.sekolah.sch.id

# Reload nginx
nginx -s reload
```

Atau via Portainer: Containers → nginx → Exec Console

## ♻️ 6. Backup & Restore

### Backup manual:
```bash
# Via Portainer Console di container backup:
/entrypoint.sh --once
```

### Restore:
```bash
# Via Portainer Console di container postgres:
pg_restore -U nexsmsid -d nexsmsid /backups/file.sql
```

## 📈 7. Monitoring

```bash
# Cek log semua service
docker compose -f docker-compose.prod.yml logs -f --tail=50

# Cek health individual
curl -s http://localhost:4000/api/v1/health/detailed

# Cek resource usage (via Portainer)
Portainer → Containers → Stats
```

## 🆘 Troubleshooting

| Gejala | Solusi |
|--------|--------|
| Container restart loop | Cek log: Portainer → Container → Logs |
| DB connection refused | Pastikan postgres healthy (`pg_isready`) |
| 502 Bad Gateway | Nginx belum connect ke API/Web. Cek `depends_on` |
| SSL not working | Verifikasi cert ada di `/etc/nginx/ssl/` |
| Backup gagal | Cek `POSTGRES_PASSWORD` di env backup container |
