const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3001";
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order-service:3003";
const JWT_SECRET = process.env.JWT_SECRET || "ganti_dengan_secret_minimal_32_karakter_ini";

// Sajikan frontend statis sebelum CORS agar assets langsung dilayani
app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (req.method === "OPTIONS") {
		return res.sendStatus(204);
	}
	return next();
});

function errorBody(code, message) {
	return { error: { code, message } };
}

function authenticate(req, res, next) {
	const authHeader = req.get("Authorization") || "";
	const [scheme, token] = authHeader.split(" ");
	if (scheme !== "Bearer" || !token) {
		return res.status(401).json(errorBody("TOKEN_TIDAK_ADA", "Bearer token wajib disertakan"));
	}

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		return next();
	} catch (_error) {
		return res.status(401).json(errorBody("TOKEN_TIDAK_VALID", "Token tidak valid atau kedaluwarsa"));
	}
}

function requireAdmin(req, res, next) {
	if (req.user?.role !== "admin") {
		return res.status(403).json(errorBody("AKSES_DITOLAK", "Hanya admin yang boleh mengakses endpoint ini"));
	}

	return next();
}

function proxyOptions(target) {
	return {
		target,
		changeOrigin: true,
		on: {
			proxyReq(proxyReq, req) {
				if (req.user?.sub) {
					proxyReq.setHeader("x-user-id", req.user.sub);
				}
				if (req.user?.role) {
					proxyReq.setHeader("x-user-role", req.user.role);
				}
			},
		},
	};
}

app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

app.use("/api/auth", createProxyMiddleware(proxyOptions(USER_SERVICE_URL)));
app.post("/api/catalog", authenticate, requireAdmin, createProxyMiddleware(proxyOptions(CATALOG_SERVICE_URL)));
app.patch("/api/catalog/:id/stok", authenticate, requireAdmin, createProxyMiddleware(proxyOptions(CATALOG_SERVICE_URL)));
app.use("/api/catalog", createProxyMiddleware(proxyOptions(CATALOG_SERVICE_URL)));
app.patch("/api/orders/:id/status", authenticate, requireAdmin, createProxyMiddleware(proxyOptions(ORDER_SERVICE_URL)));
app.use("/api/orders", authenticate, createProxyMiddleware(proxyOptions(ORDER_SERVICE_URL)));

app.listen(PORT, () => console.log(`Gateway jalan di port ${PORT}`));

module.exports = { authenticate, requireAdmin };
