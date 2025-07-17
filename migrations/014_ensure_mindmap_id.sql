-- Ensure mindmap_id column exists in core tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'nodes' AND column_name = 'mindmap_id'
  ) THEN
    ALTER TABLE nodes
      ADD COLUMN mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'mindmap_id'
  ) THEN
    ALTER TABLE todos
      ADD COLUMN mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_nodes_mindmap_id ON nodes(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_todos_mindmap_id ON todos(mindmap_id);
