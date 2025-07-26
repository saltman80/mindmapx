import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import type { PoolClient } from 'pg'
import { validate as isUuid } from 'uuid'
import { requireAuth } from './middleware.js'

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
  let client: PoolClient | null = null
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers, body: '' }
    }

    let userId: string
    try {
      userId = await requireAuth(event)
      if (!isUuid(userId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid userId' }) }
      }
    } catch {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    }

    client = await getClient()
    if (event.httpMethod === 'GET') {
      const mapId = event.queryStringParameters?.mindmapId
      if (!mapId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'mindmapId required' }) }
      const { rows } = await client.query(
        `SELECT id, parent_id, x, y, content, todo_id FROM nodes WHERE mindmap_id = $1 ORDER BY created_at`,
        [mapId]
      )
      const nodes = rows.map(r => {
        let label: string | undefined
        let description: string | undefined
        try {
          const obj = r.content ? JSON.parse(r.content) : {}
          if (obj && typeof obj === 'object') {
            label = typeof obj.label === 'string' ? obj.label : undefined
            description = typeof obj.description === 'string' ? obj.description : undefined
          }
        } catch {}
        return {
          id: r.id,
          parentId: r.parent_id,
          x: r.x,
          y: r.y,
          label,
          description,
          todoId: r.todo_id ?? undefined,
        }
      })
      return { statusCode: 200, headers, body: JSON.stringify(nodes) }
    }

    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
      }

      let payload: NodePayload
      try {
        payload = JSON.parse(event.body)
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
      }

      if (!payload.mindmapId || !isUuid(payload.mindmapId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid mindmapId' }) }
      }

      if (payload.parentId && !isUuid(payload.parentId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid parentId' }) }
      }

      if (payload.x === undefined || payload.y === undefined) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing coordinates' }) }
      }
      if (typeof payload.x !== 'number' || typeof payload.y !== 'number') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Coordinates must be numbers' }) }
      }

      const contentObj = {
        label: payload.label ?? '',
        description: payload.description ?? ''
      }

      try {
        const result = await client.query(
          `INSERT INTO nodes (mindmap_id, x, y, content, parent_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [
            payload.mindmapId,
            payload.x,
            payload.y,
            JSON.stringify(contentObj),
            payload.parentId ?? null
          ]
        )

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ id: result.rows[0].id })
        }
      } catch (e) {
        console.error('[Insert Node failed]', { payload, error: e })
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: (e as Error).message })
        }
      }
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
        if (typeof payload.x !== 'number') {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'x must be a number' }) }
        }
        fields.push(`x=$${idx}`)
        values.push(payload.x)
        idx++
      }
      if (payload.y !== undefined) {
        if (typeof payload.y !== 'number') {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'y must be a number' }) }
        }
        fields.push(`y=$${idx}`)
        values.push(payload.y)
        idx++
      }
      if (payload.label !== undefined || payload.description !== undefined) {
        fields.push(`content=$${idx}`)
        const contentObj = {
          label: payload.label ?? '',
          description: payload.description ?? ''
        }
        values.push(JSON.stringify(contentObj))
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
    console.error('[nodes] error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: (err as Error).message || 'Internal error' })
    }
  } finally {
    if (client) {
      try {
        client.release()
      } catch (releaseErr) {
        console.error('[nodes] release error:', releaseErr)
      }
    }
  }
}
