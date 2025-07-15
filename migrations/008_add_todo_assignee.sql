ALTER TABLE todos ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_todos_assignee_id ON todos(assignee_id);
