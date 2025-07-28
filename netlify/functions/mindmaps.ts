import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'
import { validate as isUuid } from 'uuid'
import { randomUUID } from 'crypto'
import { ZodError } from 'zod'
import { LIMIT_MINDMAPS } from "./limits.js"
import { mapInputSchema } from './validationschemas.js'

export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // ✅ CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let userId: string
  try {
    const session = await verifySession(token)
    userId = session.userId
    if (!isUuid(userId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid userId' })
      }
    }
  } catch (err) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const client = await getClient()

  try {
    // ✅ Handle POST
    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
      }

      let parsed
      try {
        const payload = JSON.parse(event.body)
        parsed = mapInputSchema.parse(payload)
      } catch (err: any) {
        if (err instanceof ZodError) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Validation failed', details: err.errors }) }
        }
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
      }

      const countRes = await client.query(
        'SELECT COUNT(*) FROM mindmaps WHERE user_id = $1',
        [userId]
      )
      if (Number(countRes.rows[0].count) >= LIMIT_MINDMAPS) {
        client.release()
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Mindmap limit reached' }) }
      }

      const result = await client.query(
        `INSERT INTO mindmaps (user_id, title, description, config)
         VALUES ($1, $2, $3, '{}'::jsonb)
         RETURNING id, title, description, created_at`,
        [userId, parsed.data.title, parsed.data.description]
      )

      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) }
    }

    // ✅ Handle GET
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id

      if (id) {
        const result = await client.query(
          `SELECT id, title, description, created_at FROM mindmaps WHERE id = $1 AND user_id = $2`,
          [id, userId]
        )

        if (result.rowCount === 0) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
        }

        return { statusCode: 200, headers, body: JSON.stringify({ map: result.rows[0] }) }
      }

      const result = await client.query(
        `SELECT id, title, description, created_at FROM mindmaps
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      )

      const maps = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        created_at: row.created_at,
      }))

      return { statusCode: 200, headers, body: JSON.stringify(maps) }
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) }
      }
      await client.query('BEGIN')
      try {
        await client.query('DELETE FROM nodes WHERE mindmap_id = $1', [id])
        const result = await client.query(
          'DELETE FROM mindmaps WHERE id = $1 AND user_id = $2',
          [id, userId]
        )
        if (result.rowCount === 0) {
          await client.query('ROLLBACK')
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) }
        }
        await client.query('COMMIT')
        return { statusCode: 204, headers, body: '' }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }

    // ❌ No other method allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  } catch (err) {
    console.error('Mindmap function error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    client.release()
  }
}

export async function createMindmapFromNodes(
  userId: string,
  title: string,
  description: string,
  nodes: Array<{ id?: string; title: string; parentId?: string | null }>
): Promise<string> {
  const client = await getClient()
  try {
    const { rows } = await client.query(
      'SELECT COUNT(*) FROM mindmaps WHERE user_id = $1',
      [userId]
    )
    if (Number(rows[0].count) >= LIMIT_MINDMAPS) {
      throw new Error('Mindmap limit reached')
    }
    await client.query('BEGIN')
    const res = await client.query(
      `INSERT INTO mindmaps(user_id, title, description, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [userId, title.trim(), description.trim() || null]
    )
    const mapId = res.rows[0].id
    for (const n of nodes) {
      await client.query(
        `INSERT INTO nodes(id, mindmap_id, parent_id, data)
         VALUES ($1, $2, $3, $4)`,
        [n.id || randomUUID(), mapId, n.parentId ?? null, JSON.stringify({ content: n.title })]
      )
    }
    await client.query('COMMIT')
    return mapId
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
