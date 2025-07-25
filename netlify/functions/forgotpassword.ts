import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { randomBytes, createHmac } from 'crypto'
import { getClient } from './db-client.js'
const {
  DATABASE_URL,
  FRONTEND_URL,
  RESET_TOKEN_SECRET
} = process.env

if (!DATABASE_URL) throw new Error('Missing DATABASE_URL')
if (!FRONTEND_URL) throw new Error('Missing FRONTEND_URL')
if (!RESET_TOKEN_SECRET) throw new Error('Missing RESET_TOKEN_SECRET')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateResetToken(): string {
  return randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return createHmac('sha256', RESET_TOKEN_SECRET!).update(token).digest('hex')
}


export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod !== 'POST') {
    const headers: Record<string, string> = {
      'Content-Type': 'text/plain',
      Allow: 'POST'
    }
    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed'
    }
  }

  let email: string
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    email = body.email
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    }
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Valid email is required' })
    }
  }

  const normalizedEmail = email.toLowerCase().trim()
  const client = await getClient()

  try {
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    const count = userRes.rowCount ?? 0
    if (count > 0) {
      const userId = userRes.rows[0].id

      const rateRes = await client.query(
        "SELECT COUNT(*) FROM password_resets WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'",
        [userId]
      )
      const requestCount = parseInt(rateRes.rows[0].count, 10)

      if (requestCount < 5) {
        const token = generateResetToken()
        const tokenHash = hashToken(token)
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

        await client.query(
          'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
          [userId, tokenHash, expiresAt]
        )

      }
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    }
  } finally {
    client.release()
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'If that email is registered, you will receive a reset link shortly.' })
  }
}