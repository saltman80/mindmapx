import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { requireAuth } from './middleware.js'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

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
      const boardId = data.board_id
      const title = (data.title || '').trim()
      const position = Number(data.position) || 0
      if (!boardId || !title) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing board_id or title' }) }
      }
      const res = await client.query(
        `INSERT INTO kanban_columns (board_id, title, position)
         VALUES ($1,$2,$3)
         RETURNING id, board_id, title, position`,
        [boardId, title, position]
      )
      return { statusCode: 201, headers, body: JSON.stringify(res.rows[0]) }
    }

    const match = event.path.match(/kanban-columns\/(.+)/)
    const colId = match?.[1]
    if (!colId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing column id' }) }
    }

    if (event.httpMethod === 'PATCH') {
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      const data = JSON.parse(event.body)
      const fields: string[] = []
      const values: any[] = []
      let idx = 1
      if (data.title !== undefined) { fields.push(`title=$${idx}`); values.push(data.title); idx++ }
      if (data.position !== undefined) { fields.push(`position=$${idx}`); values.push(Number(data.position)); idx++ }
      if (fields.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields' }) }
      const res = await client.query(
        `UPDATE kanban_columns SET ${fields.join(', ')}, updated_at=now() WHERE id=$${idx} RETURNING id, board_id, title, position`,
        [...values, colId]
      )
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      return { statusCode: 200, headers, body: JSON.stringify(res.rows[0]) }
    }

    if (event.httpMethod === 'DELETE') {
      const res = await client.query('DELETE FROM kanban_columns WHERE id=$1', [colId])
      if (res.rowCount === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      return { statusCode: 204, headers, body: '' }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err: any) {
    console.error('kanban-columns error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
