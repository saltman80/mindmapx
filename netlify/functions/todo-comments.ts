import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  try {
    const token = extractToken(event)
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    const session = await verifySession(token)
    const userId = session.userId

    const client = await getClient()

    if (event.httpMethod === 'GET') {
      const todoId = event.queryStringParameters?.todoId
      if (!todoId) {
        client.release()
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing todoId' }) }
      }
      const res = await client.query(
        `SELECT c.id, c.comment, c.created_at, u.name AS author
         FROM todo_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.todo_id = $1
         ORDER BY c.created_at ASC`,
        [todoId]
      )
      client.release()
      return { statusCode: 200, headers, body: JSON.stringify(res.rows) }
    }

    if (event.httpMethod === 'POST') {
      const { todoId, comment } = JSON.parse(event.body || '{}')
      if (!todoId || !comment) {
        client.release()
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) }
      }
      await client.query(
        `INSERT INTO todo_comments (todo_id, user_id, comment) VALUES ($1, $2, $3)`,
        [todoId, userId, comment]
      )
      client.release()
      return { statusCode: 201, headers, body: JSON.stringify({ status: 'ok' }) }
    }

    client.release()
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error('todo-comments error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  }
}
