import type { HandlerEvent } from '@netlify/functions'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookie from 'cookie'
import { createHash } from 'crypto'
import { pool } from './db-client.js'

export interface SessionPayload {
  userId: string
  email?: string
  role?: string
  sessionStart?: number
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET as string
const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10)

export function extractToken(event: HandlerEvent): string | null {
  const auth = event.headers.authorization || event.headers.Authorization
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    return token || null
  }
  const cookies = cookie.parse(event.headers.cookie || '')
  return cookies.session || cookies.token || null
}

function verifyJwt(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload
}

// Generate a JWT and store its hash in the database
export async function createSession(userId: string, email: string, role: string = 'user'): Promise<string> {
  const token = jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: `${SESSION_EXPIRY_HOURS}h`
  })
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
  const client = await pool.connect()
  try {
    await client.query(
      'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt]
    )
  } finally {
    client.release()
  }
  return token
}

export async function authenticateUser(email: string, password: string): Promise<{ userId: string; role: string }> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT id, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }
    const user = result.rows[0] as { id: string; password_hash: string; role: string }
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      throw new Error('Invalid password')
    }
    return { userId: user.id, role: user.role }
  } finally {
    client.release()
  }
}

export async function login(email: string, password: string): Promise<string> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (adminEmail && adminPassword && email === adminEmail) {
    if (password !== adminPassword) {
      throw new Error('Invalid password')
    }
    // Admin sessions are created like regular user sessions
    return createSession('admin', adminEmail, 'admin')
  }

  const { userId, role } = await authenticateUser(email, password)
  return createSession(userId, email, role)
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const payload = verifyJwt(token)
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    )
    if (rows.length === 0) {
      throw new Error('Session not found or expired')
    }
    return {
      userId: rows[0].user_id,
      email: payload.email,
      role: payload.role,
      sessionStart: payload.sessionStart,
      iat: payload.iat,
      exp: payload.exp
    }
  } finally {
    client.release()
  }
}
