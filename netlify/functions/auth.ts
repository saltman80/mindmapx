import type { HandlerEvent } from '@netlify/functions'
import jwt from 'jsonwebtoken'

export interface SessionPayload {
  userId: string
  sessionStart?: number
  iat?: number
  exp?: number
}

export function extractToken(event: HandlerEvent): string | null {
  const auth = event.headers.authorization || event.headers.Authorization
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7)
  }
  const cookie = event.headers.cookie || event.headers.Cookie
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

export function verifySession(token: string): SessionPayload {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
  if (typeof decoded === 'string') throw new Error('Invalid token')
  const payload = decoded as SessionPayload
  if (payload.sessionStart) {
    const maxAge = 24 * 60 * 60 * 1000
    if (Date.now() - payload.sessionStart > maxAge) {
      throw new Error('Session expired')
    }
  }
  return payload
}
