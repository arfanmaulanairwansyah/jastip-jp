const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../src/index.js");

function createRedisDouble() {
  const store = new Map();
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async keys(pattern) {
      const prefix = pattern.replace("*", "");
      return [...store.keys()].filter((key) => key.startsWith(prefix));
    },
    async del(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        store.delete(key);
      }
    },
  };
}

function createPoolDouble() {
  const items = [
    {
      id: 10,
      nama: "KitKat Matcha",
      kategori: "snack",
      harga_idr: 120000,
      stok: 8,
      deskripsi: "Camilan khas Jepang.",
      created_at: new Date().toISOString(),
    },
  ];

  return {
    async query(queryText, params) {
      if (queryText.includes("COUNT(*)::int AS total")) {
        return { rows: [{ total: items.length }] };
      }

      if (queryText.includes("FROM items i") && queryText.includes("ORDER BY i.id")) {
        return { rows: items };
      }

      if (queryText.includes("WHERE i.id = $1")) {
        return { rows: items.filter((item) => item.id === params[0]) };
      }

      if (queryText.includes("UPDATE items i") && queryText.includes("SET stok = $2")) {
        const item = items.find((entry) => entry.id === params[0]);
        if (!item) {
          return { rows: [] };
        }
        item.stok = params[1];
        return { rows: [item] };
      }

      throw new Error(`Unhandled query: ${queryText}`);
    },
    async connect() {
      return {
        async query(queryText, params) {
          if (queryText === "BEGIN" || queryText === "COMMIT" || queryText === "ROLLBACK") {
            return;
          }

          if (queryText.includes("INSERT INTO categories")) {
            return { rows: [{ id: 1, nama: params[0] }] };
          }

          if (queryText.includes("INSERT INTO items")) {
            const created = {
              id: 11,
              nama: params[1],
              harga_idr: params[2],
              stok: params[3],
              deskripsi: params[4],
              created_at: new Date().toISOString(),
            };
            items.push({ ...created, kategori: "snack" });
            return { rows: [created] };
          }

          throw new Error(`Unhandled client query: ${queryText}`);
        },
        release() {},
      };
    },
  };
}

test("GET / returns paginated catalog data", async () => {
  const app = createApp({ pool: createPoolDouble(), redis: createRedisDouble() });
  const response = await request(app).get("/?page=1&limit=20");

  assert.equal(response.status, 200);
  assert.equal(response.body.total, 1);
  assert.equal(response.body.data[0].nama, "KitKat Matcha");
});

test("GET /:id returns an item detail", async () => {
  const app = createApp({ pool: createPoolDouble(), redis: createRedisDouble() });
  const response = await request(app).get("/10");

  assert.equal(response.status, 200);
  assert.equal(response.body.harga_idr, 120000);
});

test("PATCH /:id/stok updates stock", async () => {
  const app = createApp({ pool: createPoolDouble(), redis: createRedisDouble() });
  const response = await request(app).patch("/10/stok").send({ stok: 4 });

  assert.equal(response.status, 200);
  assert.equal(response.body.stok, 4);
});