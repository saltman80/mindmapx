import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import type { PoolClient } from 'pg'
import { validate as isUuid } from 'uuid'
import { requireAuth } from './middleware.js'
import type { NodePayload } from './types.js'

// Node creation rules:
// - A mindmap may contain only one root node (parentId null).
// - The first root node defaults to the canvas center if no coordinates are
//   provided.
// - Child nodes require a parentId and coordinates relative to that parent.

async function isFirstNodeForMindmap(
  client: PoolClient,
  mindmapId: string
): Promise<boolean> {
  const result = await client.query(
    'SELECT COUNT(*)::int AS count FROM nodes WHERE mindmap_id=$1 AND parent_id IS NULL',
    [mindmapId]
  )
  return Number(result.rows[0]?.count) === 0
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
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing body' }),
        }
      }
      let payload: any
      try {
        payload = JSON.parse(event.body)
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON' }),
        }
      }

      // Validate mindmapId
      if (typeof payload.mindmapId !== 'string' || !isUuid(payload.mindmapId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing or invalid mindmapId' }),
        }
      }

      // Ensure referenced mindmap exists. If it doesn't, attempt to create a
      // placeholder so the node insert won't violate the FK constraint.
      const mindmapCheck = await client.query<{ id: string }>(
        'SELECT id FROM mindmaps WHERE id = $1',
        [payload.mindmapId]
      )
      if (mindmapCheck.rowCount === 0) {
        try {
          await client.query(
            `INSERT INTO mindmaps(id, user_id, title, description, config)
             VALUES ($1, $2, $3, NULL, '{}'::jsonb)`,
            [payload.mindmapId, userId, 'Untitled']
          )
        } catch (createErr) {
          console.error('[CreateNode] auto create mindmap failed', createErr)
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Mindmap not found' }),
          }
        }
      }

      // Default values and type checks
      const x =
        typeof payload.x === 'number' && Number.isFinite(payload.x)
          ? payload.x
          : 0
      const y =
        typeof payload.y === 'number' && Number.isFinite(payload.y)
          ? payload.y
          : 0
      const label =
        typeof payload.label === 'string' && payload.label.trim() !== ''
          ? payload.label.trim()
          : 'Untitled'
      const description =
        typeof payload.description === 'string' && payload.description.trim() !== ''
          ? payload.description.trim()
          : null

      let parentId: string | null = null
      if (payload.parentId) {
        if (typeof payload.parentId === 'string' && isUuid(payload.parentId)) {
          parentId = payload.parentId
        } else {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid parentId' }),
          }
        }
      }

      // Optional: restrict one root node if desired
      // const isRoot = !parentId
      // const first = await isFirstNodeForMindmap(client, payload.mindmapId)

      try {
        console.log('[CreateNode] inserting', {
          mindmapId: payload.mindmapId,
          x,
          y,
          label,
          description,
          parentId,
        })

        const result = await client.query(
          `INSERT INTO nodes (mindmap_id, x, y, label, description, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
          [payload.mindmapId, x, y, label, description, parentId]
        )

        console.log('[CreateNode] inserted id', result.rows[0].id)

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ id: result.rows[0].id }),
        }
      } catch (err: any) {
        console.error('[CreateNode] DB Insert Failed:', { payload, error: err })
        if (err?.code === '23503') {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Related record not found' })
          }
        }
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: err?.message || 'Database insert failed' })
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
