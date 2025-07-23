DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'mindmaps' AND column_name = 'title'
  ) THEN
    ALTER TABLE mindmaps ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'mindmaps' AND column_name = 'description'
  ) THEN
    ALTER TABLE mindmaps ADD COLUMN description TEXT;
  END IF;
END;
$$;
