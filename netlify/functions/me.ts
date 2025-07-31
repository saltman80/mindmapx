import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import cookie from 'cookie'
import jwt from 'jsonwebtoken'

const { JWT_SECRET } = process.env
if (!JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET')
  throw new Error('JWT_SECRET environment variable not set')
}

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

  try {
    const cookies = cookie.parse(event.headers.cookie || '')
    const token = cookies.token || cookies.session

    if (!token) {
      console.warn('⚠️ No token provided in cookies')
      return {
        statusCode: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized: missing token' })
      }
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    console.log('✅ Verified token payload:', payload)

    let client
    try {
      client = await getClient()
      const { rows } = await client.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [payload.userId]
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
        body: JSON.stringify({ authenticated: true, user: rows[0] })
      }
    } catch (err) {
      console.error('me endpoint error:', err)
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      }
    } finally {
      if (client) {
        client.release()
      }
    }
  } catch (err: any) {
    console.error('❌ Token verification failed:', err.message)
    return {
      statusCode: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }
}


