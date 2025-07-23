import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client'
import { extractToken, verifySession } from './auth'
import { createMindMapSchema } from './validationschemas'
import { z, ZodError } from 'zod'
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET']
REQUIRED_ENV.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`Environment variable ${name} is required`)
  }
})

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  const token = extractToken(event)
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }
  let userId: string
  try {
    const payload = verifySession(token) as { userId: string }
    userId = payload.userId
  } catch {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    }
  }

  let data: { title: string; description: string }
  try {
    const parsed = JSON.parse(event.body ?? '{}') as {
      title?: string
      description?: string
    }
    const { title, description } = parsed
    if (!title) throw new Error('Missing required field: title')
    if (!description) throw new Error('Missing required field: description')
    const payload: { title: string; description: string } = { title, description }
    createMindMapSchema.parse(payload)
    data = payload
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
    }
    if (err instanceof ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: err.errors })
      }
    }
    if (err instanceof Error && err.message.startsWith('Missing required field')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: err.message })
      }
    }
    console.error(err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }

  const db = await getClient()
  try {
    const result = await db.query(
      `
        INSERT INTO mindmaps (user_id, title, description, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, user_id, title, description, created_at
      `,
      [userId, data.title, data.description]
    )
    const mindMap = result.rows[0]
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ mindMap })
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  } finally {
    await db.release()
  }
}