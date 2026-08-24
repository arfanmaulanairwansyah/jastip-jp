# TITIP.JP — Jastip Jepang → Indonesia

Proyek tugas kuliah / portofolio kelompok: web jastip barang dari Jepang ke Indonesia, dibangun dengan arsitektur microservices sederhana.

## Struktur Repo

```
titip-jp/
├── gateway/                  # API Gateway — routing ke 3 service
│   ├── Dockerfile
│   ├── .env.example
│   └── src/index.js
├── services/
│   ├── user-service/         # Auth & profil pembeli
│   ├── catalog-service/      # Katalog barang & stok
│   └── order-service/        # Pemesanan & kalkulasi biaya
├── nginx/
│   └── nginx.conf            # Load balancer (Lapisan 2)
├── frontend/
│   └── index.html            # UI statis
├── docker-compose.yml        # Orkestrasi lengkap (9 service)
├── reset.sh                  # Skrip reset demo (Codespaces/Linux)
└── docs/
    ├── ARCHITECTURE.md
    └── TASKS.md
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

## Topologi Jaringan

```
Web Browser / Mobile App
  │
  ▼ port 8080
[nginx] ─── load balancer (least_conn)
  │
  ▼ port 3000 (internal)
[gateway] ─── routing API
  ├── /api/auth    → user-service:3001
  ├── /api/catalog → catalog-service:3002
  └── /api/orders  → order-service:3003 (protected)
         │               │               │
    [user-db]      [catalog-db]     [order-db]
    PostgreSQL      PostgreSQL       PostgreSQL
                        │
                     [redis]
                     cache + stock lock
```

Hanya `nginx` (port 8080) yang diekspos ke luar. Semua service lain hanya diakses lewat Docker internal network.

Dokumen arsitektur lengkap dan versi as-is terbaru ada di `docs/ARCHITECTURE.md`.

---

## Scale Horizontal (Demo Lapisan 2)

```bash
# Jalankan 3 instance gateway — nginx otomatis distribusikan beban
docker compose up -d --scale gateway=3
docker compose ps
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

