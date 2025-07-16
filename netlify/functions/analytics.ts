import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import type { Pool } from 'pg'
import { verify } from 'jsonwebtoken'
import { getClient } from '../netlify/functions/db-client'

const { DATABASE_URL, JWT_SECRET } = process.env
if (!DATABASE_URL) {
  throw new Error('Missing environment variable: DATABASE_URL')
}
if (!JWT_SECRET) {
  throw new Error('Missing environment variable: JWT_SECRET')
}

declare global {
  var __dbPool: Pool | undefined
}
const pool = getClient()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type'
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, Allow: 'GET' },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    }
  }

  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    }
  }

  const token = authHeader.split(' ')[1]
  let payload: any
  try {
    payload = verify(token, JWT_SECRET)
  } catch {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Invalid token' })
    }
  }

  if (!payload || (payload as any).role !== 'admin') {
    return {
      statusCode: 403,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Forbidden' })
    }
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)        AS total_users,
        (SELECT COUNT(*) FROM mind_maps)    AS total_mind_maps,
        (SELECT COUNT(*) FROM nodes)        AS total_nodes,
        (SELECT COUNT(*) FROM todos)        AS total_todos
    `)
    const row = rows[0]
    const data = {
      totalUsers:    Number(row.total_users),
      totalMindMaps: Number(row.total_mind_maps),
      totalNodes:    Number(row.total_nodes),
      totalTodos:    Number(row.total_todos)
    }
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data })
    }
  } catch (error: any) {
    console.error('Analytics query error:', error)
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Internal Server Error' })
    }
  }
}