CREATE TABLE IF NOT EXISTS canvas_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  todo_id UUID REFERENCES todos(id) ON DELETE SET NULL,
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_canvas_links_node_id ON canvas_links(node_id);
CREATE INDEX IF NOT EXISTS idx_canvas_links_todo_id ON canvas_links(todo_id);
CREATE INDEX IF NOT EXISTS idx_canvas_links_board_id ON canvas_links(board_id);
