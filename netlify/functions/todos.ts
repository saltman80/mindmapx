import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client'
import { extractToken, verifySession } from './auth'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { z, ZodError } from 'zod'

const todoInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
})

async function getTodos(userId: string) {
  const client = await getClient()
  try {
    const res = await client.query(
      `SELECT id, user_id, title, description, completed, assignee_id, created_at, updated_at
         FROM todos
        WHERE user_id = $1 OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $1)
        ORDER BY created_at DESC`,
      [userId]
    )
    return res.rows
  } finally {
    client.release()
  }
}

async function createTodo(userId: string, data: { title: string; description?: string }) {
  const client = await getClient()
  try {
    const res = await client.query(
      `INSERT INTO todos (user_id, title, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, user_id, title, description, completed, assignee_id, created_at, updated_at`,
      [userId, data.title, data.description ?? null]
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
      const todos = await getTodos(userId)
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
