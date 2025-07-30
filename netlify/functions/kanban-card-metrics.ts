import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  let userId: string
  try {
    const session = await verifySession(token)
    userId = (session as any).userId
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const client = await getClient()
  try {
    const dayRes = await client.query(
      `SELECT COUNT(*) FROM kanban_cards c
       JOIN kanban_columns col ON c.column_id=col.id
       JOIN kanban_boards b ON col.board_id=b.id
       WHERE (b.user_id=$1 OR b.user_id IN (SELECT user_id FROM team_members WHERE member_id=$1))
         AND col.title='Done' AND c.updated_at > NOW() - INTERVAL '1 day'`,
      [userId]
    )
    const weekRes = await client.query(
      `SELECT COUNT(*) FROM kanban_cards c
       JOIN kanban_columns col ON c.column_id=col.id
       JOIN kanban_boards b ON col.board_id=b.id
       WHERE (b.user_id=$1 OR b.user_id IN (SELECT user_id FROM team_members WHERE member_id=$1))
         AND col.title='Done' AND c.updated_at > NOW() - INTERVAL '7 day'`,
      [userId]
    )
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        doneToday: Number(dayRes.rows[0].count) || 0,
        doneWeek: Number(weekRes.rows[0].count) || 0
      })
    }
  } catch (err) {
    console.error('kanban-card-metrics error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
