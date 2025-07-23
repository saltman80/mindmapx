import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let userId: string
  try {
    const session = verifySession(token) as { userId: string }
    userId = session.userId
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const client = await getClient()

  try {
    if (event.httpMethod === 'POST') {
      let data: { title?: string }
      try {
        data = JSON.parse(event.body || '{}')
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid body' }) }
      }
      const title = (data.title || '').trim()
      if (!title) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing title' }) }
      }
      const result = await client.query(
        'INSERT INTO kanban_boards (user_id, title, created_at, updated_at) VALUES ($1,$2,NOW(),NOW()) RETURNING id, title, created_at',
        [userId, title]
      )
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) }
    }

    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id
      if (id) {
        const { rows } = await client.query(
          'SELECT id, title, created_at FROM kanban_boards WHERE id = $1 AND (user_id = $2 OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $2))',
          [id, userId]
        )
        const board = rows[0]
        if (!board) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
        }
        return { statusCode: 200, headers, body: JSON.stringify({ board }) }
      }

      const { rows } = await client.query(
        `SELECT id, title, created_at
           FROM kanban_boards
          WHERE user_id = $1 OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $1)
          ORDER BY created_at DESC`,
        [userId]
      )
      return { statusCode: 200, headers, body: JSON.stringify({ boards: rows }) }
    }

    return { statusCode: 405, headers: { ...headers, Allow: 'GET,POST,OPTIONS' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
