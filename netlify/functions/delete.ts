import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { z } from 'zod'
import { extractToken, verifySession } from './auth.js'
import { createClient } from '@vercel/postgres'
const dbUrl = process.env.NETLIFY_DATABASE_URL_UNPOOLED
console.info(
  `delete function using ${dbUrl ? 'NETLIFY_DATABASE_URL_UNPOOLED' : 'missing connection string'}`
)
const db = createClient({ connectionString: dbUrl })
const DeleteRequest = z.object({
  id: z.string().uuid(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

export const handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: 'DELETE' },
      body: '',
    }
  }

  try {
    // Authenticate
    const token = extractToken(event)
    if (!token) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    let payload: any
    try {
      payload = verifySession(token)
    } catch {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      }
    }
    const userId = payload.userId

    // Parse and validate body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing request body' }),
      }
    }

    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(event.body)
    } catch {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON' }),
      }
    }

    const parsed = DeleteRequest.safeParse(parsedBody)
    if (!parsed.success) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Validation error',
          details: parsed.error.format(),
        }),
      }
    }
    const { id } = parsed.data

    // Delete record
    const result = await db.sql`
      DELETE FROM todos
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `
    const deleted = result.rowCount ?? 0
    if (deleted === 0) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not Found' }),
      }
    }

    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}