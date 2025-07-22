import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import type { Handler } from './types.js'
import { getClient } from './db-client.js'
import { z } from 'zod'

const MapDataSchema = z.record(z.unknown())
type MapData = z.infer<typeof MapDataSchema>

const MapResponseSchema = z.object({
  id: z.string().uuid(),
  data: MapDataSchema,
  created_at: z.string(),
  updated_at: z.string().nullable(),
})

function createResponse(statusCode: number, body?: unknown, headers: Record<string, string> = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' }
  const response: any = { statusCode, headers: { ...defaultHeaders, ...headers } }
  if (body !== undefined) {
    response.body = JSON.stringify(body)
  } else {
    response.body = ''
  }
  return response
}

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  try {
    const path = event.path || ''
    const match = path.match(/^\/api\/maps\/(?<mapId>[0-9A-Fa-f-]{36})\/?$/)
    if (!match || !match.groups) {
      return createResponse(400, { error: 'Invalid or missing mapId' })
    }
    const mapId = match.groups.mapId

    switch (event.httpMethod) {
      case 'GET': {
        const map = await getMap(mapId)
        if (!map) return createResponse(404, { error: 'Map not found' })
        const parsed = MapResponseSchema.safeParse(map)
        if (!parsed.success) console.error('Map validation failed', parsed.error)
        return createResponse(200, map)
      }
      case 'PUT':
      case 'PATCH': {
        if (!event.body) return createResponse(400, { error: 'Missing request body' })
        let json: unknown
        try {
          json = JSON.parse(event.body)
        } catch {
          return createResponse(400, { error: 'Invalid JSON body' })
        }
        const parseResult = MapDataSchema.safeParse(json)
        if (!parseResult.success) {
          return createResponse(400, { error: 'Invalid map data', details: parseResult.error.errors })
        }
        const updated = await updateMap(mapId, parseResult.data)
        if (!updated) return createResponse(404, { error: 'Map not found' })
        return createResponse(200, updated)
      }
      case 'DELETE': {
        const deletedCount = await deleteMap(mapId)
        if (deletedCount === 0) return createResponse(404, { error: 'Map not found' })
        return createResponse(204)
      }
      default:
        return createResponse(405, { error: 'Method Not Allowed' }, { Allow: 'GET,PUT,PATCH,DELETE' })
    }
  } catch (error) {
    console.error('mapid handler error', error)
    return createResponse(500, { error: 'Internal Server Error' })
  }
}

async function getMap(mapId: string): Promise<{ id: string; data: MapData; created_at: string; updated_at: string | null } | null> {
  const client = await getClient()
  try {
    const res = await client.query('SELECT id, data, created_at, updated_at FROM mindmaps WHERE id = $1', [mapId])
    return res.rowCount > 0 ? res.rows[0] : null
  } finally {
    client.release()
  }
}

async function updateMap(mapId: string, data: MapData): Promise<{ id: string; data: MapData; created_at: string; updated_at: string | null } | null> {
  const client = await getClient()
  try {
    const res = await client.query(
      'UPDATE mindmaps SET data = $2, updated_at = NOW() WHERE id = $1 RETURNING id, data, created_at, updated_at',
      [mapId, data]
    )
    return res.rowCount > 0 ? res.rows[0] : null
  } finally {
    client.release()
  }
}

async function deleteMap(mapId: string): Promise<number> {
  const client = await getClient()
  try {
    const res = await client.query('DELETE FROM mindmaps WHERE id = $1', [mapId])
    return res.rowCount
  } finally {
    client.release()
  }
}