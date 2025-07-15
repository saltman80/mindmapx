import type { Handler } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z, ZodError } from 'zod'
import jwt from 'jsonwebtoken'
const querySchema = z.object({
  id: z.string().uuid().optional(),
  skip: z.preprocess(val => val ? parseInt(val as string, 10) : undefined, z.number().int().nonnegative().optional()),
  limit: z.preprocess(val => val ? parseInt(val as string, 10) : undefined, z.number().int().positive().max(100).optional()),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
})

const db = getClient()

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  const authHeaderRaw = event.headers.authorization || event.headers.Authorization || ''
  const authHeader = authHeaderRaw.trim()
  const [scheme, token] = authHeader.split(' ')
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not set')
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' }),
    }
  }
  let user: any
  try {
    user = jwt.verify(token, process.env.JWT_SECRET) as { role: string }
  } catch {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' }),
    }
  }
  if (user.role !== 'admin') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Forbidden' }),
    }
  }

  try {
    const method = event.httpMethod
    if (method === 'GET') {
      const params = querySchema.parse(event.queryStringParameters || {})
      if (params.id) {
        const { rows } = await db.query(
          'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
          [params.id]
        )
        if (rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' }),
          }
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: rows[0] }),
        }
      } else {
        const skip = params.skip ?? 0
        const limit = params.limit ?? 100
        const { rows } = await db.query(
          'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC OFFSET $1 LIMIT $2',
          [skip, limit]
        )
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: rows }),
        }
      }
    } else if (method === 'PUT') {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing request body' }),
        }
      }
      let payload: unknown
      try {
        payload = JSON.parse(event.body)
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Malformed JSON' }),
        }
      }
      const data = updateSchema.parse(payload)
      const fields: string[] = []
      const values: any[] = []
      let idx = 1
      if (data.email) {
        fields.push(`email = $${idx++}`)
        values.push(data.email)
      }
      if (data.name) {
        fields.push(`name = $${idx++}`)
        values.push(data.name)
      }
      if (data.role) {
        fields.push(`role = $${idx++}`)
        values.push(data.role)
      }
      if (fields.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No fields to update' }),
        }
      }
      values.push(data.id)
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, created_at`
      const { rows } = await db.query(query, values)
      if (rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' }),
        }
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: rows[0] }),
      }
    } else if (method === 'DELETE') {
      const schema = z.object({ id: z.string().uuid() })
      const params = schema.parse(event.queryStringParameters || {})
      const { rows } = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [params.id]
      )
      if (rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' }),
        }
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: { id: rows[0].id } }),
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      }
    }
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request', issues }),
      }
    }
    console.error(err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}
