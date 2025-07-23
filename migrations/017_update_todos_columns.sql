DO $$
BEGIN
  -- Title column for todoid.ts and list.ts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'title'
  ) THEN
    ALTER TABLE todos ADD COLUMN title TEXT;
  END IF;
  -- Description column used by TypeScript API
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'description'
  ) THEN
    ALTER TABLE todos ADD COLUMN description TEXT;
  END IF;
  -- Node reference for linking todos to nodes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'node_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN node_id UUID REFERENCES nodes(id) ON DELETE SET NULL;
  END IF;
  -- Mind map reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'mindmap_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE;
  END IF;
  -- Due date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE todos ADD COLUMN due_date TIMESTAMPTZ;
  END IF;
  -- Assignee column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_todos_node_id ON todos(node_id);
CREATE INDEX IF NOT EXISTS idx_todos_mindmap_id ON todos(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_todos_assignee_id ON todos(assignee_id);
