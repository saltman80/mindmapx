CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token         TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  expires_at    TIMESTAMPTZ NOT NULL,
  used          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
