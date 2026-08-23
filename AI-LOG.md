# AI-LOG

## Ringkasan penggunaan AI

Peran yang dikerjakan: Backend/API Engineer.

Ruang lingkup yang dibantu AI:
- implementasi `user-service`, `catalog-service`, `order-service`, dan proteksi JWT di `gateway`
- penulisan test service untuk validasi endpoint inti
- perapihan README dan checklist tugas backend

## Prompt inti yang dipakai

1. Implementasikan backend/API engineer untuk repo `jastip-jp` pada service yang masih stub.
2. Buat `order-service` dengan logika checkout atomik memakai Redis dan PostgreSQL.
3. Tambahkan `user-service` untuk register/login JWT dan `catalog-service` untuk list/detail/update stok.
4. Rapikan dokumentasi agar status backend sinkron dengan implementasi.

## Hasil yang dihasilkan AI

- Endpoint `POST /api/auth/register`
- Endpoint `POST /api/auth/login`
- Endpoint `GET /api/catalog`
- Endpoint `GET /api/catalog/:id`
- Endpoint `POST /api/catalog`
- Endpoint `PATCH /api/catalog/:id/stok`
- Endpoint `POST /api/orders`
- Endpoint `GET /api/orders/:id`
- Endpoint `GET /api/orders?user_id=`
- Endpoint `PATCH /api/orders/:id/status`
- Middleware verifikasi JWT di `gateway`
- Test backend untuk `catalog-service`, `user-service`, dan `order-service`

## Pemeriksaan manual dan penolakan penting

- Menolak pola baca-cek-tulis stok di level aplikasi untuk checkout; dipakai operasi atomik Redis `DECRBY` dan rollback `INCRBY`.
- Menolak SQL concatenation; query memakai parameter PostgreSQL.
- Menambahkan paginasi untuk endpoint daftar agar cocok untuk beban dan klien mobile.
- Menambahkan `Idempotency-Key` di `order-service` agar retry tidak membuat order ganda.

## Validasi yang dijalankan

- `npm test` pada `services/catalog-service`
- `npm test` pada `services/user-service`
- `npm test` pada `services/order-service`
- `docker compose config`

## Catatan keterbatasan lingkungan

- `docker compose up --build` tidak dapat divalidasi penuh di mesin ini karena Docker daemon tidak sedang aktif.