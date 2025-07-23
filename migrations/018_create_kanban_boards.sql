CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_set_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_kanban_boards_updated_at ON kanban_boards;
CREATE TRIGGER set_kanban_boards_updated_at
BEFORE UPDATE ON kanban_boards
FOR EACH ROW EXECUTE PROCEDURE trigger_set_boards_updated_at();

CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON kanban_boards(user_id);
