export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  assignee_id: string | null
  assignee_name?: string | null
  assignee_email?: string | null
  created_at: string
  updated_at: string
}
