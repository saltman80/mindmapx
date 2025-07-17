DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE todos
      ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS idx_todos_assignee_id ON todos(assignee_id);
