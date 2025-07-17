CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'payment_status'
  ) THEN
    CREATE TYPE payment_status AS ENUM (
      'pending',
      'succeeded',
      'failed',
      'requires_payment_method',
      'requires_action',
      'canceled',
      'refunded'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status payment_status NOT NULL DEFAULT 'pending',
  raw_event JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at);

DROP FUNCTION IF EXISTS payments_set_updated_at() CASCADE;
CREATE FUNCTION payments_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payments_updated_at_v2 ON payments;
CREATE TRIGGER set_payments_updated_at_v2
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE PROCEDURE payments_set_updated_at();