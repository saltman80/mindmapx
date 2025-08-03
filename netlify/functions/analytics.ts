import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  let user: any
  try {
    user = await verifySession(token)
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }
  if (user.role !== 'admin') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  const daysParam = parseInt(event.queryStringParameters?.days || '30', 10)
  const days = isNaN(daysParam) ? 30 : Math.min(Math.max(daysParam, 1), 90)

  const endDate = new Date()
  endDate.setUTCHours(23, 59, 59, 999)
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - days + 1)
  startDate.setUTCHours(0, 0, 0, 0)

  const client = await getClient()
  try {
    const { rows } = await client.query(
      `
      WITH series AS (
        SELECT generate_series($1::date, $2::date, '1 day') AS day
      ),
      k AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM kanban_boards WHERE created_at >= $1 AND created_at <= $2 GROUP BY 1
      ),
      tl AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM todo_lists WHERE created_at >= $1 AND created_at <= $2 GROUP BY 1
      ),
      t AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM todos WHERE created_at >= $1 AND created_at <= $2 GROUP BY 1
      ),
      m AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM mindmaps WHERE created_at >= $1 AND created_at <= $2 GROUP BY 1
      ),
      n AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM nodes WHERE created_at >= $1 AND created_at <= $2 GROUP BY 1
      ),
      ai AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM ai_usage WHERE created_at >= $1 AND created_at <= $2 GROUP BY 1
      )
      SELECT s.day,
             COALESCE(k.cnt,0)  AS kanbans,
             COALESCE(tl.cnt,0) AS todo_lists,
             COALESCE(t.cnt,0)  AS todos,
             COALESCE(m.cnt,0)  AS mindmaps,
             COALESCE(n.cnt,0)  AS nodes,
             COALESCE(ai.cnt,0) AS ai_processes
      FROM series s
      LEFT JOIN k ON s.day = k.day
      LEFT JOIN tl ON s.day = tl.day
      LEFT JOIN t ON s.day = t.day
      LEFT JOIN m ON s.day = m.day
      LEFT JOIN n ON s.day = n.day
      LEFT JOIN ai ON s.day = ai.day
      ORDER BY s.day
      `,
      [startDate.toISOString(), endDate.toISOString()]
    )

    return { statusCode: 200, headers, body: JSON.stringify({ data: rows }) }
  } catch (err) {
    console.error('analytics error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    client.release()
  }
}
