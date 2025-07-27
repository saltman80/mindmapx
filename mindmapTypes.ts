export interface NodePayload {
  mindmapId: string
  x?: number
  y?: number
  label?: string | null
  description?: string | null
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
