const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");

const DEFAULT_PORT = Number(process.env.PORT) || 3002;

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

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

function normalizeItem(row) {
  return {
    id: Number(row.id),
    nama: row.nama,
    kategori: row.kategori,
    harga_idr: Number(row.harga_idr),
    stok: Number(row.stok),
    deskripsi: row.deskripsi,
    created_at: row.created_at,
  };
}

function validateCreateItem(body) {
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const kategori = typeof body.kategori === "string" ? body.kategori.trim().toLowerCase() : "";
  const hargaIdr = Number(body.harga_idr);
  const stok = Number(body.stok);
  const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";

  if (!nama || !kategori || !Number.isInteger(hargaIdr) || hargaIdr < 1 || !Number.isInteger(stok) || stok < 0) {
    throw new AppError(400, "INPUT_TIDAK_VALID", "nama, kategori, harga_idr, dan stok wajib valid");
  }

  return { nama, kategori, hargaIdr, stok, deskripsi };
}

function validateStock(body) {
  const stok = Number(body.stok);
  if (!Number.isInteger(stok) || stok < 0) {
    throw new AppError(400, "INPUT_TIDAK_VALID", "stok wajib bilangan bulat nol atau lebih");
  }

  return stok;
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id BIGSERIAL PRIMARY KEY,
      nama TEXT NOT NULL UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id BIGSERIAL PRIMARY KEY,
      category_id BIGINT NOT NULL REFERENCES categories (id),
      nama TEXT NOT NULL UNIQUE,
      harga_idr INTEGER NOT NULL CHECK (harga_idr > 0),
      stok INTEGER NOT NULL CHECK (stok >= 0),
      deskripsi TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO categories (nama)
    VALUES ('snack'), ('skincare'), ('fashion'), ('koleksi'),
           ('elektronik'), ('kosmetik'), ('sepatu'), ('perawatan kulit'), ('jam tangan')
    ON CONFLICT (nama) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO items (category_id, nama, harga_idr, stok, deskripsi)
    SELECT c.id, seed.nama, seed.harga_idr, seed.stok, seed.deskripsi
    FROM (
      VALUES
        ('skincare',        'Hada Labo Gokujyun Lotion',     135000, 50, 'Lotion hyaluronic acid varian original, 170ml'),
        ('skincare',        'Rohto Hadalabo Gokujun Premium', 225000, 30, 'Serum premium dengan 5 jenis hyaluronic acid, 30ml'),
        ('perawatan kulit', 'Biore UV Aqua Rich',            120000, 60, 'Sunscreen SPF50+ PA++++, tekstur watery ringan, 70ml'),
        ('snack',           'Tokyo Banana Box',              255000, 40, 'Oleh-oleh khas Tokyo Station, isi 8 pcs per kotak'),
        ('snack',           'KitKat Matcha',                 120000, 10, 'Kit Kat matcha premium edisi Kyoto, 12 batang'),
        ('snack',           'Pocky Choco Almond',             90000, 80, 'Pocky edisi coklat almond premium, 2 box'),
        ('snack',           'Calbee Jagariko Salad',          53000,100, 'Snack kentang renyah varian salad, edisi Japan only'),
        ('fashion',         'Uniqlo Japan Exclusive UT',     449000, 20, 'Koleksi UT / kolaborasi hanya rilis di toko Jepang'),
        ('fashion',         'Uniqlo Heattech Extra Warm',    299000, 35, 'Kaos dalam Heattech extra warm untuk musim dingin'),
        ('fashion',         'GU Wide Denim Pants',           599000, 15, 'Celana jeans wide leg edisi Japan, berbagai warna'),
        ('koleksi',         'Nendoroid Series',              825000, 15, 'Action figure resmi Good Smile Company, edisi Jepang'),
        ('koleksi',         'One Piece Card Game Box',       495000, 25, 'Booster pack kartu One Piece edisi terbaru'),
        ('koleksi',         'Pokemon Card Booster Pack',     120000, 40, 'Booster pack kartu Pokemon edisi terbaru Jepang'),
        ('jam tangan',      'Casio G-Shock DW-5600',        1800000, 10, 'G-Shock classic square edisi Japan domestic'),
        ('jam tangan',      'Casio A168WA',                  525000, 20, 'Casio retro digital stainless edisi original Japan'),
        ('elektronik',      'Sony WH-1000XM5',              4500000,  8, 'Headphone noise-cancelling flagship Sony, edisi Japan'),
        ('kosmetik',        'Shiseido Senka Perfect Whip',    85000, 40, 'Facial wash bestseller Japan dengan sutra cocoon'),
        ('sepatu',          'Asics Gel-Kayano 30',          2200000, 12, 'Sepatu lari premium edisi Japan, berbagai ukuran')
    ) AS seed(kategori, nama, harga_idr, stok, deskripsi)
    JOIN categories c ON c.nama = seed.kategori
    ON CONFLICT (nama) DO NOTHING
  `);
}

function createDeps(overrides = {}) {
  return {
    pool: overrides.pool || new Pool({ connectionString: process.env.DATABASE_URL }),
    redis: overrides.redis || createClient({ url: process.env.REDIS_URL }),
  };
}

async function getCachedJson(redis, key) {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function setCachedJson(redis, key, value) {
  await redis.set(key, JSON.stringify(value), { EX: 60 });
}

async function invalidateCatalogCache(redis) {
  const keys = await redis.keys("catalog:*");
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

async function syncStockKey(redis, itemId, stok) {
  await redis.set(`stock:${itemId}`, String(stok));
}

async function warmStockKeys(pool, redis) {
  const result = await pool.query(`SELECT id, stok FROM items`);
  await Promise.all(result.rows.map((row) => syncStockKey(redis, row.id, row.stok)));
}

function createApp(deps) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "catalog-service" }));

  app.get("/", async (req, res, next) => {
    try {
      const page = Math.max(1, parsePositiveInt(req.query.page, 1));
      const limit = Math.min(100, Math.max(1, parsePositiveInt(req.query.limit, 20)));
      const offset = (page - 1) * limit;
      const kategori = typeof req.query.kategori === "string" ? req.query.kategori.trim().toLowerCase() : "";
      const cacheKey = `catalog:list:${kategori || 'all'}:${page}:${limit}`;
      const cached = await getCachedJson(deps.redis, cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const whereClause = kategori ? "WHERE c.nama = $1" : "";
      const listParams = kategori ? [kategori, limit, offset] : [limit, offset];
      const totalParams = kategori ? [kategori] : [];
      const listQuery = `
        SELECT i.id, i.nama, i.harga_idr, i.stok, i.deskripsi, i.created_at, c.nama AS kategori
        FROM items i
        JOIN categories c ON c.id = i.category_id
        ${whereClause}
        ORDER BY i.id
        LIMIT $${kategori ? 2 : 1} OFFSET $${kategori ? 3 : 2}
      `;
      const totalQuery = `
        SELECT COUNT(*)::int AS total
        FROM items i
        JOIN categories c ON c.id = i.category_id
        ${whereClause}
      `;
      const [listResult, totalResult] = await Promise.all([
        deps.pool.query(listQuery, listParams),
        deps.pool.query(totalQuery, totalParams),
      ]);

      const payload = {
        data: listResult.rows.map(normalizeItem),
        page,
        limit,
        total: totalResult.rows[0].total,
      };
      await setCachedJson(deps.redis, cacheKey, payload);
      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/:id", async (req, res, next) => {
    try {
      const itemId = Number(req.params.id);
      if (!Number.isInteger(itemId) || itemId < 1) {
        throw new AppError(400, "INPUT_TIDAK_VALID", "id item wajib bilangan bulat positif");
      }

      const cacheKey = `catalog:item:${itemId}`;
      const cached = await getCachedJson(deps.redis, cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const result = await deps.pool.query(
        `
          SELECT i.id, i.nama, i.harga_idr, i.stok, i.deskripsi, i.created_at, c.nama AS kategori
          FROM items i
          JOIN categories c ON c.id = i.category_id
          WHERE i.id = $1
        `,
        [itemId],
      );
      if (result.rows.length === 0) {
        throw new AppError(404, "ITEM_TIDAK_ADA", "Item tidak ditemukan");
      }

      const payload = normalizeItem(result.rows[0]);
      await setCachedJson(deps.redis, cacheKey, payload);
      await syncStockKey(deps.redis, payload.id, payload.stok);
      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  app.post("/", async (req, res, next) => {
    try {
      const payload = validateCreateItem(req.body);
      const client = await deps.pool.connect();
      try {
        await client.query("BEGIN");
        const categoryResult = await client.query(
          `
            INSERT INTO categories (nama)
            VALUES ($1)
            ON CONFLICT (nama) DO UPDATE SET nama = EXCLUDED.nama
            RETURNING id, nama
          `,
          [payload.kategori],
        );
        const categoryId = categoryResult.rows[0].id;
        const insertResult = await client.query(
          `
            INSERT INTO items (category_id, nama, harga_idr, stok, deskripsi)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nama, harga_idr, stok, deskripsi, created_at
          `,
          [categoryId, payload.nama, payload.hargaIdr, payload.stok, payload.deskripsi],
        );
        await client.query("COMMIT");

        const item = normalizeItem({ ...insertResult.rows[0], kategori: payload.kategori });
        await syncStockKey(deps.redis, item.id, item.stok);
        await invalidateCatalogCache(deps.redis);
        return res.status(201).json(item);
      } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "23505") {
          throw new AppError(409, "ITEM_SUDAH_ADA", "Nama item sudah digunakan");
        }
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/:id/stok", async (req, res, next) => {
    try {
      const itemId = Number(req.params.id);
      if (!Number.isInteger(itemId) || itemId < 1) {
        throw new AppError(400, "INPUT_TIDAK_VALID", "id item wajib bilangan bulat positif");
      }

      const stok = validateStock(req.body);
      const result = await deps.pool.query(
        `
          UPDATE items i
          SET stok = $2
          FROM categories c
          WHERE i.category_id = c.id AND i.id = $1
          RETURNING i.id, i.nama, i.harga_idr, i.stok, i.deskripsi, i.created_at, c.nama AS kategori
        `,
        [itemId, stok],
      );
      if (result.rows.length === 0) {
        throw new AppError(404, "ITEM_TIDAK_ADA", "Item tidak ditemukan");
      }

      const item = normalizeItem(result.rows[0]);
      await syncStockKey(deps.redis, item.id, item.stok);
      await invalidateCatalogCache(deps.redis);
      return res.json(item);
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
  await deps.redis.connect();
  await ensureSchema(deps.pool);
  await warmStockKeys(deps.pool, deps.redis);
  const app = createApp(deps);
  app.listen(DEFAULT_PORT, () => console.log(`Catalog Service jalan di port ${DEFAULT_PORT}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Gagal menjalankan catalog-service", error);
    process.exit(1);
  });
}

module.exports = {
  AppError,
  createApp,
  createDeps,
  ensureSchema,
  normalizeItem,
};
