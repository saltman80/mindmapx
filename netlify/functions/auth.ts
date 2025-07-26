import type { HandlerEvent } from '@netlify/functions'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'

export interface SessionPayload {
  userId: string
  sessionStart?: number
  iat?: number
  exp?: number
}

export function extractToken(event: HandlerEvent): string | null {
  const auth = event.headers.authorization || event.headers.Authorization
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    return token || null
  }
  const cookies = cookie.parse(event.headers.cookie || '')
  return cookies.token || null
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as SessionPayload
}
