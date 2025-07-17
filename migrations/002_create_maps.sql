CREATE TABLE IF NOT EXISTS mindmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_mindmaps_updated_at_v2 ON mindmaps;
CREATE TRIGGER set_mindmaps_updated_at_v2
BEFORE UPDATE ON mindmaps
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_mindmaps_user_id ON mindmaps(user_id);