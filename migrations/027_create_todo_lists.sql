CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_set_todo_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_todo_lists_updated_at ON todo_lists;
CREATE TRIGGER set_todo_lists_updated_at
BEFORE UPDATE ON todo_lists
FOR EACH ROW EXECUTE PROCEDURE trigger_set_todo_lists_updated_at();

CREATE INDEX IF NOT EXISTS idx_todo_lists_user_id ON todo_lists(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'list_id'
  ) THEN
    ALTER TABLE todos ADD COLUMN list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_todos_list_id ON todos(list_id);
