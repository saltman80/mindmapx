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
  mindmap_id UUID NOT NULL
);

COMMIT;