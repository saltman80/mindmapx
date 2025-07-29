import type { Handler } from '@netlify/functions'
import type { PoolClient } from 'pg'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

async function ensureDefaultColumns(client: PoolClient, boardId: string) {
  const { rows } = await client.query(
    'SELECT id, title, position FROM kanban_columns WHERE board_id=$1 ORDER BY position',
    [boardId]
  )
  if (rows.length === 0) {
    const defaults = ['New', 'In-Progress', 'Reviewing', 'Done']
    for (let i = 0; i < defaults.length; i++) {
      await client.query(
        'INSERT INTO kanban_columns (board_id, title, position) VALUES ($1,$2,$3)',
        [boardId, defaults[i], i]
      )
    }
    return
  }
  let newCol = rows.find(r => r.title === 'New')
  let doneCol = rows.find(r => r.title === 'Done')
  if (!newCol) {
    const res = await client.query(
      "INSERT INTO kanban_columns (board_id, title, position) VALUES ($1,'New',0) RETURNING id",
      [boardId]
    )
    newCol = { id: res.rows[0].id, title: 'New', position: 0 }
    rows.unshift(newCol)
  }
  if (!doneCol) {
    const res = await client.query(
      'INSERT INTO kanban_columns (board_id, title, position) VALUES ($1,\'Done\',$2) RETURNING id',
      [boardId, rows.length]
    )
    doneCol = { id: res.rows[0].id, title: 'Done', position: rows.length }
    rows.push(doneCol)
  }
  const others = rows.filter(r => r.title !== 'New' && r.title !== 'Done')
  const ordered = [newCol, ...others, doneCol]
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i] && ordered[i]!.position !== i) {
      await client.query('UPDATE kanban_columns SET position=$1 WHERE id=$2', [i, ordered[i]!.id])
    }
  }
}

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

    await ensureDefaultColumns(client, boardId)

    const { rows: columns } = await client.query(
      `SELECT id, board_id, title, position
         FROM kanban_columns
        WHERE board_id=$1
        ORDER BY position`,
      [boardId]
    )

    const { rows: cards } = await client.query(
      `SELECT c.id, c.column_id, c.title, c.description, c.status, c.priority,
              c.due_date, c.assignee_id, c.position, c.linked_todo_id
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
