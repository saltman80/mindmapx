CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS analytics;
REVOKE ALL ON SCHEMA analytics FROM PUBLIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'event_type_enum'
  ) THEN
    CREATE TYPE analytics.event_type_enum AS ENUM (
      'page_view',
      'click',
      'purchase',
      'login',
      'logout'
    );
  END IF;
END;
$$;
REVOKE ALL ON TYPE analytics.event_type_enum FROM PUBLIC;

CREATE TABLE IF NOT EXISTS analytics.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type analytics.event_type_enum NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resource TEXT,
  resource_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
REVOKE ALL ON TABLE analytics.events FROM PUBLIC;

CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics.events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics.events(user_id);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics.events(created_at);
CREATE INDEX IF NOT EXISTS analytics_events_resource_resource_id_idx ON analytics.events(resource, resource_id);