import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { createHash } from 'crypto'
import bcrypt from 'bcrypt'

const MAX_TOKEN_ATTEMPTS = 5
const TOKEN_WINDOW_MS = 15 * 60 * 1000
type Attempt = { count: number; firstAttempt: number }
const tokenAttempts = new Map<string, Attempt>()

async function validateResetToken(token: string): Promise<string | null> {
  const now = Date.now()
  const attempt = tokenAttempts.get(token)
  if (attempt) {
    if (now - attempt.firstAttempt < TOKEN_WINDOW_MS && attempt.count >= MAX_TOKEN_ATTEMPTS) {
      return null
    }
    if (now - attempt.firstAttempt >= TOKEN_WINDOW_MS) {
      tokenAttempts.delete(token)
    }
  }
  const hashedToken = createHash('sha256').update(token).digest('hex')
  const client = await getClient()
  const { rows } = await client.query(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1',
    [hashedToken]
  )
  if (rows.length === 0) {
    if (attempt) {
      attempt.count++
    } else {
      tokenAttempts.set(token, { count: 1, firstAttempt: now })
    }
    return null
  }
  tokenAttempts.delete(token)
  const { user_id, expires_at } = rows[0]
  if (new Date(expires_at) < new Date()) {
    await client.query('DELETE FROM password_reset_tokens WHERE token_hash = $1', [hashedToken])
    client.release()
    return null
  }
  client.release()
  return user_id
}

async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
  const passwordHash = await bcrypt.hash(newPassword, saltRounds)
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    )
    if (result.rowCount === 0) throw new Error('User not found')
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
    }
  }
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Missing request body' })
    }
  }
  let data: { token?: string; newPassword?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Invalid JSON' })
    }
  }
  const { token, newPassword } = data
  if (typeof token !== 'string' || token.trim() === '') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Invalid token' })
    }
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Password must be between 8 and 128 characters' })
    }
  }
  const complexityRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/
  if (!complexityRegex.test(newPassword)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Password must include uppercase, lowercase, number, and special character'
      })
    }
  }
  try {
    const userId = await validateResetToken(token)
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Invalid or expired token' })
      }
    }
    await updatePassword(userId, newPassword)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    console.error('Reset password error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Internal server error' })
    }
  }
}