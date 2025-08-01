import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import cookie from 'cookie'
import type { PoolClient } from 'pg'
import { validate as isUuid } from 'uuid'
import { verifySession } from './auth.js'

const allowedOrigin = process.env.CORS_ORIGIN || '*'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

async function columnExists(
  client: PoolClient,
  table: string,
  column: string
): Promise<boolean> {
  const res = await client.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2',
    [table, column]
  )
  return typeof res.rowCount === 'number' && res.rowCount > 0
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

    const payload = await verifySession(token)
    console.log('✅ Verified token payload:', payload)

    if (!isUuid(payload.userId)) {
      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authenticated: true,
          user: {
            id: payload.userId,
            email: payload.email,
            role: payload.role
          }
        })
      }
    }

    let client
    try {
      client = await getClient()

      const hasName = await columnExists(client, 'users', 'name')
      const hasRole = await columnExists(client, 'users', 'role')

      const fields = ['id', 'email']
      if (hasName) fields.push('name')
      if (hasRole) fields.push('role')

      const { rows } = await client.query(
        `SELECT ${fields.join(', ')} FROM users WHERE id = $1`,
        [payload.userId]
      )
      if (rows.length === 0) {
        return {
          statusCode: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'User not found' })
        }
      }

      const user = rows[0] as any
      if (!hasRole && payload.role) {
        user.role = payload.role
      }

      return {
        statusCode: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ authenticated: true, user })
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


