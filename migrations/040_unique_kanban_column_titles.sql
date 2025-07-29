-- Deduplicate kanban column titles within each board before applying the
-- unique index. We keep the earliest created column for each duplicate set
-- and reassign any related tasks or cards to that column.
WITH duplicates AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY board_id, title
      ORDER BY created_at, id
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY board_id, title
      ORDER BY created_at, id
    ) AS rn
  FROM kanban_columns
)
UPDATE kanban_tasks t
SET column_id = d.keep_id
FROM duplicates d
WHERE t.column_id = d.id
  AND d.rn > 1;

UPDATE kanban_cards c
SET column_id = d.keep_id
FROM duplicates d
WHERE c.column_id = d.id
  AND d.rn > 1;

DELETE FROM kanban_columns c
USING duplicates d
WHERE c.id = d.id
  AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS unique_kanban_column_titles
  ON kanban_columns(board_id, title);
