DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'mindmaps' AND column_name = 'description'
  ) THEN
    ALTER TABLE mindmaps ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'mindmaps' AND column_name = 'config'
  ) THEN
    ALTER TABLE mindmaps ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
  END IF;
END;
$$;
