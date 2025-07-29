CREATE UNIQUE INDEX IF NOT EXISTS unique_canvas_links_todo_board
  ON canvas_links(todo_id, board_id);
