# Order Service

Implementasi backend untuk peran Backend/API Engineer pada repo kelompok.

Endpoint yang sudah aktif:
- `GET /health`
- `POST /` membuat order baru dengan stok Redis atomik
- `GET /:id` detail order + `status_log`
- `GET /?user_id=&page=&limit=` riwayat order berpaginasi
- `PATCH /:id/status` ubah status order

Aturan penting:
- Gunakan header `Idempotency-Key` untuk mencegah order ganda saat retry.
- Stok dikurangi dengan `DECRBY stock:{item_id}` lalu di-rollback dengan `INCRBY` jika proses gagal.
- Error memakai bentuk `{ error: { code, message } }`.

Contoh request membuat order:

```bash
curl -X POST http://localhost:3003/ \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-001" \
  -d '{"user_id":7,"item_id":10,"qty":1,"shipping_weight_kg":1.2}'
```

Respons menghitung:
- `subtotal_idr = harga barang * qty`
- `fee_idr = 10% dari subtotal`
- `shipping_idr = ceil(shipping_weight_kg) * 45000`
- `total_idr = subtotal + fee + shipping`