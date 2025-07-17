CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'nodes' AND column_name = 'mindmap_id'
  ) THEN
    ALTER TABLE nodes
      ADD COLUMN mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_nodes_mindmap_id ON nodes (mindmap_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes (parent_id);

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