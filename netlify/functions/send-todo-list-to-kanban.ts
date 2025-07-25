import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const token = extractToken(event)
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  let userId: string
  try {
    const session = await verifySession(token) as { userId: string }
    userId = session.userId
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
  let data: { listId?: string; boardId?: string }
  try { data = JSON.parse(event.body) } catch { data = {} as any }
  const { listId, boardId } = data
  if (!listId || !boardId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing listId or boardId' }) }

  const client = await getClient()
  try {
    // fetch todos that have not already been sent to the board
    const { rows: todos } = await client.query(
      'SELECT id, title FROM todos WHERE list_id=$1 AND user_id=$2 AND linked_kanban_card_id IS NULL',
      [listId, userId]
    )
    // ensure New column
    let { rows: cols } = await client.query(
      "SELECT id FROM kanban_columns WHERE board_id=$1 AND title='New'",
      [boardId]
    )
    let newColId = cols[0]?.id
    if (!newColId) {
      const res = await client.query(
        'INSERT INTO kanban_columns (board_id, title, position) VALUES ($1,\'New\',0) RETURNING id',
        [boardId]
      )
      newColId = res.rows[0].id
    }
    // determine next position for new cards
    let { rows: posRows } = await client.query(
      'SELECT COALESCE(MAX(position),0)+1 AS pos FROM kanban_cards WHERE column_id=$1',
      [newColId]
    )
    let nextPos = posRows[0]?.pos ?? 0

    for (const todo of todos) {
      const cardRes = await client.query(
        `INSERT INTO kanban_cards (column_id, title, position, linked_todo_id)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [newColId, todo.title, nextPos, todo.id]
      )
      const cardId = cardRes.rows[0].id
      nextPos++
      await client.query(
        'UPDATE todos SET linked_kanban_card_id=$1 WHERE id=$2',
        [cardId, todo.id]
      )
      await client.query(
        'INSERT INTO canvas_links (todo_id, board_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [todo.id, boardId]
      )
    }
    return { statusCode: 200, headers, body: JSON.stringify({ count: todos.length }) }
  } catch (err) {
    console.error('send-todo-list-to-kanban', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
