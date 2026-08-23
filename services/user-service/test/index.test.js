const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../src/index.js");

function createPoolDouble() {
  const users = [];

  return {
    async query(queryText, params) {
      if (queryText.includes("SELECT id, nama, email, no_wa, role, created_at FROM users WHERE id = $1")) {
        const user = users.find((entry) => entry.id === params[0]);
        return { rows: user ? [user] : [] };
      }

      if (queryText.includes("SELECT * FROM users WHERE email = $1")) {
        const user = users.find((entry) => entry.email === params[0]);
        return { rows: user ? [user] : [] };
      }

      if (queryText.includes("INSERT INTO users")) {
        if (users.some((entry) => entry.email === params[1])) {
          const error = new Error("duplicate");
          error.code = "23505";
          throw error;
        }

        const created = {
          id: users.length + 1,
          nama: params[0],
          email: params[1],
          no_wa: params[2],
          password_hash: params[3],
          role: params[4],
          created_at: new Date().toISOString(),
        };
        users.push(created);
        return { rows: [created] };
      }

      throw new Error(`Unhandled query: ${queryText}`);
    },
  };
}

const bcryptDouble = {
  async hash(password) {
    return `hashed:${password}`;
  },
  async compare(password, hash) {
    return hash === `hashed:${password}`;
  },
};

const jwtDouble = {
  sign(payload) {
    return `token-${payload.sub}`;
  },
};

test("POST /register creates a user", async () => {
  const app = createApp({
    pool: createPoolDouble(),
    bcryptLib: bcryptDouble,
    jwtLib: jwtDouble,
    jwtSecret: "secret-1234567890",
  });

  const response = await request(app).post("/register").send({
    nama: "Agus",
    email: "agus@example.com",
    no_wa: "08123",
    password: "password123",
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.email, "agus@example.com");
});

test("POST /login returns token for valid credentials", async () => {
  const pool = createPoolDouble();
  const app = createApp({
    pool,
    bcryptLib: bcryptDouble,
    jwtLib: jwtDouble,
    jwtSecret: "secret-1234567890",
  });

  await request(app).post("/register").send({
    nama: "Agus",
    email: "agus@example.com",
    no_wa: "08123",
    password: "password123",
  });

  const response = await request(app).post("/login").send({
    email: "agus@example.com",
    password: "password123",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.token, "token-1");
});

test("GET /users/:id returns public user data", async () => {
  const pool = createPoolDouble();
  const app = createApp({
    pool,
    bcryptLib: bcryptDouble,
    jwtLib: jwtDouble,
    jwtSecret: "secret-1234567890",
  });

  await request(app).post("/register").send({
    nama: "Agus",
    email: "agus@example.com",
    no_wa: "08123",
    password: "password123",
  });

  const response = await request(app).get("/users/1");

  assert.equal(response.status, 200);
  assert.equal(response.body.nama, "Agus");
});