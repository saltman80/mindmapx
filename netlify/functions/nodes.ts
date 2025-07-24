import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

interface NodePayload {
  mindmapId: string
  parentId?: string | null
  x: number
  y: number
  label?: string
  description?: string
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const token = extractToken(event)
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }

  let userId: string
  try {
    const session = verifySession(token) as { userId: string }
    userId = session.userId
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const client = await getClient()
  try {
    if (event.httpMethod === 'GET') {
      const mapId = event.queryStringParameters?.mindmapId
      if (!mapId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'mindmapId required' }) }
      const { rows } = await client.query(
        `SELECT id, parent_id, x, y, label, description, todo_id FROM nodes WHERE mindmap_id = $1 ORDER BY created_at`,
        [mapId]
      )
      const nodes = rows.map(r => ({
        id: r.id,
        parentId: r.parent_id,
        x: r.x,
        y: r.y,
        label: r.label ?? undefined,
        description: r.description ?? undefined,
        todoId: r.todo_id ?? undefined,
      }))
      return { statusCode: 200, headers, body: JSON.stringify(nodes) }
    }

    if (event.httpMethod === 'POST') {
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      let payload: NodePayload
      try {
        payload = JSON.parse(event.body)
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
      }
      const id = payload as any && (payload as any).id ? (payload as any).id : crypto.randomUUID()
      await client.query(
        `INSERT INTO nodes(id, mindmap_id, parent_id, x, y, label, description) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id,
          payload.mindmapId,
          payload.parentId ?? null,
          payload.x,
          payload.y,
          payload.label ?? null,
          payload.description ?? null,
        ]
      )
      return { statusCode: 201, headers, body: JSON.stringify({ id }) }
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
      const pathMatch = event.path.match(/nodes\/([^/]+)/)
      const nodeId = pathMatch?.[1]
      if (!nodeId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing node id' }) }
      if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      let payload: Partial<NodePayload>
      try {
        payload = JSON.parse(event.body)
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
      }
      const fields: string[] = []
      const values: any[] = [nodeId]
      let idx = 2
      if (payload.x !== undefined) {
        fields.push(`x=$${idx}`)
        values.push(payload.x)
        idx++
      }
      if (payload.y !== undefined) {
        fields.push(`y=$${idx}`)
        values.push(payload.y)
        idx++
      }
      if (payload.label !== undefined) {
        fields.push(`label=$${idx}`)
        values.push(payload.label)
        idx++
      }
      if (payload.description !== undefined) {
        fields.push(`description=$${idx}`)
        values.push(payload.description)
        idx++
      }
      if (payload.parentId !== undefined) {
        fields.push(`parent_id=$${idx}`)
        values.push(payload.parentId)
        idx++
      }
      if (fields.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) }
      }
      const result = await client.query(`UPDATE nodes SET ${fields.join(', ')} WHERE id=$1`, values)
      if (result.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      }
      return { statusCode: 200, headers, body: JSON.stringify({ id: nodeId }) }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  } catch (err) {
    console.error('nodes handler error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    client.release()
  }
}
