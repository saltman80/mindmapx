export interface NodeData {
  id: string
  x: number
  y: number
  label?: string
  description?: string
  parentId?: string | null
  todoId?: string | null
  mindmapId?: string
}

export interface EdgeData {
  id: string
  from: string
  to: string
}
