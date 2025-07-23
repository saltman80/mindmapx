import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { ZodError } from 'zod'
import { extractToken, verifySession } from './auth.js'
import { mapInputSchema } from './validationschemas.js'


async function getMaps(userId: string) {
  const client = await getClient()
  try {
    const result = await client.query(
      `SELECT id, user_id AS "userId", title, description, created_at AS "createdAt", updated_at AS "updatedAt" FROM mindmaps WHERE user_id = $1 OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $1) ORDER BY created_at DESC`,
      [userId]
    )
    return result.rows
  } finally {
    client.release()
  }
}

async function createMap(userId: string, data: { title: string; description?: string }) {
  const client = await getClient()
  try {
    const result = await client.query(
      `INSERT INTO mindmaps (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id AS "userId", title, description, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [userId, data.title, data.description ?? null]
    )
    return result.rows[0]
  } finally {
    client.release()
  }
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  try {
    const token = extractToken(event)
    console.log('Token:', token)
    if (!token) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }
    let userId: string
    try {
      const session = verifySession(token)
      console.log('Session:', session)
      userId = session.userId
      if (!userId) throw new Error('Missing userId')
    } catch (err) {
      console.error('Auth failure in index.ts:', err)
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid session' })
      }
    }
    if (event.httpMethod === "GET") {
      const maps = await getMaps(userId)
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maps),
      }
    }
    if (event.httpMethod === "POST") {
      try {
        if (!event.body) {
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Missing request body" }),
          }
        }
        let payload: unknown = {}
        try {
          payload = JSON.parse(event.body || '{}')
        } catch {
          return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid JSON body" }),
          }
        }
        let parsed
        try {
          parsed = mapInputSchema.parse(payload)
        } catch (err: any) {
          if (err instanceof ZodError) {
            return {
              statusCode: 400,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ error: "Invalid map data", details: err.errors }),
            }
          }
          throw err
        }
        const map = await createMap(userId, parsed.data)
        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(map),
        }
      } catch (err: any) {
        console.error('Map creation failed:', err)
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Map creation failed", details: err.message || String(err) }),
        }
      }
    }
  const headers: Record<string, string> = {
    Allow: "GET, POST",
    "Content-Type": "application/json",
  }
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" }),
  }
  } catch (err: any) {
    if (
      err instanceof JsonWebTokenError ||
      err instanceof TokenExpiredError ||
      err.message === "Unauthorized"
    ) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized" }),
      }
    }
    console.error("Unhandled error:", err)
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" }),
    }
  }
}

