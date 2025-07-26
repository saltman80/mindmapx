import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { z, ZodError } from 'zod'

const todoInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  list_id: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
})

async function getTodos(userId: string, list_id?: string) {
  const client = await getClient()
  try {
    const values: any[] = [userId]
    let sql = `SELECT id, user_id, title, description, completed, assignee_id, created_at, updated_at
                 FROM todos
                WHERE (user_id = $1 OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $1))`
    if (list_id) {
      values.push(list_id)
      sql += ` AND list_id = $2`
    }
    sql += ' ORDER BY created_at DESC'
    const res = await client.query(sql, values)
    return res.rows
  } finally {
    client.release()
  }
}

async function createTodo(userId: string, data: { title: string; description?: string; list_id?: string; nodeId?: string }) {
  const client = await getClient()
  try {
    const res = await client.query(
      `INSERT INTO todos (user_id, title, description, list_id, node_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, user_id, title, description, completed, assignee_id, created_at, updated_at`,
      [userId, data.title, data.description ?? null, data.list_id ?? null, data.nodeId ?? null]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
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
      const session = verifySession(token)
      userId = session.userId
      if (!userId) throw new Error('Missing userId')
    } catch (err) {
      console.error('Auth failure in todos.ts:', err)
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }

    if (event.httpMethod === 'GET') {
      const list_id = event.queryStringParameters?.list_id
      const todos = await getTodos(userId, list_id)
      return { statusCode: 200, headers, body: JSON.stringify(todos) }
    }

    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
      }
      let raw: unknown
      try {
        raw = JSON.parse(event.body)
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
      }
      let parsed
      try {
        parsed = todoInputSchema.parse(raw)
      } catch (err) {
        if (err instanceof ZodError) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid todo data', details: err.errors }) }
        }
        throw err
      }
      const todo = await createTodo(userId, parsed)
      return { statusCode: 201, headers, body: JSON.stringify(todo) }
    }

    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: { ...headers, 'Allow': 'GET,POST,OPTIONS' }, body: '' }
    }

    return { statusCode: 405, headers: { ...headers, Allow: 'GET,POST,OPTIONS' }, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err: any) {
    if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError || err.message === 'Unauthorized') {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }
    console.error('Unhandled error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  }
}
