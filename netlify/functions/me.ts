import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

const allowedOrigin = process.env.CORS_ORIGIN || '*'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, Allow: 'GET' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  const token = extractToken(event)
  if (!token) {
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  let session
  try {
    session = verifySession(token)
  } catch {
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid token' })
    }
  }

  const client = await getClient()
  try {
    const { rows } = await client.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [session.userId]
    )
    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' })
      }
    }
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: rows[0] })
    }
  } catch (err) {
    console.error('me endpoint error:', err)
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    }
  } finally {
    client.release()
  }
}

module.exports = { handler }
