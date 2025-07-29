CREATE UNIQUE INDEX IF NOT EXISTS unique_kanban_column_titles
  ON kanban_columns(board_id, title);
