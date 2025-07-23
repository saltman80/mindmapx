DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'kanban_boards' AND column_name = 'description'
  ) THEN
    ALTER TABLE kanban_boards ADD COLUMN description TEXT;
  END IF;
END;
$$;
