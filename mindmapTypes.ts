export interface NodePayload {
  mindmapId: string
  x?: number
  y?: number
  label?: string | null
  description?: string | null
  parentId?: string | null
  linkedTodoListId?: string | null
}

export type Direction = 'tr' | 'br' | 'bl' | 'tl'

export interface NodeData extends NodePayload {
  id: string
  todoId?: string | null
  /** Optional quadrant used for client-side layout */
  direction?: Direction
}

export interface EdgeData {
  id: string
  from: string
  to: string
}
