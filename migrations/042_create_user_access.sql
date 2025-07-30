CREATE TABLE IF NOT EXISTS user_access (
  email TEXT PRIMARY KEY,
  auth0_id TEXT,
  has_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION trigger_set_user_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_access_updated_at ON user_access;
CREATE TRIGGER set_user_access_updated_at
BEFORE UPDATE ON user_access
FOR EACH ROW EXECUTE PROCEDURE trigger_set_user_access_updated_at();
