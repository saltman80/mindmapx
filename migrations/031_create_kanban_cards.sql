CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'low',
  due_date DATE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kanban_card_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_card_activity_card_id ON kanban_card_activity_log(card_id);
