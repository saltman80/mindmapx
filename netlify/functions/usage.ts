import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { requireAuth } from '../lib/auth.js'
import { TOTAL_AI_LIMIT } from './limits.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let userId: string
  try {
    ;({ userId } = requireAuth(event))
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  const client = await getClient()
  try {
    const { rows } = await client.query(
      `SELECT
        (SELECT COUNT(*) FROM mindmaps WHERE user_id = $1) AS mindmaps,
        (SELECT COUNT(*) FROM todo_lists WHERE user_id = $1) AS todo_lists,
        (SELECT COUNT(*) FROM kanban_boards WHERE user_id = $1) AS boards,
        (SELECT COUNT(*) FROM usage_events WHERE user_id = $1 AND event_type='ai_create' AND created_at >= date_trunc('month', CURRENT_DATE)) AS ai_usage`,
      [userId]
    )
    const r = rows[0]
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mindmaps: Number(r.mindmaps),
        todoLists: Number(r.todo_lists),
        boards: Number(r.boards),
        aiUsage: Number(r.ai_usage),
        aiLimit: TOTAL_AI_LIMIT
      })
    }
  } catch (err) {
    console.error('usage error:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  } finally {
    client.release()
  }
}
