import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'
import { validate as isUuid } from 'uuid'
import { ZodError } from 'zod'
import { mapInputSchema } from './validationschemas.js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // ✅ CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let userId: string
  try {
    const session = await verifySession(token)
    userId = session.userId
    if (!isUuid(userId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid userId' })
      }
    }
  } catch (err) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const client = await getClient()

  try {
    // ✅ Handle POST
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
      }

      let parsed
      try {
        const payload = JSON.parse(event.body)
        parsed = mapInputSchema.parse(payload)
      } catch (err: any) {
        if (err instanceof ZodError) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Validation failed', details: err.errors }) }
        }
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
      }

      const result = await client.query(
        `INSERT INTO mindmaps (user_id, title, description, config)
         VALUES ($1, $2, $3, '{}'::jsonb)
         RETURNING id, title, description, created_at`,
        [userId, parsed.data.title, parsed.data.description]
      )

      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) }
    }

    // ✅ Handle GET
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id

      if (id) {
        const result = await client.query(
          `SELECT id, title, description, created_at FROM mindmaps WHERE id = $1 AND user_id = $2`,
          [id, userId]
        )

        if (result.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
        }

        return { statusCode: 200, headers, body: JSON.stringify({ map: result.rows[0] }) }
      }

      const result = await client.query(
        `SELECT id, title, description, created_at FROM mindmaps
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      )

      const maps = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        created_at: row.created_at,
      }))

      return { statusCode: 200, headers, body: JSON.stringify(maps) }
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) }
      }
      const result = await client.query(
        'DELETE FROM mindmaps WHERE id = $1 AND user_id = $2',
        [id, userId]
      )
      if (result.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      }
      return { statusCode: 204, headers, body: '' }
    }

    // ❌ No other method allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  } catch (err) {
    console.error('Mindmap function error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    client.release()
  }
}
