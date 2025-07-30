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
    console.debug('todo-comments raw body:', event.body)

    if (event.httpMethod === 'GET') {
      const todoId = event.queryStringParameters?.todoId
      if (!todoId || !isUuid(todoId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid todoId' }) }
      }
      console.debug('Fetching comments for todoId:', todoId, 'userId:', userId)
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
      let parsed: any
      try {
        parsed = JSON.parse(event.body || '{}')
      } catch (err) {
        console.error('Invalid JSON in todo-comments body:', event.body, err)
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
      }
      console.debug('todo-comments parsed body:', parsed, 'userId:', userId)
      const { todoId, comment } = parsed as { todoId?: string; comment?: string }
      if (!todoId || !isUuid(todoId) || !comment) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) }
      }
      console.debug('Inserting comment for todoId:', todoId, 'userId:', userId)
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
