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

  const boardId = event.queryStringParameters?.id
  if (!boardId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) }
  }

  const client = await getClient()
  try {
    const chk = await client.query(
      `SELECT id FROM kanban_boards WHERE id=$1 AND (user_id=$2 OR user_id IN (
         SELECT user_id FROM team_members WHERE member_id=$2
       ))`,
      [boardId, userId]
    )
    if (chk.rows.length === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
    }

    const { rows: columns } = await client.query(
      `SELECT id, board_id, title, position
         FROM kanban_columns
        WHERE board_id=$1
        ORDER BY position`,
      [boardId]
    )

    const { rows: cards } = await client.query(
      `SELECT c.id, c.column_id, c.title, c.description, c.status, c.priority,
              c.due_date, c.assignee_id, c.position
         FROM kanban_cards c
         JOIN kanban_columns col ON c.column_id=col.id
        WHERE col.board_id=$1
        ORDER BY c.position`,
      [boardId]
    )

    return { statusCode: 200, headers, body: JSON.stringify({ columns, cards }) }
  } catch (err) {
    console.error('kanban-board-data error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
