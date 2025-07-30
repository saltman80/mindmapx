import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { verifyAuth0Token } from '../lib/auth.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    await verifyAuth0Token(new Request('http://localhost', { headers: event.headers as any }))
    return { statusCode: 200, body: JSON.stringify({ data: 'protected content' }) }
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }
}
