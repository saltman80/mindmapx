import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from "./db-client.js"
import { LIMIT_TODO_LISTS } from "./limits.js"
import { extractToken, verifySession } from './auth.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
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
    } catch {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }
    const client = await getClient()
    if (event.httpMethod === 'GET') {
      const listsRes = await client.query(
        `SELECT l.id, l.title, l.node_id, l.created_at, l.updated_at,
                COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'description', t.description, 'completed', t.completed)) FILTER (WHERE t.id IS NOT NULL), '[]') AS todos
           FROM todo_lists l
           LEFT JOIN todos t ON t.list_id = l.id
          WHERE l.user_id = $1
          GROUP BY l.id, l.node_id
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
      const nodeId = data.nodeId || null
      const countRes = await client.query('SELECT COUNT(*) FROM todo_lists WHERE user_id = $1', [userId])
      if (Number(countRes.rows[0].count) >= LIMIT_TODO_LISTS) {
        client.release()
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Todo list limit reached' }) }
      }
      const res = await client.query(
        'INSERT INTO todo_lists (user_id, title, node_id) VALUES ($1,$2,$3) RETURNING id, title, node_id, created_at, updated_at',
        [userId, title, nodeId]
      )
      client.release()
      return { statusCode: 201, headers, body: JSON.stringify(res.rows[0]) }
    }
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id
      if (!id) {
        client.release()
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) }
      }
      const result = await client.query(
        'DELETE FROM todo_lists WHERE id = $1 AND user_id = $2',
        [id, userId]
      )
      client.release()
      if (result.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not Found' }) }
      }
      return { statusCode: 204, headers, body: '' }
    }
    if (event.httpMethod === 'OPTIONS') {
      client.release()
      return { statusCode: 204, headers: { ...headers, Allow: 'GET,POST,DELETE,OPTIONS' }, body: '' }
    }
    client.release()
    return { statusCode: 405, headers: { ...headers, Allow: 'GET,POST,DELETE,OPTIONS' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error('todo-lists error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  }
}
