import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { verifyAuth0Token } from '../lib/auth.js'
import { jsonResponse } from '../lib/response.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    await verifyAuth0Token(new Request('http://localhost', { headers: event.headers as any }))
    return jsonResponse(200, { success: true, data: 'protected content' })
  } catch (err: any) {
    return jsonResponse(err.statusCode || 401, { success: false, message: 'Unauthorized' })
  }
}
