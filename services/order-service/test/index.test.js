const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp, computePricing } = require("../src/index.js");

function createRepositoryDouble() {
  const orders = [];
  const statusLogs = new Map();
  let nextId = 1;

  const pool = {
    async query(queryText, params) {
      if (queryText.includes("SELECT * FROM orders WHERE idempotency_key")) {
        const order = orders.find((item) => item.idempotency_key === params[0]);
        return { rows: order ? [order] : [] };
      }

      if (queryText.includes("SELECT * FROM orders WHERE id = $1")) {
        const order = orders.find((item) => item.id === params[0]);
        return { rows: order ? [order] : [] };
      }

      if (queryText.includes("SELECT status, changed_at FROM order_status_log")) {
        return { rows: statusLogs.get(params[0]) || [] };
      }

      if (queryText.includes("SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1")) {
        return { rows: [{ total: orders.filter((item) => item.user_id === params[0]).length }] };
      }

      if (queryText.includes("SELECT COUNT(*)::int AS total FROM orders")) {
        return { rows: [{ total: orders.length }] };
      }

      if (queryText.includes("WHERE user_id = $1")) {
        const items = orders.filter((item) => item.user_id === params[0]);
        return { rows: items.slice(0, params[1]) };
      }

      if (queryText.includes("SELECT * FROM orders")) {
        return { rows: orders.slice(0, params[0]) };
      }

      throw new Error(`Unhandled pool.query: ${queryText}`);
    },
    async connect() {
      return {
        async query(queryText, params) {
          if (queryText === "BEGIN" || queryText === "COMMIT" || queryText === "ROLLBACK") {
            return;
          }

          if (queryText.includes("INSERT INTO orders")) {
            const created = {
              id: nextId++,
              user_id: params[0],
              item_id: params[1],
              qty: params[2],
              unit_price_idr: params[3],
              subtotal_idr: params[4],
              fee_idr: params[5],
              shipping_idr: params[6],
              total_idr: params[7],
              shipping_weight_kg: params[8],
              status: params[9],
              idempotency_key: params[10],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            orders.push(created);
            return { rows: [created] };
          }

          if (queryText.includes("INSERT INTO order_status_log")) {
            const current = statusLogs.get(params[0]) || [];
            current.push({ status: params[1], changed_at: new Date().toISOString() });
            statusLogs.set(params[0], current);
            return;
          }

          if (queryText.includes("UPDATE orders") && queryText.includes("SET status = $2")) {
            const order = orders.find((item) => item.id === params[0]);
            if (!order) {
              return { rows: [] };
            }
            order.status = params[1];
            order.updated_at = new Date().toISOString();
            return { rows: [order] };
          }

          throw new Error(`Unhandled client.query: ${queryText}`);
        },
        release() {},
      };
    },
  };

  return { pool };
}

function createRedisDouble(initialStock = 5) {
  const store = new Map([["stock:10", initialStock]]);
  return {
    async decrBy(key, qty) {
      const next = (store.get(key) || 0) - qty;
      store.set(key, next);
      return next;
    },
    async incrBy(key, qty) {
      const next = (store.get(key) || 0) + qty;
      store.set(key, next);
      return next;
    },
  };
}

function createAppForTest({ stock = 5 } = {}) {
  const repo = createRepositoryDouble();
  const redis = createRedisDouble(stock);
  const catalogClient = {
    async get(path) {
      assert.equal(path, "/10");
      return { data: { id: 10, nama: "KitKat Matcha", harga_idr: 120000 } };
    },
  };
  const userClient = {
    async get(path) {
      assert.equal(path, "/users/7");
      return { data: { id: 7, nama: "Agus" } };
    },
  };

  return createApp({ pool: repo.pool, redis, catalogClient, userClient });
}

test("computePricing calculates subtotal, fee, shipping, and total", () => {
  const pricing = computePricing({ unitPriceIdr: 100000, qty: 2, shippingWeightKg: 1.2 });
  assert.deepEqual(pricing, {
    subtotalIdr: 200000,
    feeIdr: 20000,
    shippingIdr: 90000,
    totalIdr: 310000,
  });
});

test("POST / creates an order and reserves stock atomically", async () => {
  const app = createAppForTest();
  const response = await request(app)
    .post("/")
    .set("Idempotency-Key", "order-1")
    .send({ user_id: 7, item_id: 10, qty: 2, shipping_weight_kg: 1.2 });

  assert.equal(response.status, 201);
  assert.equal(response.body.item_name, "KitKat Matcha");
  assert.equal(response.body.stock_remaining, 3);
  assert.equal(response.body.total_idr, 354000);
});

test("POST / replays the existing order for the same idempotency key", async () => {
  const app = createAppForTest();
  const payload = { user_id: 7, item_id: 10, qty: 1, shipping_weight_kg: 1 };

  const first = await request(app).post("/").set("Idempotency-Key", "same-key").send(payload);
  const second = await request(app).post("/").set("Idempotency-Key", "same-key").send(payload);

  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(first.body.id, second.body.id);
});

test("POST / returns 409 when stock is exhausted", async () => {
  const app = createAppForTest({ stock: 1 });
  const response = await request(app)
    .post("/")
    .send({ user_id: 7, item_id: 10, qty: 2, shipping_weight_kg: 1 });

  assert.equal(response.status, 409);
  assert.deepEqual(response.body, {
    error: {
      code: "STOK_HABIS",
      message: "Stok tidak mencukupi",
    },
  });
});

test("GET / returns paginated order history", async () => {
  const app = createAppForTest();
  await request(app).post("/").set("Idempotency-Key", "history-1").send({ user_id: 7, item_id: 10, qty: 1, shipping_weight_kg: 1 });

  const response = await request(app).get("/?user_id=7&page=1&limit=10");

  assert.equal(response.status, 200);
  assert.equal(response.body.total, 1);
  assert.equal(response.body.data.length, 1);
});

test("PATCH /:id/status updates status and appends status log", async () => {
  const app = createAppForTest();
  const created = await request(app)
    .post("/")
    .set("Idempotency-Key", "status-1")
    .send({ user_id: 7, item_id: 10, qty: 1, shipping_weight_kg: 1 });

  const updated = await request(app).patch(`/${created.body.id}/status`).send({ status: "dikirim" });
  const detail = await request(app).get(`/${created.body.id}`);

  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, "DIKIRIM");
  assert.equal(detail.status, 200);
  assert.equal(detail.body.status_log.length, 2);
});