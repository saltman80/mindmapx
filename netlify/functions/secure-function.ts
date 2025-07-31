import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { requireAuth } from '../lib/auth.js'
import { jsonResponse } from '../lib/response.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    console.log(
      'Incoming Authorization Header:',
      event.headers.authorization
    )
    requireAuth(event)
    return jsonResponse(200, { success: true, data: 'protected content' })
  } catch (err: any) {
    return jsonResponse(err.statusCode || 401, { success: false, message: 'Unauthorized' })
  }
}
