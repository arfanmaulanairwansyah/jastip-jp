// Order Service — paling kompleks, kerjakan terakhir (docs/TASKS.md §2.3)
// Alur checkout WAJIB mengikuti sequence diagram di docs/ARCHITECTURE.md §6:
//   1. DECR stock:{item_id} di Redis (atomik)
//   2. Jika stok >= 0 -> ambil harga dari Catalog Service -> simpan order -> 201
//   3. Jika stok < 0  -> INCR balik (rollback) -> 409 Conflict

const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

app.get("/health", (req, res) => res.json({ status: "ok", service: "order-service" }));

app.post("/", (req, res) => {
  // TODO: implementasikan alur checkout di atas
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.get("/:id", (req, res) => {
  // TODO: detail & status pesanan
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.get("/", (req, res) => {
  // TODO: riwayat pesanan (?user_id=)
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.patch("/:id/status", (req, res) => {
  // TODO(admin): ubah status pesanan, tulis ke order_status_log
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.listen(PORT, () => console.log(`Order Service jalan di port ${PORT}`));
