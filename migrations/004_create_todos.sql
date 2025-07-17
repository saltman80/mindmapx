CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE IF NOT EXISTS todo_ai_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'failed'
);

CREATE TYPE IF NOT EXISTS todo_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mindmap_id UUID NOT NULL REFERENCES mindmaps(id) ON DELETE CASCADE,
  node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status todo_status NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_status todo_ai_status,
  ai_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_mindmap_id ON todos(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_todos_node_id ON todos(node_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_at ON todos(due_at);
CREATE INDEX IF NOT EXISTS idx_todos_user_id_status ON todos(user_id, status);

CREATE OR REPLACE FUNCTION refresh_todos_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refresh_todos_updated_at ON todos;
CREATE TRIGGER trg_refresh_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE PROCEDURE refresh_todos_updated_at();