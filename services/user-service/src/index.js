// User Service — lihat docs/ARCHITECTURE.md §4, §8, §9
// TODO(Backend Engineer): implementasikan logika di bawah pakai koneksi ke user-db (lihat docs/TASKS.md §2.2)
// TODO(Data Engineer): tabel `users` — skema di docs/ARCHITECTURE.md §8, migrasi di docs/TASKS.md §4.2

const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/health", (req, res) => res.json({ status: "ok", service: "user-service" }));

app.post("/register", (req, res) => {
  // TODO: hash password, simpan ke tabel users, kembalikan user tanpa password
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.post("/login", (req, res) => {
  // TODO: verifikasi kredensial, kembalikan JWT
  res.status(501).json({ message: "belum diimplementasikan" });
});

app.listen(PORT, () => console.log(`User Service jalan di port ${PORT}`));
