export interface NodePayload {
  mindmapId: string
  x: number
  y: number
  label?: string
  description?: string
  parentId?: string | null
}

export interface NodeData extends NodePayload {
  id: string
  todoId?: string | null
}

export interface EdgeData {
  id: string
  from: string
  to: string
}
