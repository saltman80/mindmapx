DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'todos' AND column_name = 'description'
  ) THEN
    ALTER TABLE todos ADD COLUMN description TEXT;
  END IF;
END;
$$;
