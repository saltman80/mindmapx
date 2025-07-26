import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { requireAuth } from './middleware.js'

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
    userId = await requireAuth(event)
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const client = await getClient()
  try {
    if (event.httpMethod === 'POST') {
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      const columnId = data.column_id
      const title = (data.title || '').trim()
      if (!columnId || !title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing column_id or title' }) }
    const res = await client.query(
      `INSERT INTO kanban_cards (column_id, title, description, status, priority, due_date, assignee_id, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, column_id, title, position`,
      [
        columnId,
        title,
        data.description ?? null,
        data.status ?? 'open',
        data.priority ?? 'low',
        data.due_date ?? null,
        data.assignee_id ?? null,
        Number(data.position) || 0
      ]
    )
      await log(client, res.rows[0].id, userId, 'create', 'Card created')
      return { statusCode: 201, headers, body: JSON.stringify(res.rows[0]) }
    }

    const path = event.path
    const moveMatch = path.match(/kanban-cards\/([^/]+)\/move/)
    if (moveMatch) {
      const cardId = moveMatch[1]
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      const columnId = data.column_id
      const position = Number(data.position) || 0
      if (!columnId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing column_id' }) }
      const res = await client.query(
        `UPDATE kanban_cards SET column_id=$1, position=$2, updated_at=now() WHERE id=$3 RETURNING id`,
        [columnId, position, cardId]
      )
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      await log(client, cardId, userId, 'move', 'Card moved')
      return { statusCode: 200, headers, body: JSON.stringify({ id: cardId }) }
    }

    const match = path.match(/kanban-cards\/([^/]+)/)
    const cardId = match?.[1]
    if (!cardId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing card id' }) }

    if (event.httpMethod === 'PATCH') {
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      const fields: string[] = []
      const values: any[] = []
      let idx = 1
      const keys = ['title','description','status','priority','due_date','assignee_id','position','column_id'] as const
      for (const k of keys) {
        if (data[k] !== undefined) { fields.push(`${k}=$${idx}`); values.push(data[k]); idx++ }
      }
      if (fields.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields' }) }
      const res = await client.query(
        `UPDATE kanban_cards SET ${fields.join(', ')}, updated_at=now() WHERE id=$${idx} RETURNING id`,
        [...values, cardId]
      )
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      const changed = keys.filter(k => data[k] !== undefined).join(',')
      await log(client, cardId, userId, 'update', `Updated: ${changed}`)
      return { statusCode: 200, headers, body: JSON.stringify({ id: cardId }) }
    }

    if (event.httpMethod === 'DELETE') {
      const res = await client.query('DELETE FROM kanban_cards WHERE id=$1', [cardId])
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
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
