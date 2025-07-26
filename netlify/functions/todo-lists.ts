import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const token = extractToken(event)
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }
    let userId: string
    try {
      const session = verifySession(token)
      userId = session.userId
    } catch {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }
    const client = await getClient()
    if (event.httpMethod === 'GET') {
      const listsRes = await client.query(
        `SELECT l.id, l.title, l.created_at, l.updated_at,
                COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'description', t.description, 'completed', t.completed)) FILTER (WHERE t.id IS NOT NULL), '[]') AS todos
           FROM todo_lists l
           LEFT JOIN todos t ON t.list_id = l.id
          WHERE l.user_id = $1
          GROUP BY l.id
          ORDER BY l.created_at DESC`,
        [userId]
      )
      const unassignedRes = await client.query(
        `SELECT id, title, description, completed
           FROM todos
          WHERE user_id = $1 AND list_id IS NULL
          ORDER BY created_at DESC`,
        [userId]
      )
      client.release()
      const rows = listsRes.rows
      if (unassignedRes.rows.length > 0) {
        rows.push({ id: null, title: 'Unassigned Todos', todos: unassignedRes.rows })
      }
      return { statusCode: 200, headers, body: JSON.stringify(rows) }
    }
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        client.release();
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      }
      let data: any
      try { data = JSON.parse(event.body) } catch { data = {} }
      const title = data.title
      if (!title || typeof title !== 'string') {
        client.release();
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid title' }) }
      }
      const res = await client.query(
        'INSERT INTO todo_lists (user_id, title) VALUES ($1,$2) RETURNING id, title, created_at, updated_at',
        [userId, title]
      )
      client.release()
      return { statusCode: 201, headers, body: JSON.stringify(res.rows[0]) }
    }
    if (event.httpMethod === 'OPTIONS') {
      client.release()
      return { statusCode: 204, headers: { ...headers, Allow: 'GET,POST,OPTIONS' }, body: '' }
    }
    client.release()
    return { statusCode: 405, headers: { ...headers, Allow: 'GET,POST,OPTIONS' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error('todo-lists error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  }
}
