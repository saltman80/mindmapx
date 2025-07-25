import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z, ZodError } from 'zod'
import bcrypt from 'bcrypt'
import { createSession } from './auth.js'

const { DATABASE_URL: LOCAL_DB, NETLIFY_DATABASE_URL, SALT_ROUNDS = '10' } = process.env
const DATABASE_URL = LOCAL_DB || NETLIFY_DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  throw new Error('Missing required environment variables')
}
console.info(
  `register using ${LOCAL_DB ? 'DATABASE_URL' : 'NETLIFY_DATABASE_URL'} connection`
)

const registerSchema = z.object({
  email: z.string().email().transform((s: string) => s.trim().toLowerCase()),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

const allowedOrigin = process.env.CORS_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }
  let parsedBody: any
  try {
    parsedBody = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }
  let email: string, password: string, name: string | undefined
  try {
    ;({ email, password, name } = registerSchema.parse(parsedBody))
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.errors }),
      }
    }
    throw error
  }
  const client = await getClient()
  try {
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    const count = existingUser.rowCount ?? 0
    if (count > 0) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email already registered' }),
      }
    }
    const passwordHash = await bcrypt.hash(password, parseInt(SALT_ROUNDS))
    const result = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name || null]
    )
    const user = result.rows[0]
    const token = await createSession(user.id)
    const cookieParts = [
      `session=${token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Strict',
      'Secure'
    ]
    return {
      statusCode: 201,
      headers: { ...corsHeaders, 'Set-Cookie': cookieParts.join('; ') },
      body: JSON.stringify({ success: true, user }),
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  } finally {
    client.release()
  }
}


