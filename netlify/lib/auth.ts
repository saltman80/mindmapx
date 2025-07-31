import type { HandlerEvent } from '@netlify/functions'
import jwt from 'jsonwebtoken'

function extractBearerToken(headers: { [key: string]: string | undefined }): string | null {
  const authHeader = headers.authorization || (headers as any).Authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
}

export function requireAuth(event: HandlerEvent): { userId: string; email: string } {
  const token = extractBearerToken(event.headers as any)
  if (!token) {
    const error = new Error('Missing token')
    ;(error as any).statusCode = 401
    throw error
  }
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
  return payload
}
