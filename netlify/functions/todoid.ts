import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z } from 'zod'
import type { Todo } from './types.js'
import { extractToken, verifySession } from './auth.js'

type TodoInput = {
  title?: string
  description?: string | null
  completed?: boolean
  assignee_id?: string | null
  list_id?: string | null
}

const updateTodoSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullable().optional(),
    completed: z.boolean().optional(),
    assignee_id: z.string().uuid().nullable().optional(),
    list_id: z.string().uuid().nullable().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

async function getTodo(todoId: string, userId: string): Promise<Todo> {
  const client = await getClient()
  try {
    const result = await client.query(
      `SELECT t.id, t.user_id, t.title, t.description, t.completed,
              t.assignee_id, t.list_id, t.created_at, t.updated_at,
              u.name AS assignee_name, u.email AS assignee_email
         FROM todos t
         LEFT JOIN users u ON t.assignee_id = u.id
        WHERE t.id = $1 AND t.user_id = $2`,
      [todoId, userId]
    )
    const count = result.rowCount ?? 0
    if (count === 0) {
      throw new Error('NotFound')
    }
    return result.rows[0]
  } finally {
    client.release()
  }
}

async function updateTodo(
  todoId: string,
  data: TodoInput,
  userId: string
): Promise<Todo> {
  const fields: string[] = []
  const values: any[] = []
  let idx = 1
  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`)
    values.push(data.title)
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`)
    values.push(data.description)
  }
  if (data.completed !== undefined) {
    fields.push(`completed = $${idx++}`)
    values.push(data.completed)
  }
  if (data.assignee_id !== undefined) {
    fields.push(`assignee_id = $${idx++}`)
    values.push(data.assignee_id)
  }
  if (data.list_id !== undefined) {
    fields.push(`list_id = $${idx++}`)
    values.push(data.list_id)
  }
  values.push(todoId, userId)
  const idPos = idx++
  const userPos = idx
  const query = `
    UPDATE todos
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idPos} AND user_id = $${userPos}
    RETURNING id, user_id, title, description, completed, assignee_id, list_id, created_at, updated_at
  `
  const client = await getClient()
  try {
    const result = await client.query(query, values)
    const count = result.rowCount ?? 0
    if (count === 0) {
      throw new Error('NotFound')
    }
    return result.rows[0]
  } finally {
    client.release()
  }
}

async function deleteTodo(todoId: string, userId: string): Promise<void> {
  const client = await getClient()
  try {
    const result = await client.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    )
    const count = result.rowCount ?? 0
    if (count === 0) {
      throw new Error('NotFound')
    }
  } finally {
    client.release()
  }
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  try {
    const token = extractToken(event)
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }
    let userId: string
    try {
      const session = await verifySession(token)
      userId = session.userId
      if (!userId) throw new Error('Missing userId')
    } catch (err) {
      console.error('Auth failure in todoid.ts:', err)
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }
    const todoId = (event.path || '').split('/').pop()!
    if (!todoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing todoId' }),
      }
    }
    switch (event.httpMethod) {
      case 'GET': {
        const todo = await getTodo(todoId, userId)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(todo),
        }
      }
      case 'PUT': {
        let rawData: any
        try {
          rawData = JSON.parse(event.body || '{}')
        } catch {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON' }),
          }
        }
        const parseResult = updateTodoSchema.safeParse(rawData)
        if (!parseResult.success) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: parseResult.error.errors.map(e => e.message).join(', ') }),
          }
        }
        const updated = await updateTodo(todoId, parseResult.data, userId)

        if (parseResult.data.completed !== undefined) {
          const info = await getClient()
          try {
            const { rows: todoRow } = await info.query('SELECT linked_kanban_card_id FROM todos WHERE id=$1', [todoId])
            const cardId = todoRow[0]?.linked_kanban_card_id
            if (cardId) {
              const { rows: boardRows } = await info.query('SELECT board_id FROM canvas_links WHERE todo_id=$1', [todoId])
              const boardId = boardRows[0]?.board_id
              if (boardId) {
                const { rows: colRows } = await info.query("SELECT id FROM kanban_columns WHERE board_id=$1 AND title='Done'", [boardId])
                let doneId = colRows[0]?.id
                if (!doneId) {
                  const { rows } = await info.query("INSERT INTO kanban_columns (board_id, title, position) VALUES ($1,'Done',99) RETURNING id", [boardId])
                  doneId = rows[0].id
                }
                if (parseResult.data.completed === true && doneId) {
                  await info.query('UPDATE kanban_cards SET column_id=$1, updated_at=now() WHERE id=$2', [doneId, cardId])
                }
              }
            }
          } finally {
            info.release()
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updated),
        }
      }
      case 'DELETE': {
        await deleteTodo(todoId, userId)
        return {
          statusCode: 204,
          body: ''
        }
      }
      default:
        const allowHeaders: Record<string, string> = {
          ...headers,
          Allow: 'GET, PUT, DELETE',
        }
        return {
          statusCode: 405,
          headers: allowHeaders,
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        }
      }
  } catch (err: any) {
    if (err.message === 'NotFound') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Todo not found' }),
      }
    }
    console.error(err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}