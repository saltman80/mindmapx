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
      const cardId = event.queryStringParameters?.cardId
      if (!cardId || !isUuid(cardId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid cardId' }) }
      }
      const check = await client.query('SELECT 1 FROM kanban_cards WHERE id=$1', [cardId])
      if (check.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Card not found' }) }
      }
      console.debug('Fetching comments for cardId:', cardId, 'userId:', userId)
      const res = await client.query(
        `SELECT c.id, c.comment, c.created_at, u.name AS author
         FROM kanban_card_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.card_id = $1
         ORDER BY c.created_at ASC`,
        [cardId]
      )
      return { statusCode: 200, headers, body: JSON.stringify(res.rows) }
    }

    if (event.httpMethod === 'POST') {
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
      const { cardId, comment } = parsed as { cardId?: string; comment?: string }
      if (!cardId || !isUuid(cardId) || !comment?.trim()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) }
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
        [cardId, userId, comment]
      )
      const nameRes = await client.query('SELECT name FROM users WHERE id=$1', [userId])
      const inserted = insert.rows[0]
      const response = { ...inserted, author: nameRes.rows[0]?.name || 'You' }
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
