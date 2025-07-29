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

async function columnExists(
  client: PoolClient,
  table: string,
  column: string
): Promise<boolean> {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`,
    [table, column]
  )
  const count = typeof res.rowCount === 'number' ? res.rowCount : 0
  return count > 0
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
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
        `SELECT id, parent_id, x, y, label, description, todo_id, linked_todo_list_id
         FROM nodes WHERE mindmap_id = $1 ORDER BY created_at`,
        [mapId]
      )

      const nodes = rows.map(r => ({
        id: r.id,
        parentId: r.parent_id,
        x: typeof r.x === 'string' ? parseFloat(r.x) : r.x,
        y: typeof r.y === 'string' ? parseFloat(r.y) : r.y,
        label: r.label ?? undefined,
        description: r.description ?? undefined,
        todoId: r.todo_id ?? undefined,
        linkedTodoListId: r.linked_todo_list_id ?? undefined,
      }))

      return { statusCode: 200, headers, body: JSON.stringify({ nodes }) }
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

      console.log('[CreateNode] payload received', payload)

      // Validate mindmapId
      if (typeof payload.mindmapId !== 'string' || !isUuid(payload.mindmapId)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing or invalid mindmapId' }),
        }
      }
      const mindmapId = payload.mindmapId

      // Ensure referenced mindmap exists. Attempt creation up to 3 times if not found.
      let mindmapExists = false
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await client.query<{ id: string }>(
          'SELECT id FROM mindmaps WHERE id = $1',
          [mindmapId]
        )
        const count = typeof result.rowCount === 'number' ? result.rowCount : 0
        if (count > 0) {
          mindmapExists = true
          break
        }
        try {
          console.log(`[CreateNode] mindmap missing, attempt ${attempt + 1} to create`, mindmapId)
          await client.query(
            `INSERT INTO mindmaps(id, user_id, title, description, config)
             VALUES ($1, $2, $3, NULL, '{}'::jsonb)`,
            [mindmapId, userId, 'Untitled']
          )
        } catch (createErr) {
          console.error(`[CreateNode] auto create attempt ${attempt + 1} failed`, createErr)
        }
      }

      if (!mindmapExists) {
        const finalCheck = await client.query<{ id: string }>(
          'SELECT id FROM mindmaps WHERE id = $1',
          [mindmapId]
        )
        const finalCount =
          typeof finalCheck.rowCount === 'number' ? finalCheck.rowCount : 0
        mindmapExists = finalCount > 0
      }

      if (!mindmapExists) {
        console.error('[CreateNode] mindmap not found after retries', { mindmapId })
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Mindmap not found' }),
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

      const hasContent = await columnExists(client, 'nodes', 'content')
      
      // Enforce single root node per mindmap
      const isRoot = !parentId
      if (isRoot) {
        const first = await isFirstNodeForMindmap(client, mindmapId)
        if (!first) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Root node already exists' }),
          }
        }
      }

      try {
        console.log('[CreateNode] inserting', {
          mindmapId,
          x,
          y,
          label,
          description,
          parentId,
        })

        const query = hasContent
          ? `INSERT INTO nodes (mindmap_id, x, y, label, description, parent_id, content)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`
          : `INSERT INTO nodes (mindmap_id, x, y, label, description, parent_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`

        const params = hasContent
          ? [mindmapId, x, y, label, description, parentId, label]
          : [mindmapId, x, y, label, description, parentId]

        const result = await client.query(query, params)

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
      if (payload.linkedTodoListId !== undefined) {
        fields.push(`linked_todo_list_id=$${idx}`)
        values.push(payload.linkedTodoListId)
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

    if (event.httpMethod === 'DELETE') {
      const pathMatch = event.path.match(/nodes\/([^/]+)/)
      const nodeId = pathMatch?.[1]
      if (!nodeId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing node id' }) }
      }
      const result = await client.query('DELETE FROM nodes WHERE id=$1', [nodeId])
      if (result.rowCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
      }
      return { statusCode: 204, headers, body: '' }
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
