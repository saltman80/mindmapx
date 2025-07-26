import type { HandlerEvent } from '@netlify/functions'
import { extractToken, verifySession } from './auth.js'

export async function requireAuth(event: HandlerEvent): Promise<string> {
  const token = extractToken(event)
  if (!token) {
    throw new Error('Unauthorized')
  }
  const session = await verifySession(token)
  return session.userId
}
