import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from '../netlify/functions/db-client.js'
import { z, ZodError } from 'zod'
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set')
}

const db = getClient()

const QuerySchema = z.object({
  mapId: z.string().uuid().optional(),
  completed: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lower = val.toLowerCase()
        if (lower === 'true') return true
        if (lower === 'false') return false
      }
      return val
    },
    z.boolean()
  ).optional()
})

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: 'GET'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    const token = authHeader.slice(7)
    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }

    const userId = decoded.userId
    const queryParams = QuerySchema.parse(event.queryStringParameters || {})

    let sql = `
      SELECT id, content, completed, map_id, created_at, updated_at
      FROM todos
      WHERE user_id = $1
    `
    const values: Array<string | boolean> = [userId]
    let idx = 2
    if (queryParams.mapId) {
      sql += ` AND map_id = $${idx}`
      values.push(queryParams.mapId)
      idx++
    }
    if (queryParams.completed !== undefined) {
      sql += ` AND completed = $${idx}`
      values.push(queryParams.completed)
      idx++
    }
    sql += ` ORDER BY created_at DESC`

    const { rows } = await db.query(sql, values)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos: rows })
    }
  } catch (error) {
    console.error('getTodos error:', error)
    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: error.errors })
      }
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}