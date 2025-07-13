CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mind_map_id UUID NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_mind_map_id ON nodes (mind_map_id);
CREATE INDEX idx_nodes_parent_id ON nodes (parent_id);

CREATE OR REPLACE FUNCTION nodes_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nodes_set_updated_at ON nodes;
CREATE TRIGGER nodes_set_updated_at
BEFORE UPDATE ON nodes
FOR EACH ROW
EXECUTE PROCEDURE nodes_update_updated_at();

COMMIT;