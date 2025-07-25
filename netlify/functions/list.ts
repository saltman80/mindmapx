import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z, ZodError } from 'zod'
import { extractToken, verifySession } from './auth.js'

const MAX_PAGE = 100

const QuerySchema = z.object({
  page: z.preprocess((val: unknown) => {
    if (typeof val === 'string') {
      const n = parseInt(val, 10)
      return isNaN(n) ? undefined : n
    }
    return undefined
  }, z.number().int().min(1).max(MAX_PAGE).default(1)),
  limit: z.preprocess((val: unknown) => {
    if (typeof val === 'string') {
      const n = parseInt(val, 10)
      return isNaN(n) ? undefined : n
    }
    return undefined
  }, z.number().int().positive().max(100).default(20)),
  completed: z.preprocess((val: unknown) => {
    if (typeof val === 'string') {
      const v = val.toLowerCase()
      if (v === 'true') return true
      if (v === 'false') return false
    }
    return undefined
  }, z.boolean().optional()),
})

const JwtPayloadSchema = z.object({ userId: z.string() })

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  const commonHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    }
    return {
      statusCode: 204,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    const headers: Record<string, string> = {
      ...commonHeaders,
      Allow: 'GET,OPTIONS'
    }
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  const token = extractToken(event)
  if (!token) {
    return {
      statusCode: 401,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  let userId: string
  try {
    const payload = await verifySession(token)
    const parsed = JwtPayloadSchema.parse(payload)
    userId = parsed.userId
  } catch {
    return {
      statusCode: 401,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Invalid token' })
    }
  }

  let params: z.infer<typeof QuerySchema>
  try {
    params = QuerySchema.parse(event.queryStringParameters || {})
  } catch (err) {
    const zErr = err as z.ZodError
    const details = zErr.errors.map(e => ({
      field: e.path.join('.') || 'query',
      message: e.message,
    }))
    return {
      statusCode: 400,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Invalid query parameters', details }),
    }
  }

  const { page, limit, completed } = params
  const offset = (page - 1) * limit
  const db = await getClient()

  const whereClauses = [
    '(user_id = $1 OR user_id IN (SELECT user_id FROM team_members WHERE member_id = $1))'
  ]
  const values: (string | number | boolean)[] = [userId]

  if (typeof completed === 'boolean') {
    values.push(completed)
    whereClauses.push(`completed = $${values.length}`)
  }

  values.push(limit, offset)
  const limitParam = values.length - 1
  const offsetParam = values.length

  const sql = `
    SELECT t.id, t.title, t.description, t.completed, t.created_at, t.updated_at,
           t.assignee_id, a.name AS assignee_name, a.email AS assignee_email
      FROM todos t
      LEFT JOIN users a ON t.assignee_id = a.id
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY t.created_at DESC
     LIMIT $${limitParam}
     OFFSET $${offsetParam}
  `

  try {
    const { rows } = await db.query(sql, values)
    return {
      statusCode: 200,
      headers: commonHeaders,
      body: JSON.stringify({ success: true, data: { todos: rows, page, limit } }),
    }
  } catch (err) {
    console.error('Database error:', err)
    return {
      statusCode: 500,
      headers: commonHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}