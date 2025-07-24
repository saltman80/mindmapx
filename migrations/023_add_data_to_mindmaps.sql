DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'mindmaps' AND column_name = 'data'
  ) THEN
    ALTER TABLE mindmaps ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END;
$$;
