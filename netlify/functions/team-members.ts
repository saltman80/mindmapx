import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
}

const payloadSchema = z.object({ email: z.string().email() })

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const auth = event.headers.authorization || event.headers.Authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let userId: string
  try {
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }
    userId = decoded.userId
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const db = await getClient()

  if (event.httpMethod === 'GET') {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.name
         FROM team_members tm
         JOIN users u ON tm.member_id = u.id
        WHERE tm.user_id = $1
        ORDER BY u.email`,
      [userId]
    )
    return { statusCode: 200, headers, body: JSON.stringify({ members: rows }) }
  }

  if (event.httpMethod === 'POST') {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
    }
    let data
    try {
      data = payloadSchema.parse(JSON.parse(event.body))
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid body' }) }
    }
    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [data.email])
    if (rows.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) }
    }
    const memberId = rows[0].id
    try {
      await db.query(
        'INSERT INTO team_members (user_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [userId, memberId]
      )
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
    } catch (err) {
      console.error('add team member error', err)
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) }
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
}
