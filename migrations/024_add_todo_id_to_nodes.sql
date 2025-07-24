DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nodes' AND column_name = 'todo_id'
  ) THEN
    ALTER TABLE nodes ADD COLUMN todo_id UUID REFERENCES todos(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_nodes_todo_id ON nodes(todo_id);
