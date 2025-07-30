import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'
import { validate as isUuid } from 'uuid'

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  let client
  try {
    const token = extractToken(event)
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    let userId: string
    try {
      const session = await verifySession(token)
      userId = session.userId
    } catch (err) {
      console.error('Auth failure in todo-comments.ts:', err)
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }

    client = await getClient()

    if (event.httpMethod === 'GET') {
      const todoId = event.queryStringParameters?.todoId
      if (!todoId || !isUuid(todoId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid todoId' }) }
      }
      const res = await client.query(
        `SELECT c.id, c.comment, c.created_at, u.name AS author
         FROM todo_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.todo_id = $1
         ORDER BY c.created_at ASC`,
        [todoId]
      )
      return { statusCode: 200, headers, body: JSON.stringify(res.rows) }
    }

    if (event.httpMethod === 'POST') {
      const { todoId, comment } = JSON.parse(event.body || '{}')
      if (!todoId || !isUuid(todoId) || !comment) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) }
      }
      const insert = await client.query(
        `INSERT INTO todo_comments (todo_id, user_id, comment)
         VALUES ($1, $2, $3)
         RETURNING id, comment, created_at`,
        [todoId, userId, comment]
      )
      const nameRes = await client.query('SELECT name FROM users WHERE id=$1', [userId])
      const inserted = insert.rows[0]
      const response = { ...inserted, author: nameRes.rows[0]?.name || 'You' }
      return { statusCode: 201, headers, body: JSON.stringify(response) }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error('todo-comments error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    if (client) client.release()
  }
}
