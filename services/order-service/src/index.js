const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const { createClient } = require("redis");

const DEFAULT_PORT = Number(process.env.PORT) || 3003;
const DEFAULT_STATUS = "MENUNGGU_PEMBAYARAN";
const ALLOWED_STATUSES = new Set([
  "MENUNGGU_PEMBAYARAN",
  "DIBAYAR",
  "DIBELI",
  "DIKIRIM",
  "DITERIMA",
  "DIBATALKAN",
]);

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

function validateCreateOrder(body) {
  const userId = Number(body.user_id);
  const itemId = Number(body.item_id);
  const qty = Number(body.qty);
  const shippingWeightKg = body.shipping_weight_kg == null ? 1 : Number(body.shipping_weight_kg);

  if (
    !Number.isInteger(userId) ||
    !Number.isInteger(itemId) ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    Number.isNaN(shippingWeightKg) ||
    shippingWeightKg <= 0
  ) {
    throw new AppError(
      400,
      "INPUT_TIDAK_VALID",
      "user_id, item_id, qty, dan shipping_weight_kg wajib valid",
    );
  }

  return {
    userId,
    itemId,
    qty,
    shippingWeightKg,
  };
}

function validateStatusPatch(body) {
  const status = typeof body.status === "string" ? body.status.trim().toUpperCase() : "";
  if (!ALLOWED_STATUSES.has(status)) {
    throw new AppError(400, "INPUT_TIDAK_VALID", "status tidak dikenali");
  }

  return status;
}

function computePricing({ unitPriceIdr, qty, shippingWeightKg }) {
  const subtotalIdr = unitPriceIdr * qty;
  const feeIdr = Math.round(subtotalIdr * 0.1);
  const shippingIdr = Math.ceil(shippingWeightKg) * 45000;
  return {
    subtotalIdr,
    feeIdr,
    shippingIdr,
    totalIdr: subtotalIdr + feeIdr + shippingIdr,
  };
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      item_id BIGINT NOT NULL,
      qty INTEGER NOT NULL CHECK (qty > 0),
      unit_price_idr INTEGER NOT NULL CHECK (unit_price_idr > 0),
      subtotal_idr INTEGER NOT NULL CHECK (subtotal_idr > 0),
      fee_idr INTEGER NOT NULL CHECK (fee_idr >= 0),
      shipping_idr INTEGER NOT NULL CHECK (shipping_idr >= 0),
      total_idr INTEGER NOT NULL CHECK (total_idr > 0),
      shipping_weight_kg NUMERIC(10,2) NOT NULL CHECK (shipping_weight_kg > 0),
      status TEXT NOT NULL,
      idempotency_key TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_status_log (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at
    ON orders (user_id, created_at DESC)
  `);
}

function createDeps(overrides = {}) {
  const pool = overrides.pool || new Pool({ connectionString: process.env.DATABASE_URL });
  const redis = overrides.redis || createClient({ url: process.env.REDIS_URL });
  const catalogClient = overrides.catalogClient || axios.create({
    baseURL: process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002",
    timeout: 5000,
  });
  const userClient = overrides.userClient || axios.create({
    baseURL: process.env.USER_SERVICE_URL || "http://user-service:3001",
    timeout: 5000,
  });

  return { pool, redis, catalogClient, userClient };
}

async function getItemSnapshot(catalogClient, itemId) {
  const response = await catalogClient.get(`/${itemId}`);
  const body = response.data || {};
  const item = body.data || body.item || body;

  const unitPriceIdr = Number(item.harga_idr ?? item.harga ?? item.price_idr ?? item.price);
  if (!Number.isInteger(unitPriceIdr) || unitPriceIdr < 1) {
    throw new AppError(502, "ITEM_TIDAK_VALID", "Catalog Service mengembalikan harga yang tidak valid");
  }

  return {
    itemId: Number(item.id ?? itemId),
    itemName: item.nama || item.name || `item-${itemId}`,
    unitPriceIdr,
  };
}

async function ensureUserExists(userClient, userId) {
  if (!userClient) {
    return;
  }

  try {
    await userClient.get(`/users/${userId}`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new AppError(404, "USER_TIDAK_ADA", "User tidak ditemukan");
    }
    throw error;
  }
}

async function reserveStock(redis, itemId, qty) {
  const stockKey = `stock:${itemId}`;
  const remaining = await redis.decrBy(stockKey, qty);
  if (remaining < 0) {
    await redis.incrBy(stockKey, qty);
    throw new AppError(409, "STOK_HABIS", "Stok tidak mencukupi");
  }

  return { stockKey, remaining };
}

async function releaseStock(redis, stockKey, qty) {
  if (qty > 0) {
    await redis.incrBy(stockKey, qty);
  }
}

async function createOrderRecord(pool, order, idempotencyKey) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insertResult = await client.query(
      `
        INSERT INTO orders (
          user_id,
          item_id,
          qty,
          unit_price_idr,
          subtotal_idr,
          fee_idr,
          shipping_idr,
          total_idr,
          shipping_weight_kg,
          status,
          idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `,
      [
        order.userId,
        order.itemId,
        order.qty,
        order.unitPriceIdr,
        order.subtotalIdr,
        order.feeIdr,
        order.shippingIdr,
        order.totalIdr,
        order.shippingWeightKg,
        DEFAULT_STATUS,
        idempotencyKey,
      ],
    );

    const createdOrder = insertResult.rows[0];
    await client.query(
      `INSERT INTO order_status_log (order_id, status) VALUES ($1, $2)`,
      [createdOrder.id, createdOrder.status],
    );
    await client.query("COMMIT");
    return createdOrder;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function formatOrder(order, extra = {}) {
  return {
    id: Number(order.id),
    user_id: Number(order.user_id),
    item_id: Number(order.item_id),
    qty: Number(order.qty),
    unit_price_idr: Number(order.unit_price_idr),
    subtotal_idr: Number(order.subtotal_idr),
    fee_idr: Number(order.fee_idr),
    shipping_idr: Number(order.shipping_idr),
    total_idr: Number(order.total_idr),
    shipping_weight_kg: Number(order.shipping_weight_kg),
    status: order.status,
    idempotency_key: order.idempotency_key,
    created_at: order.created_at,
    updated_at: order.updated_at,
    ...extra,
  };
}

function createApp(deps) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "order-service" }));

  app.get("/", async (req, res, next) => {
    try {
      const page = Math.max(1, parsePositiveInt(req.query.page, 1));
      const limit = Math.min(100, Math.max(1, parsePositiveInt(req.query.limit, 20)));
      const offset = (page - 1) * limit;
      const userId = req.query.user_id == null ? null : Number(req.query.user_id);

      if (req.query.user_id != null && (!Number.isInteger(userId) || userId < 1)) {
        throw new AppError(400, "INPUT_TIDAK_VALID", "user_id wajib bilangan bulat positif");
      }

      const whereClause = userId ? "WHERE user_id = $1" : "";
      const listParams = userId ? [userId, limit, offset] : [limit, offset];
      const totalParams = userId ? [userId] : [];
      const listQuery = `
        SELECT * FROM orders
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${userId ? 2 : 1} OFFSET $${userId ? 3 : 2}
      `;
      const totalQuery = `SELECT COUNT(*)::int AS total FROM orders ${whereClause}`;

      const [listResult, totalResult] = await Promise.all([
        deps.pool.query(listQuery, listParams),
        deps.pool.query(totalQuery, totalParams),
      ]);

      return res.json({
        data: listResult.rows.map((row) => formatOrder(row)),
        page,
        limit,
        total: totalResult.rows[0].total,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/", async (req, res, next) => {
    const idempotencyKey = req.get("Idempotency-Key") || null;
    let reservation = null;

    try {
      const payload = validateCreateOrder(req.body);

      if (idempotencyKey) {
        const existing = await deps.pool.query(
          `SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1`,
          [idempotencyKey],
        );
        if (existing.rows.length > 0) {
          return res.status(200).json(formatOrder(existing.rows[0]));
        }
      }

      await ensureUserExists(deps.userClient, payload.userId);
      reservation = await reserveStock(deps.redis, payload.itemId, payload.qty);
      const item = await getItemSnapshot(deps.catalogClient, payload.itemId);
      const pricing = computePricing({
        unitPriceIdr: item.unitPriceIdr,
        qty: payload.qty,
        shippingWeightKg: payload.shippingWeightKg,
      });
      const createdOrder = await createOrderRecord(deps.pool, {
        ...payload,
        ...pricing,
        unitPriceIdr: item.unitPriceIdr,
      }, idempotencyKey);

      return res.status(201).json(formatOrder(createdOrder, {
        item_name: item.itemName,
        stock_remaining: reservation.remaining,
      }));
    } catch (error) {
      if (reservation) {
        await releaseStock(deps.redis, reservation.stockKey, Number(req.body.qty) || 0).catch(() => {});
      }
      return next(error);
    }
  });

  app.get("/:id", async (req, res, next) => {
    try {
      const orderId = Number(req.params.id);
      if (!Number.isInteger(orderId) || orderId < 1) {
        throw new AppError(400, "INPUT_TIDAK_VALID", "id pesanan wajib bilangan bulat positif");
      }

      const orderResult = await deps.pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
      if (orderResult.rows.length === 0) {
        throw new AppError(404, "ORDER_TIDAK_ADA", "Pesanan tidak ditemukan");
      }

      const logResult = await deps.pool.query(
        `SELECT status, changed_at FROM order_status_log WHERE order_id = $1 ORDER BY changed_at ASC`,
        [orderId],
      );

      return res.json({
        ...formatOrder(orderResult.rows[0]),
        status_log: logResult.rows,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/:id/status", async (req, res, next) => {
    try {
      const orderId = Number(req.params.id);
      if (!Number.isInteger(orderId) || orderId < 1) {
        throw new AppError(400, "INPUT_TIDAK_VALID", "id pesanan wajib bilangan bulat positif");
      }

      const status = validateStatusPatch(req.body);
      const client = await deps.pool.connect();
      try {
        await client.query("BEGIN");
        const updateResult = await client.query(
          `
            UPDATE orders
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [orderId, status],
        );
        if (updateResult.rows.length === 0) {
          throw new AppError(404, "ORDER_TIDAK_ADA", "Pesanan tidak ditemukan");
        }

        await client.query(
          `INSERT INTO order_status_log (order_id, status) VALUES ($1, $2)`,
          [orderId, status],
        );
        await client.query("COMMIT");
        return res.json(formatOrder(updateResult.rows[0]));
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof AppError) {
      return res.status(error.status).json(errorBody(error.code, error.message));
    }

    if (error.response && error.response.status === 404) {
      return res.status(404).json(errorBody("ITEM_TIDAK_ADA", "Item tidak ditemukan"));
    }

    return res.status(500).json(errorBody("GAGAL", "Terjadi galat internal"));
  });

  return app;
}

async function start() {
  const deps = createDeps();
  await deps.redis.connect();
  await ensureSchema(deps.pool);
  const app = createApp(deps);
  app.listen(DEFAULT_PORT, () => console.log(`Order Service jalan di port ${DEFAULT_PORT}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Gagal menjalankan order-service", error);
    process.exit(1);
  });
}

module.exports = {
  ALLOWED_STATUSES,
  AppError,
  computePricing,
  createApp,
  createDeps,
  ensureSchema,
  errorBody,
  formatOrder,
  validateCreateOrder,
};
