import type { HandlerEvent } from '@netlify/functions'
import jwt from 'jsonwebtoken'

function extractBearerToken(headers: { [key: string]: string | undefined }): string | null {
  const authHeader = headers.authorization || headers.Authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
}

export function requireAuth(event: HandlerEvent): { userId: string; email: string } {
  const token = extractBearerToken(event.headers)
  if (!token) throw new Error('Missing token')

  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
  return payload
}
