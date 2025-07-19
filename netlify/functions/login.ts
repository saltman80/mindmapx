import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z, ZodError } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const { DATABASE_URL, JWT_SECRET } = process.env
if (!DATABASE_URL || !JWT_SECRET) {
  throw new Error('Missing required environment variables')
}
const pool = {
  async query(text: string, params?: any[]) {
    const client = await getClient()
    return client.query(text, params)
  }
}

const loginSchema = z.object({
  email: z.string().email().transform(s => s.trim().toLowerCase()),
  password: z.string().min(8),
})

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const failedLoginAttempts = new Map<string, number[]>()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
}

export const handler: Handler = async (event) => {
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
      headers: { ...corsHeaders, Allow: 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return {
      statusCode: 415,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unsupported Media Type, expected application/json' }),
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  let parsedBody: any
  try {
    parsedBody = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }

  let email: string, password: string
  try {
    ({ email, password } = loginSchema.parse(parsedBody))
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.errors }),
      }
    }
    throw error
  }

  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0] ||
    'unknown'
  const now = Date.now()
  const attempts = failedLoginAttempts.get(ip) || []
  const recent = attempts.filter(ts => now - ts < WINDOW_MS)
  if (recent.length >= MAX_ATTEMPTS) {
    return {
      statusCode: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
    }
  }
  failedLoginAttempts.set(ip, recent)

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    )
    if (result.rowCount === 0) {
      recent.push(now)
      failedLoginAttempts.set(ip, recent)
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email or password' }),
      }
    }

    const user = result.rows[0] as { id: string; password_hash: string }
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      recent.push(now)
      failedLoginAttempts.set(ip, recent)
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email or password' }),
      }
    }

    failedLoginAttempts.delete(ip)
    const token = jwt.sign(
      { userId: user.id, sessionStart: Date.now() },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    const cookieParts = [
      `session=${token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Lax',
      'Max-Age=86400'
    ]
    if (process.env.NODE_ENV === 'production') {
      cookieParts.push('Secure')
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': cookieParts.join('; ')
      },
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}