export interface Todo {
  id:           string
  user_id:      string
  title:        string
  description:  string
  assignee_id:  string
  completed:    boolean
  created_at:   string
  updated_at:   string
}

export interface TodoList {
  id:         string
  user_id:    string
  title:      string
  created_at: string
  updated_at: string
}

export interface NodePayload {
  mindmapId: string
  x: number
  y: number
  label?: string
  description?: string
  parentId?: string | null
}

import type { HandlerEvent, HandlerContext } from '@netlify/functions'

export interface HandlerResponse {
  statusCode: number
  headers?: Record<string, string>
  body?: string
}

export type Handler = (
  event: HandlerEvent,
  context: HandlerContext
) => HandlerResponse | Promise<HandlerResponse>
