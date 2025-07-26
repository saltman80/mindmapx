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
    return token || 'demo'
  }
  const cookies = cookie.parse(event.headers.cookie || '')
  return cookies.session || 'demo'
}

export function verifySession(token: string): SessionPayload {
  // Temporary stub implementation to bypass JWT verification
  // until the full authorization system is implemented.
  return { userId: 'demo-user' }
}
