import type { HandlerEvent } from '@netlify/functions'
import jwt from 'jsonwebtoken'
import cookie from 'cookie'

function extractBearerToken(headers: { [key: string]: string | undefined }): string | null {
  const authHeader = headers.authorization || (headers as any).Authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
}

function extractTokenFromCookies(headers: { [key: string]: string | undefined }): string | null {
  const cookies = cookie.parse(headers.cookie || '')
  return cookies.session || cookies.token || null
}

export function requireAuth(event: HandlerEvent): { userId: string; email: string; role?: string } {
  const cookieToken = extractTokenFromCookies(event.headers as any)
  const bearerToken = extractBearerToken(event.headers as any)
  const token = bearerToken || cookieToken
  if (!token) throw new Error('Missing token')
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string; role?: string }
  return payload
}
