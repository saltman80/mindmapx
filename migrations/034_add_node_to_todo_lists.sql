ALTER TABLE todo_lists ADD COLUMN IF NOT EXISTS node_id UUID REFERENCES nodes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_todo_lists_node_id ON todo_lists(node_id);
