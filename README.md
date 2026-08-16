# TITIP.JP — Jastip Jepang → Indonesia

Proyek tugas kuliah / portofolio kelompok: web jastip barang dari Jepang ke Indonesia, dibangun dengan arsitektur microservices sederhana.

## Struktur Repo

```
titip-jp/
├── gateway/                  # API Gateway — satu-satunya pintu masuk publik
├── services/
│   ├── user-service/         # Auth & profil pembeli
│   ├── catalog-service/      # Katalog barang & stok
│   └── order-service/        # Pemesanan & kalkulasi biaya
├── frontend/
│   └── titip-jp.html         # UI (statis, akan disambungkan ke API Gateway)
├── docker-compose.yml
└── docs/
    ├── ARCHITECTURE.md       # Arsitektur sistem, diagram, ADR
    ├── TASKS.md              # Pembagian tugas per peran
    └── adr/                  # ADR tambahan jika dipecah per file
```

## Cara Menjalankan (setelah service diisi)

```bash
docker compose up -d
```

- Gateway tersedia di `http://localhost:3000`
- Frontend: buka langsung `frontend/titip-jp.html` di browser (untuk versi statis) atau sajikan lewat gateway setelah diintegrasikan

## Setup Lokal per Service (tanpa Docker)

```bash
cd services/catalog-service
cp .env.example .env
npm install
npm run dev
```

Ulangi untuk `user-service`, `order-service`, dan `gateway`.

## Dokumentasi

- Arsitektur & keputusan desain → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Pembagian tugas per peran → [`docs/TASKS.md`](docs/TASKS.md)

## Peran Kelompok

| Peran | Fokus |
|---|---|
| Arsitek Sistem | Arsitektur, diagram, ADR, konsistensi desain |
| Backend/API Engineer | Endpoint & logika bisnis inti |
| Infrastructure & DevOps | Docker, compose, gateway |
| Data & Persistence Engineer | Skema data, cache/Redis, konsistensi stok, migrasi |
| QA, Load-Test & Dokumentasi | Pengujian, load test, AI-LOG, README, laporan akhir |

## Status

🚧 Skeleton awal — endpoint di tiap service masih stub (`501 belum diimplementasikan`). Lihat `docs/TASKS.md` untuk urutan pengerjaan.
