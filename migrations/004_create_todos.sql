CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'todo_ai_status'
  ) THEN
    CREATE TYPE todo_ai_status AS ENUM (
      'pending',
      'in_progress',
      'completed',
      'failed'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'todo_status'
  ) THEN
    CREATE TYPE todo_status AS ENUM (
      'pending',
      'in_progress',
      'completed',
      'cancelled'
    );
  END IF;
END;
$$;

BEGIN;

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  mindmap_id UUID NOT NULL,
  node_id UUID DEFAULT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status todo_status NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  ai_status todo_ai_status,
  ai_response JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mindmap_id) REFERENCES mindmaps(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE SET NULL
);

COMMIT;

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
