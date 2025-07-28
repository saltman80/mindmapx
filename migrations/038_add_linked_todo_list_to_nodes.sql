ALTER TABLE nodes ADD COLUMN IF NOT EXISTS linked_todo_list_id UUID REFERENCES todo_lists(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_nodes_linked_todo_list_id ON nodes(linked_todo_list_id);
