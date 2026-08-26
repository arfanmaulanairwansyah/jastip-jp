# TITIP.JP — Jastip Jepang → Indonesia

Proyek tugas kuliah / portofolio kelompok: web jastip barang dari Jepang ke Indonesia, dibangun dengan arsitektur microservices sederhana.

## Struktur Repo

```
titip-jp/
├── gateway/                  # API Gateway — routing + JWT verification
│   ├── Dockerfile
│   ├── .env.example
│   └── src/index.js
├── services/
│   ├── user-service/         # Auth & profil pembeli (register, login JWT)
│   ├── catalog-service/      # Katalog barang, stok, cache Redis, import Excel
│   └── order-service/        # Checkout atomik, kalkulasi biaya, status tracking
├── mobile/                   # React Native / Expo — aplikasi mobile
├── nginx/
│   ├── nginx.conf            # Load balancer publik least_conn (Lapisan 2)
│   └── lb.conf               # Load balancer internal per-service (Lapisan 1.5)
├── frontend/
│   └── index.html            # UI web statis
├── scripts/
│   └── import_jastip_excel.py  # Skrip impor dataset Excel ke catalog-service
├── docker-compose.yml        # Orkestrasi lengkap (nginx + lb + 4 service + Redis + 3 DB)
├── reset.sh                  # Skrip reset demo (Codespaces/Linux)
├── AI-LOG.md                 # Catatan penggunaan AI selama proyek
└── docs/
    ├── ARCHITECTURE.md
    ├── TASKS.md
    └── backend-api.http      # Contoh request semua endpoint
```

## Cara Menjalankan di GitHub Codespaces

> **Catatan:** Jangan pakai Docker Desktop di laptop. Semua dikerjakan di GitHub Codespaces.

### 1. Jalankan sistem dari nol

```bash
docker compose up -d --build
```

### 2. Cek semua service sudah sehat

```bash
docker compose ps
# Semua harus status "running (healthy)"
```

### 3. Tes health check

```bash
curl http://localhost:8080/health      # via nginx (load balancer)
curl http://localhost:8080/api/catalog # via gateway → catalog-service
```

### 4. Reset bersih (untuk demo/presentasi)

```bash
bash reset.sh
```

Script ini melakukan: `docker compose down -v` → build ulang → tunggu sehat → verifikasi.

---

## Referensi Perintah Docker

### Menjalankan sistem

```bash
# Pertama kali / setelah clone repo — build image lalu jalankan semua
docker compose up -d --build

# Jalankan tanpa build ulang (kalau image sudah ada)
docker compose up -d
```

### Mengecek status

```bash
# Lihat semua container + status healthy/running
docker compose ps

# Lihat log semua service secara real-time
docker compose logs -f

# Lihat log satu service saja
docker compose logs -f gateway
docker compose logs -f user-service
docker compose logs -f catalog-service
docker compose logs -f order-service
docker compose logs -f nginx
```

### Menghentikan sistem

```bash
# Hentikan semua container (data tetap tersimpan)
docker compose down

# Hentikan + hapus semua data/volume (mulai dari nol)
docker compose down -v
```

### Rebuild satu service (tanpa restart yang lain)

```bash
docker compose build gateway
docker compose up -d gateway

docker compose build catalog-service
docker compose up -d catalog-service
```

### Verifikasi endpoint API

```bash
# Health check
curl http://localhost:8080/health

# Katalog barang
curl http://localhost:8080/api/catalog

# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Nama Kamu","email":"kamu@email.com","password":"password123","no_wa":"08123"}'

# Login — hasilkan JWT
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kamu@email.com","password":"password123"}'
```

### Troubleshoot cepat

```bash
# Lihat semua image yang sudah di-build
docker images | grep jastip-jp

# Masuk ke dalam container (untuk debug)
docker compose exec gateway sh
docker compose exec catalog-db psql -U postgres catalog_db

# Cek jaringan internal Docker
docker network inspect jastip-jp_internal
```

---

## Topologi Jaringan

```
Web Browser / Mobile App
  │
  ▼ port 8080
[nginx] ─── load balancer publik (least_conn)       ← Lapisan 2
  │
  ▼ port 3000 (internal)
[gateway] ─── routing API + JWT verification
  │
  ▼ (internal via lb)
[lb] ─── load balancer internal per-service (least_conn)  ← Lapisan 1.5
  ├── :3001 → user-service cluster    (N replika)
  ├── :3002 → catalog-service cluster  (N replika)
  └── :3003 → order-service cluster    (N replika)
         │               │               │
    [user-db]      [catalog-db]     [order-db]
    PostgreSQL      PostgreSQL       PostgreSQL
                        │
                     [redis]
                     cache + stock lock
```

Hanya `nginx` (port 8080) yang diekspos ke luar. Semua service lain hanya diakses lewat Docker internal network.
`lb` menangani load balancing di level service — saat satu replika down, nginx langsung failover ke replika lain.

Dokumen arsitektur lengkap dan versi as-is terbaru ada di `docs/ARCHITECTURE.md`.

---

## Scale Horizontal (Load Balancer per Layer)

### Scale gateway (Lapisan 2 — nginx publik)

```bash
# 3 instance gateway — nginx publik otomatis distribusikan beban
docker compose up -d --scale gateway=3
docker compose ps
```

### Scale tiap microservice (Lapisan 1.5 — lb internal)

```bash
# Scale masing-masing service — lb mendistribusikan beban via Docker DNS round-robin
docker compose up -d --scale user-service=3
docker compose up -d --scale catalog-service=3
docker compose up -d --scale order-service=3

# Verifikasi semua replika running
docker compose ps
```

### Scale semua sekaligus

```bash
docker compose up -d \
  --scale gateway=2 \
  --scale user-service=2 \
  --scale catalog-service=2 \
  --scale order-service=2
```

---

## Endpoint API

| Method | Path | Deskripsi |
|---|---|---|
| GET | `/health` | Health check nginx |
| POST | `/api/auth/register` | Registrasi pembeli |
| POST | `/api/auth/login` | Login, kembalikan JWT |
| GET | `/api/catalog` | Daftar barang |
| GET | `/api/catalog/:id` | Detail barang |
| POST | `/api/catalog` | Tambah barang (admin) |
| PATCH | `/api/catalog/:id/stok` | Update stok (admin) |
| POST | `/api/orders` | Buat pesanan |
| GET | `/api/orders/:id` | Detail pesanan |
| GET | `/api/orders?user_id=` | Riwayat pesanan |
| PATCH | `/api/orders/:id/status` | Ubah status (admin) |

Catatan backend saat ini:
- `user-service` sudah mendukung registrasi, login JWT, dan lookup user internal.
- `catalog-service` sudah mendukung list, detail, tambah item, update stok, dan cache Redis.
- `order-service` sudah mendukung checkout atomik, idempotency key, riwayat order, dan update status.
- `gateway` sudah memproteksi route order dan route admin dengan verifikasi JWT.
- Semua endpoint `/api/orders/*` wajib Bearer token valid dari `POST /api/auth/login`.

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Service status `exited` | Lihat log dulu | `docker compose logs <nama-service> \| tail -30` |
| `ECONNREFUSED` antar service | Pakai nama service, bukan `localhost` | Hostname = nama service di compose (mis. `redis`, `catalog-db`) |
| Service mati terus hidup lagi | Database belum siap | Healthcheck + `condition: service_healthy` sudah dipasang |
| Port 8080 sudah dipakai | Konflik port | Ganti `"8081:80"` di nginx di docker-compose.yml |

---

## Setup per Service (tanpa Docker — development lokal)

```bash
cd services/catalog-service
cp .env.example .env
# Edit .env: ganti hostname ke localhost (bukan nama service docker)
npm install
npm run dev
```

---

## Peran Kelompok

| Peran | Fokus |
|---|---|
| Arsitek Sistem | Arsitektur, diagram, ADR, konsistensi desain |
| Backend/API Engineer | Endpoint & logika bisnis inti |
| **Infrastructure & DevOps** | **Docker, compose, nginx, healthcheck, jalankan sistem** |
| Data & Persistence Engineer | Skema data, cache/Redis, konsistensi stok, migrasi |
| QA, Load-Test & Dokumentasi | Pengujian, load test, AI-LOG, laporan akhir |

## Status

Backend inti untuk peran Backend/API Engineer sudah terimplementasi pada `gateway`, `user-service`, `catalog-service`, dan `order-service`.

Yang masih perlu dilanjutkan oleh tim:
- validasi end-to-end lewat `docker compose up --build`
- penyesuaian frontend/mobile ke endpoint nyata
- load test, AI-LOG, dan laporan akhir

