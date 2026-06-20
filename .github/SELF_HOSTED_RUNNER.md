# Self-Hosted Runner — NexSMSID V4 CI

Workflow CI memakai **self-hosted runner** dengan label `self-hosted`, `linux`, dan `nexsmsid-final`.

## Prasyarat di mesin runner

| Komponen                         | Versi minimum                       |
| -------------------------------- | ----------------------------------- |
| OS                               | Linux (Ubuntu 22.04+ disarankan)    |
| Node.js                          | 22.x                                |
| Docker Engine + Compose plugin   | Terbaru stabil                      |
| PostgreSQL client (`pg_isready`) | Disarankan — mempercepat warm start |
| Redis tools (`redis-cli`)        | Disarankan — mempercepat warm start |
| Git                              | 2.x                                 |

Port **5432** (PostgreSQL) dan **6379** (Redis) harus bebas saat job CI berjalan.

## 1. Daftarkan runner ke GitHub

Di repository **arpayid/nexsmsid-final**:

**Settings → Actions → Runners → New self-hosted runner**

Pilih Linux, lalu jalankan perintah yang ditampilkan (contoh):

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.335.1.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.335.1/actions-runner-linux-x64-2.335.1.tar.gz
tar xzf ./actions-runner-linux-x64-*.tar.gz

./config.sh --url https://github.com/arpayid/nexsmsid-final --token <TOKEN_DARI_GITHUB> \
  --labels self-hosted,linux,nexsmsid-final --name nexsmsid-final-ci-01

sudo ./svc.sh install
sudo ./svc.sh start
```

## 2. Label runner

Workflow `.github/workflows/ci.yml` memakai:

```yaml
runs-on: [self-hosted, linux, nexsmsid-final]
```

Pastikan label `nexsmsid-final` terpasang saat `config.sh`.

## 3. Cara kerja layanan CI

GitHub **tidak** mendukung blok `services:` pada self-hosted runner. CI menjalankan:

```bash
./scripts/ci-services.sh start   # docker compose up (warm jika sudah jalan)
# ... langkah build/test ...
./scripts/ci-services.sh stop    # no-op jika CI_KEEP_SERVICES=1
```

Project Compose terisolasi: `nexsmsid-final-ci` (terpisah dari dev `nexsmsid-final`).

### Percepatan CI (disarankan di VPS)

| Optimasi                                     | Efek                                                |
| -------------------------------------------- | --------------------------------------------------- |
| `CI_KEEP_SERVICES=1` (default di workflow)   | Postgres/Redis tetap hidup antar job                |
| Warm start (`pg_isready` + `redis-cli`)      | Lewati `docker compose up` jika layanan sudah sehat |
| `pnpm install --prefer-offline` + cache pnpm | Install lebih cepat dari store lokal                |
| `TURBO_CACHE_DIR` di `$HOME/.cache/turbo`    | Rebuild Turbo cache hit antar job                   |
| Paralel: format + lint + API unit tests      | 3 langkah berjalan bersamaan                        |
| `concurrency: cancel-in-progress`            | Batalkan run lama saat push baru                    |

Pasang client health-check:

```bash
sudo apt-get install -y postgresql-client redis-tools
```

Reset database Docker dari nol (jarang perlu):

```bash
CI_KEEP_SERVICES=0 CI_RESET_VOLUMES=1 ./scripts/ci-services.sh stop
./scripts/ci-services.sh start
```

## 4. Verifikasi manual di runner

```bash
git clone https://github.com/arpayid/nexsmsid-final.git
cd nexsmsid-final
./scripts/ci-services.sh start
pnpm install --frozen-lockfile
pnpm --filter @nexsmsid/api prisma generate
pnpm --filter @nexsmsid/api prisma migrate deploy
pnpm format:check && pnpm typecheck && pnpm lint
pnpm --filter @nexsmsid/api test
./scripts/ci-services.sh stop
```

## 5. Troubleshooting

| Gejala                     | Solusi                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------- |
| Job stuck di queue         | Runner offline atau label tidak cocok (`nexsmsid-final`)                                  |
| Port 5432/6379 in use      | Hentikan stack Docker lain atau ubah port                                              |
| `docker compose` not found | Pasang [Compose plugin](https://docs.docker.com/compose/install/linux/)                |
| Permission denied Docker   | `sudo usermod -aG docker <user>` lalu restart service runner                           |
| Migrasi gagal              | Pastikan `./scripts/ci-services.sh start` sukses dan `DATABASE_URL` ke `nexsmsid_test` |
