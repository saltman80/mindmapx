ALTER TABLE todos ADD COLUMN IF NOT EXISTS linked_kanban_card_id UUID;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS linked_todo_id UUID REFERENCES todos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_todos_linked_kanban ON todos(linked_kanban_card_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_todo_id ON kanban_cards(linked_todo_id);
