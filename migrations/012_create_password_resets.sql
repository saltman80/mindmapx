CREATE TABLE IF NOT EXISTS password_resets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  reset_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
