import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z } from 'zod'
import { extractToken, verifySession } from './auth.js'

const querySchema = z.object({
  page: z
    .preprocess(v => (v ? parseInt(v as string, 10) : 1), z.number().int().positive())
    .default(1),
  limit: z
    .preprocess(v => (v ? parseInt(v as string, 10) : 10), z.number().int().positive().max(100))
    .default(10),
})

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  const headers = { 'Content-Type': 'application/json' }

  const token = extractToken(event)
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  let user: any
  try {
    user = await verifySession(token)
  } catch {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }
  if (user.role !== 'admin') {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  const params = querySchema.parse(event.queryStringParameters || {})
  const page = params.page
  const limit = params.limit
  const offset = (page - 1) * limit

  const client = await getClient()
  try {
    const { rows } = await client.query(
      'SELECT id, user_id, amount, currency, status, created_at FROM payments ORDER BY created_at DESC OFFSET $1 LIMIT $2',
      [offset, limit]
    )
    const { rows: countRows } = await client.query('SELECT COUNT(*) FROM payments')
    const total = Number(countRows[0].count)
    const hasNext = offset + limit < total
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ payments: rows, hasNext }),
    }
  } catch (err) {
    console.error('payments error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  } finally {
    client.release()
  }
}
