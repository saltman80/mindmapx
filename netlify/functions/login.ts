import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z, ZodError } from 'zod'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const { DATABASE_URL: LOCAL_DB, NETLIFY_DATABASE_URL, JWT_SECRET } = process.env
const DATABASE_URL = LOCAL_DB || NETLIFY_DATABASE_URL
if (!DATABASE_URL || !JWT_SECRET) {
  console.error('Missing DATABASE_URL or JWT_SECRET')
  throw new Error('Missing required environment variables')
}
console.info(
  `login using ${LOCAL_DB ? 'DATABASE_URL' : 'NETLIFY_DATABASE_URL'} connection`
)

const loginSchema = z.object({
  email: z.string().email().transform((s: string) => s.trim().toLowerCase()),
  password: z.string().min(8),
})

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const failedLoginAttempts = new Map<string, number[]>()

const allowedOrigin = process.env.CORS_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
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
      headers: { ...corsHeaders, Allow: 'POST', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return {
      statusCode: 415,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unsupported Media Type' }),
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
    console.log('LOGIN BODY', { email, password })
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

  if (!email || !password) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing email or password' }),
    }
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0] || 'unknown'
  console.info(`Login attempt from ${ip} for ${email}`)
  const now = Date.now()
  const attempts = failedLoginAttempts.get(ip) || []
  const recent = attempts.filter(ts => now - ts < WINDOW_MS)

  if (recent.length >= MAX_ATTEMPTS) {
    return {
      statusCode: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Too many login attempts' }),
    }
  }

  failedLoginAttempts.set(ip, recent)

  const client = await getClient()
  try {
    const result = await client.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    )

    const count = result.rowCount ?? 0
    if (count === 0) {
      recent.push(now)
      failedLoginAttempts.set(ip, recent)
      console.warn(`Login failed for ${email} from ${ip}`)
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      }
    }

    const user = result.rows[0] as { id: string; password_hash: string }
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      recent.push(now)
      failedLoginAttempts.set(ip, recent)
      console.warn(`Login failed for ${email} from ${ip}`)
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid password' }),
      }
    }

    failedLoginAttempts.delete(ip)

    const token = jwt.sign(
      { userId: user.id, sessionStart: Date.now() },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const cookieParts = [
      `token=${token}`,
      'HttpOnly',
      'Path=/',
      'Secure',
      'Max-Age=604800'
    ]

    console.info(`Login successful for ${email} from ${ip}`)
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': cookieParts.join('; ')
      },
      body: JSON.stringify({ success: true, token })
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  } finally {
    client.release()
  }
}


