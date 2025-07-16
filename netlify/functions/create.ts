import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getClient } from './db-client.js'
import { verifyToken } from '../../jwtservice.js'
import { createMindMapSchema } from '../../validationschemas.js'
import { z, ZodError } from 'zod'

const db = getClient()
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

export const handler: Handler = async (event) => {
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

  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  if (!authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const token = authHeader.split(' ')[1]
  let userId: string
  try {
    const payload = verifyToken(token)
    userId = payload.userId
  } catch {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    }
  }

  let bodyObj: unknown
  try {
    bodyObj = event.body ? JSON.parse(event.body) : {}
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    }
  }

  let data: { title: string; description?: string }
  try {
    data = createMindMapSchema.parse(bodyObj)
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: err.errors })
      }
    }
    console.error(err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }

  try {
    const result = await db.query(
      `
        INSERT INTO mind_maps (user_id, title, description, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, user_id, title, description, created_at
      `,
      [userId, data.title, data.description ?? null]
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
  }
}