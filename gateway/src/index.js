// Gateway — satu-satunya pintu masuk publik (lihat docs/ARCHITECTURE.md §4 & §9)
// TODO(Backend Engineer): tambahkan middleware verifikasi JWT sebelum proxy ke service yang butuh auth.

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3001";
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order-service:3003";

app.get("/health", (req, res) => res.json({ status: "ok", service: "gateway" }));

// Routing sesuai tabel kontrak API di docs/ARCHITECTURE.md §9
app.use("/api/auth", createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use("/api/catalog", createProxyMiddleware({ target: CATALOG_SERVICE_URL, changeOrigin: true }));
app.use("/api/orders", createProxyMiddleware({ target: ORDER_SERVICE_URL, changeOrigin: true }));

app.listen(PORT, () => console.log(`Gateway jalan di port ${PORT}`));
