import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { requireAuth } from '../lib/auth.js'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

async function log(client: any, cardId: string, userId: string, type: string, message: string) {
  await client.query(
    `INSERT INTO kanban_card_activity_log (card_id, type, message, created_by)
     VALUES ($1,$2,$3,$4)`,
    [cardId, type, message, userId]
  )
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers }

  let userId: string
  try {
    ;({ userId } = requireAuth(event))
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const client = await getClient()
  try {
    if (event.httpMethod === 'POST') {
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      if (data.due_date === '') data.due_date = null
      if (data.assignee_id === '') data.assignee_id = null
      const columnId = data.column_id
      const title = (data.title || '').trim()
      if (!columnId || !title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing column_id or title' }) }

      const todoId: string | undefined = data.todo_id

      const res = await client.query(
        `INSERT INTO kanban_cards (column_id, title, description, status, priority, due_date, assignee_id, position, linked_todo_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, column_id, title, position`,
        [
          columnId,
          title,
          data.description ?? null,
          data.status ?? 'open',
          data.priority ?? 'low',
          data.due_date ?? null,
          data.assignee_id ?? null,
          Number(data.position) || 0,
          todoId ?? null
        ]
      )

      if (todoId) {
        await client.query(
          'UPDATE todos SET linked_kanban_card_id=$1 WHERE id=$2',
          [res.rows[0].id, todoId]
        )
        const { rows: b } = await client.query(
          'SELECT board_id FROM kanban_columns WHERE id=$1',
          [columnId]
        )
        const boardId = b[0]?.board_id
        if (boardId) {
          await client.query(
            'INSERT INTO canvas_links (todo_id, board_id) VALUES ($1,$2)',
            [todoId, boardId]
          )
        }
      }

      await log(client, res.rows[0].id, userId, 'create', 'Card created')
      return { statusCode: 201, headers, body: JSON.stringify(res.rows[0]) }
    }

    const path = event.path
    const moveMatch = path.match(/cards\/([^/]+)\/move/)
    if (moveMatch) {
      const cardId = moveMatch[1]
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      const columnId = data.column_id
      const position = Number(data.position) || 0
      if (!columnId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing column_id' }) }
      const res = await client.query(
        `UPDATE kanban_cards SET column_id=$1, position=$2, updated_at=now() WHERE id=$3 RETURNING id, linked_todo_id`,
        [columnId, position, cardId]
      )
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      await log(client, cardId, userId, 'move', 'Card moved')
      const linkedTodo = res.rows[0].linked_todo_id
      if (linkedTodo) {
        const { rows: col } = await client.query('SELECT title FROM kanban_columns WHERE id=$1', [columnId])
        if (col[0]?.title === 'Done') {
          await client.query('UPDATE todos SET completed=true, updated_at=now() WHERE id=$1', [linkedTodo])
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ id: cardId }) }
    }

    const match = path.match(/cards\/([^/]+)/)
    const cardId = match?.[1]
    if (!cardId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing card id' }) }

    if (event.httpMethod === 'PATCH') {
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      if (data.due_date === '') data.due_date = null
      if (data.assignee_id === '') data.assignee_id = null
      const fields: string[] = []
      const values: any[] = []
      let idx = 1
      const keys = ['title','description','status','priority','due_date','assignee_id','position','column_id'] as const
      for (const k of keys) {
        if (data[k] !== undefined) { fields.push(`${k}=$${idx}`); values.push(data[k]); idx++ }
      }
      if (fields.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields' }) }
      const res = await client.query(
        `UPDATE kanban_cards SET ${fields.join(', ')}, updated_at=now() WHERE id=$${idx} RETURNING id, linked_todo_id, column_id`,
        [...values, cardId]
      )
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      const changed = keys.filter(k => data[k] !== undefined).join(',')
      await log(client, cardId, userId, 'update', `Updated: ${changed}`)
      if (data.column_id && res.rows[0].linked_todo_id) {
        const { rows: col } = await client.query('SELECT title FROM kanban_columns WHERE id=$1', [data.column_id])
        if (col[0]?.title === 'Done') {
          await client.query('UPDATE todos SET completed=true, updated_at=now() WHERE id=$1', [res.rows[0].linked_todo_id])
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ id: cardId }) }
    }

    if (event.httpMethod === 'DELETE') {
      const info = await client.query('SELECT linked_todo_id, column_id FROM kanban_cards WHERE id=$1', [cardId])
      const res = await client.query('DELETE FROM kanban_cards WHERE id=$1', [cardId])
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      if (info.rows[0]?.linked_todo_id) {
        await client.query('UPDATE todos SET linked_kanban_card_id=NULL WHERE id=$1', [info.rows[0].linked_todo_id])
        const { rows: board } = await client.query('SELECT board_id FROM kanban_columns WHERE id=$1', [info.rows[0].column_id])
        if (board[0]?.board_id) {
          await client.query('DELETE FROM canvas_links WHERE todo_id=$1 AND board_id=$2', [info.rows[0].linked_todo_id, board[0].board_id])
        }
      }
      await log(client, cardId, userId, 'delete', 'Card deleted')
      return { statusCode: 204, headers, body: '' }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err: any) {
    console.error('kanban-cards error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
