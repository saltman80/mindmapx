CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('mindmap', 'todo', 'kanban')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
