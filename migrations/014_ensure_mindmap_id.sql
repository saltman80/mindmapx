-- Ensure mindmap_id column exists in core tables
ALTER TABLE nodes
  ADD COLUMN IF NOT EXISTS mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE;

ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_nodes_mindmap_id ON nodes(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_todos_mindmap_id ON todos(mindmap_id);
