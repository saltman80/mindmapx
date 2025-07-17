CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id),
  product_id    UUID NOT NULL REFERENCES products(id),
  quantity      INTEGER NOT NULL,
  unit_price    NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
