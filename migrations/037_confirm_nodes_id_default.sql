DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nodes'
      AND column_name = 'id'
      AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE nodes ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END;
$$;
