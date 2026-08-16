// Catalog Service — lihat docs/ARCHITECTURE.md §4, §8, §9
// TODO(Backend Engineer): implementasikan cache-aside ke Redis sebelum baca ke catalog-db
// TODO(Data Engineer): tabel `items` & `categories`, plus sinkronisasi stok Redis <-> Postgres (docs/TASKS.md §4.3)

const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.get("/health", (req, res) => res.json({ status: "ok", service: "catalog-service" }));

app.get("/", (req, res) => {
  // TODO: list barang, filter kategori, baca dari cache dulu
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.get("/:id", (req, res) => {
  // TODO: detail satu barang
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.post("/", (req, res) => {
  // TODO(admin): tambah barang baru
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.patch("/:id/stok", (req, res) => {
  // TODO(admin): update stok — ingat inisialisasi ulang key Redis stock:{item_id}
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.listen(PORT, () => console.log(`Catalog Service jalan di port ${PORT}`));
