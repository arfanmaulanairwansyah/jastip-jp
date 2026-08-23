const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function errorBody(code, message) {
  return { error: { code, message } };
}

function sanitizeUser(user) {
  return {
    id: Number(user.id),
    nama: user.nama,
    email: user.email,
    no_wa: user.no_wa,
    role: user.role,
    created_at: user.created_at,
  };
}

function validateRegister(body) {
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const noWa = typeof body.no_wa === "string" ? body.no_wa.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "admin" ? "admin" : "pembeli";

  if (!nama || !email.includes("@") || password.length < 8) {
    throw new AppError(400, "INPUT_TIDAK_VALID", "nama, email valid, dan password minimal 8 karakter wajib diisi");
  }

  return { nama, email, noWa, password, role };
}

function validateLogin(body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    throw new AppError(400, "INPUT_TIDAK_VALID", "email dan password wajib diisi");
  }

  return { email, password };
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      nama TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      no_wa TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'pembeli' CHECK (role IN ('pembeli', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function createDeps(overrides = {}) {
  return {
    pool: overrides.pool || new Pool({ connectionString: process.env.DATABASE_URL }),
    bcryptLib: overrides.bcryptLib || bcrypt,
    jwtLib: overrides.jwtLib || jwt,
    jwtSecret: overrides.jwtSecret || process.env.JWT_SECRET,
    jwtExpiresIn: overrides.jwtExpiresIn || process.env.JWT_EXPIRES_IN || "7d",
  };
}

function createApp(deps) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "user-service" }));

  app.get("/users/:id", async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId) || userId < 1) {
        throw new AppError(400, "INPUT_TIDAK_VALID", "id user wajib bilangan bulat positif");
      }

      const result = await deps.pool.query(
        `SELECT id, nama, email, no_wa, role, created_at FROM users WHERE id = $1`,
        [userId],
      );
      if (result.rows.length === 0) {
        throw new AppError(404, "USER_TIDAK_ADA", "User tidak ditemukan");
      }

      return res.json(sanitizeUser(result.rows[0]));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/register", async (req, res, next) => {
    try {
      const payload = validateRegister(req.body);
      const passwordHash = await deps.bcryptLib.hash(payload.password, 10);
      const result = await deps.pool.query(
        `
          INSERT INTO users (nama, email, no_wa, password_hash, role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, nama, email, no_wa, role, created_at
        `,
        [payload.nama, payload.email, payload.noWa, passwordHash, payload.role],
      );
      return res.status(201).json(sanitizeUser(result.rows[0]));
    } catch (error) {
      if (error.code === "23505") {
        return next(new AppError(409, "EMAIL_SUDAH_TERPAKAI", "Email sudah digunakan"));
      }
      return next(error);
    }
  });

  app.post("/login", async (req, res, next) => {
    try {
      if (!deps.jwtSecret) {
        throw new AppError(500, "JWT_SECRET_KOSONG", "JWT secret belum dikonfigurasi");
      }

      const payload = validateLogin(req.body);
      const result = await deps.pool.query(`SELECT * FROM users WHERE email = $1`, [payload.email]);
      if (result.rows.length === 0) {
        throw new AppError(401, "LOGIN_GAGAL", "Email atau password salah");
      }

      const user = result.rows[0];
      const matches = await deps.bcryptLib.compare(payload.password, user.password_hash);
      if (!matches) {
        throw new AppError(401, "LOGIN_GAGAL", "Email atau password salah");
      }

      const token = deps.jwtLib.sign(
        { sub: String(user.id), role: user.role, email: user.email, nama: user.nama },
        deps.jwtSecret,
        { expiresIn: deps.jwtExpiresIn },
      );

      return res.json({ token, user: sanitizeUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof AppError) {
      return res.status(error.status).json(errorBody(error.code, error.message));
    }

    return res.status(500).json(errorBody("GAGAL", "Terjadi galat internal"));
  });

  return app;
}

async function start() {
  const deps = createDeps();
  await ensureSchema(deps.pool);
  const app = createApp(deps);
  app.listen(DEFAULT_PORT, () => console.log(`User Service jalan di port ${DEFAULT_PORT}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Gagal menjalankan user-service", error);
    process.exit(1);
  });
}

module.exports = {
  AppError,
  createApp,
  createDeps,
  ensureSchema,
  sanitizeUser,
};
