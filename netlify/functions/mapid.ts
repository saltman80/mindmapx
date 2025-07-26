import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let userId: string
  try {
    const session = await verifySession(token)
    userId = session.userId
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const pathMatch = event.path.match(/mapid\/([^/]+)/)
  const mapId = pathMatch?.[1]
  if (!mapId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing map ID' }) }
  }

  const client = await getClient()
  try {
    const { rows } = await client.query(
      'SELECT * FROM mindmaps WHERE id = $1 AND user_id = $2',
      [mapId, userId]
    )
    if (rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Map not found' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows[0])
    }
  } catch (err) {
    console.error('Error fetching map:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) }
  } finally {
    client.release()
  }
}
