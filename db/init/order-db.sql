CREATE TABLE IF NOT EXISTS orders (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            BIGINT NOT NULL,
  item_id            BIGINT NOT NULL,
  qty                INTEGER NOT NULL CHECK (qty > 0),
  unit_price_idr     INTEGER NOT NULL CHECK (unit_price_idr > 0),
  subtotal_idr       INTEGER NOT NULL CHECK (subtotal_idr > 0),
  fee_idr            INTEGER NOT NULL CHECK (fee_idr >= 0),
  shipping_idr       INTEGER NOT NULL CHECK (shipping_idr >= 0),
  total_idr          INTEGER NOT NULL CHECK (total_idr > 0),
  shipping_weight_kg NUMERIC(10,2) NOT NULL CHECK (shipping_weight_kg > 0),
  status             TEXT NOT NULL,
  idempotency_key    TEXT UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_log (
  id         BIGSERIAL PRIMARY KEY,
  order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
