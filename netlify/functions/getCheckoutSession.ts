import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { stripe } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const sessionId = event.queryStringParameters?.session_id
  if (!sessionId) {
    return jsonResponse(400, { success: false, message: 'Missing session_id' })
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const email =
      session.customer_details?.email || session.customer_email || null
    return jsonResponse(200, { success: true, email })
  } catch (err) {
    console.error('Failed to retrieve checkout session', err)
    return jsonResponse(500, { success: false, message: 'Internal Server Error' })
  }
}
