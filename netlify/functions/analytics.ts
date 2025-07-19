import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  throw new Error('Missing environment variable: DATABASE_URL')
}



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

  const token = extractToken(event)
  if (!token) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Unauthorized' })
    }
  }

  let payload: any
  try {
    payload = verifySession(token)
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

  const pool = await getClient()

  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)        AS total_users,
        (SELECT COUNT(*) FROM mindmaps)    AS total_mindmaps,
        (SELECT COUNT(*) FROM nodes)        AS total_nodes,
        (SELECT COUNT(*) FROM todos)        AS total_todos
    `)
    const row = rows[0]
    const data = {
      totalUsers:    Number(row.total_users),
      totalMindMaps: Number(row.total_mindmaps),
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