export interface MapItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
  data?: { title?: string; [key: string]: any }
}

export interface TodoItem {
  id: string
  title?: string
  content?: string
  completed?: boolean
  mindmap_id?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface BoardItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
}

export interface NodeItem {
  id: string
  createdAt?: string
  created_at?: string
}

export const validateMaps = (data: any): MapItem[] => {
  return Array.isArray(data) && data.every(d => d && typeof d.id === 'string')
    ? (data as MapItem[])
    : []
}

export const validateTodos = (data: any): TodoItem[] => {
  return Array.isArray(data) && data.every(d => d && typeof d.id === 'string')
    ? (data as TodoItem[])
    : []
}

export const validateBoards = (data: any): BoardItem[] => {
  return Array.isArray(data) && data.every(d => d && typeof d.id === 'string')
    ? (data as BoardItem[])
    : []
}

export const validateNodes = (data: any): NodeItem[] => {
  return Array.isArray(data) && data.every(d => d && typeof d.id === 'string')
    ? (data as NodeItem[])
    : []
}
