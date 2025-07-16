import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { verify, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { z, ZodError } from 'zod'
const pool = {
  async query(text: string, params?: any[]) {
    const client = await getClient()
    return client.query(text, params)
  }
}

const mapInputSchema = z.object({
  data: z.record(z.any()),
})

async function getUserId(headers: { [key: string]: string }): Promise<string> {
  const authHeader = headers.authorization || headers.Authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized")
  }
  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error("JWT secret not configured")
    throw new Error("Internal Server Error")
  }
  const decoded = verify(token, secret) as { sub?: string }
  if (!decoded.sub) {
    throw new Error("Unauthorized")
  }
  return decoded.sub
}

async function getMaps(userId: string) {
  const result = await pool.query(
    `SELECT id, user_id AS "userId", data, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM maps
     WHERE user_id = $1
        OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $1)
     ORDER BY created_at DESC`,
    [userId]
  )
  return result.rows
}

async function createMap(userId: string, data: unknown) {
  const result = await pool.query(
    `INSERT INTO maps (user_id, data)
     VALUES ($1, $2)
     RETURNING id, user_id AS "userId", data, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [userId, data]
  )
  return result.rows[0]
}

export const handler: Handler = async (event) => {
  try {
    const userId = await getUserId(event.headers)
    if (event.httpMethod === "GET") {
      const maps = await getMaps(userId)
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maps),
      }
    }
    if (event.httpMethod === "POST") {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Missing request body" }),
        }
      }
      let payload: unknown
      try {
        payload = JSON.parse(event.body)
      } catch {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid JSON" }),
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
    }
    return {
      statusCode: 405,
      headers: {
        Allow: "GET, POST",
        "Content-Type": "application/json",
      },
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