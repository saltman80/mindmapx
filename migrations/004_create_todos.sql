CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
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

BEGIN;

CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  mindmap_id UUID NOT NULL
);

COMMIT;