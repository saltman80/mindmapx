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
      console.error('Auth failure in kanban-card-comments.ts:', err)
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) }
    }

    client = await getClient()
    console.debug('kanban-card-comments raw body:', event.body)

    if (event.httpMethod === 'GET') {
      const { cardId, todoId } = event.queryStringParameters || {}
      if (todoId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'todoId not allowed' }) }
      }
      if (!cardId || !isUuid(cardId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid cardId' }) }
      }
      const check = await client.query('SELECT 1 FROM kanban_cards WHERE id=$1', [cardId])
      if (check.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Card not found' }) }
      }
      console.debug('Fetching comments for cardId:', cardId, 'userId:', userId)
        const res = await client.query(
          `SELECT c.id, c.comment, c.created_at, u.email AS author
           FROM kanban_card_comments c
           JOIN users u ON c.user_id = u.id
           WHERE c.card_id = $1
           ORDER BY c.created_at ASC`,
          [cardId]
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
        console.error('Invalid JSON in kanban-card-comments body:', event.body, err)
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
      }
      console.debug('kanban-card-comments parsed body:', parsed, 'userId:', userId)
      const { cardId, comment, todoId } = parsed as { cardId?: string; todoId?: string; comment?: string }
      if (todoId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'todoId not allowed' }) }
      }
      const commentText = (comment || '').trim()
      if (
        !cardId ||
        !isUuid(cardId) ||
        !commentText ||
        commentText.length > COMMENT_MAX_LEN
      ) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing or invalid fields' })
        }
      }
      const check = await client.query('SELECT 1 FROM kanban_cards WHERE id=$1', [cardId])
      if (check.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Card not found' }) }
      }
      console.debug('Inserting comment for cardId:', cardId, 'userId:', userId)
      const insert = await client.query(
        `INSERT INTO kanban_card_comments (card_id, user_id, comment)
         VALUES ($1, $2, $3)
         RETURNING id, comment, created_at`,
        [cardId, userId, commentText]
      )
      const emailRes = await client.query('SELECT email FROM users WHERE id=$1', [userId])
      const inserted = insert.rows[0]
      const response = { ...inserted, author: emailRes.rows[0]?.email || 'You' }
      return { statusCode: 201, headers, body: JSON.stringify(response) }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error('kanban-card-comments error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    if (client) client.release()
  }
}
