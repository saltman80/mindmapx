import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client'
import { extractToken, verifySession } from './auth'
import { ZodError } from 'zod'
import { mapInputSchema } from './validationschemas'

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
    const session = verifySession(token)
    userId = session.userId
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
        `INSERT INTO mindmaps (user_id, title, description, config) VALUES ($1, $2, $3, '{}'::jsonb)
         RETURNING id, title, description, created_at`,
        [userId, parsed.data.title, parsed.data.description]
      )

      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) }
    }

    // ✅ Handle GET
    if (event.httpMethod === 'GET') {
      const result = await client.query(
        `SELECT id, title, description, created_at FROM mindmaps
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      )

      return { statusCode: 200, headers, body: JSON.stringify(result.rows) }
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
