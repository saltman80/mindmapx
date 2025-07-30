import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'
import { validate as isUuid } from 'uuid'

const allowedOrigin = process.env.CORS_ORIGIN || '*'

const COMMENT_MAX_LEN = 1000

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }
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
      if (!userId || !isUuid(userId)) {
        throw new Error('Invalid userId')
      }
    } catch (err) {
      console.error('Auth failure in todo-comments.ts:', err)
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }

    client = await getClient()
    console.debug('todo-comments raw body:', event.body)

    if (event.httpMethod === 'GET') {
      const { todoId, cardId } = event.queryStringParameters || {}
      if (cardId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'cardId not allowed' }) }
      }
      if (!todoId || !isUuid(todoId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid todoId' }) }
      }
      const check = await client.query('SELECT 1 FROM todos WHERE id=$1', [todoId])
      if (check.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Todo not found' }) }
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
      const contentType =
        event.headers['content-type'] || event.headers['Content-Type'] || ''
      if (!contentType.toLowerCase().includes('application/json')) {
        return {
          statusCode: 415,
          headers,
          body: JSON.stringify({ error: 'Unsupported Media Type' })
        }
      }
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
      }
      let parsed: any
      try {
        parsed = JSON.parse(event.body)
      } catch (err) {
        console.error('Invalid JSON in todo-comments body:', event.body, err)
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
      }
      console.debug('todo-comments parsed body:', parsed, 'userId:', userId)
      const { todoId, comment, cardId } = parsed as { todoId?: string; cardId?: string; comment?: string }
      if (cardId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'cardId not allowed' }) }
      }
      const commentText = (comment || '').trim()
      if (
        !todoId ||
        !isUuid(todoId) ||
        !commentText ||
        commentText.length > COMMENT_MAX_LEN
      ) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing or invalid fields' })
        }
      }
      const check = await client.query('SELECT 1 FROM todos WHERE id=$1', [todoId])
      if (check.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Todo not found' }) }
      }
      console.debug('Inserting comment for todoId:', todoId, 'userId:', userId)
      const insert = await client.query(
        `INSERT INTO todo_comments (todo_id, user_id, comment)
         VALUES ($1, $2, $3)
         RETURNING id, comment, created_at`,
        [todoId, userId, commentText]
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
