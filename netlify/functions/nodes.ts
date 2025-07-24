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
        `SELECT id, parent_id, data FROM nodes WHERE mindmap_id = $1 ORDER BY created_at`,
        [mapId]
      )
      const nodes = rows.map(r => ({ id: r.id, parentId: r.parent_id, ...(r.data || {}) }))
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
        `INSERT INTO nodes(id, mindmap_id, parent_id, data) VALUES ($1,$2,$3,$4)`,
        [id, payload.mindmapId, payload.parentId ?? null, JSON.stringify({ x: payload.x, y: payload.y, label: payload.label, description: payload.description })]
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
      const { rows } = await client.query('SELECT data FROM nodes WHERE id=$1', [nodeId])
      if (rows.length === 0) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      const data = { ...(rows[0].data || {}), ...payload }
      await client.query('UPDATE nodes SET data=$2 WHERE id=$1', [nodeId, JSON.stringify(data)])
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
